/**
 * Stripe Webhook Handler Service
 * Processes Stripe webhook events and updates database accordingly
 */

import Stripe from 'stripe';
import { stripe, stripeConfig } from '../config/stripe.config';
import { supabase } from '../config/supabase.config';
import { logger } from '../utils/logger';
import { subscriptionService } from './subscription.service';
import type { SubscriptionStatus } from '../types/billing.types';

export class WebhookService {
  /**
   * Verify and construct webhook event
   */
  constructEvent(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        stripeConfig.webhookSecret
      );
    } catch (error) {
      logger.error('Webhook signature verification failed', { error });
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Handle webhook event
   */
  async handleEvent(event: Stripe.Event): Promise<void> {
    logger.info('Processing webhook event', { type: event.type, id: event.id });

    try {
      switch (event.type) {
        // Customer events
        case 'customer.created':
          await this.handleCustomerCreated(event.data.object as Stripe.Customer);
          break;
        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object as Stripe.Customer);
          break;
        case 'customer.deleted':
          await this.handleCustomerDeleted(event.data.object as Stripe.Customer);
          break;

        // Subscription events
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription
          );
          break;
        case 'customer.subscription.trial_will_end':
          await this.handleSubscriptionTrialWillEnd(
            event.data.object as Stripe.Subscription
          );
          break;

        // Invoice events
        case 'invoice.created':
          await this.handleInvoiceCreated(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.finalized':
          await this.handleInvoiceFinalized(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        // Payment events
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(
            event.data.object as Stripe.PaymentIntent
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        // Payment method events
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(
            event.data.object as Stripe.PaymentMethod
          );
          break;
        case 'payment_method.detached':
          await this.handlePaymentMethodDetached(
            event.data.object as Stripe.PaymentMethod
          );
          break;

        default:
          logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Error handling webhook event', { error, eventType: event.type });
      throw error;
    }
  }

  // Customer event handlers
  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    logger.info('Customer created in Stripe', { customerId: customer.id });
    // Customer is typically created through our API first
  }

  private async handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
    await supabase
      .from('customers')
      .update({
        billing_email: customer.email || undefined,
        default_payment_method_id: customer.invoice_settings.default_payment_method
          ? String(customer.invoice_settings.default_payment_method)
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customer.id);
  }

  private async handleCustomerDeleted(customer: Stripe.Customer): Promise<void> {
    await supabase
      .from('customers')
      .update({
        stripe_customer_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_customer_id', customer.id);
  }

  // Subscription event handlers
  private async handleSubscriptionCreated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const metadata = subscription.metadata;
    const customerId = metadata.customer_id;
    const pricingPlanId = metadata.pricing_plan_id;
    const billingCycle = metadata.billing_cycle as 'monthly' | 'annual';

    if (!customerId || !pricingPlanId) {
      logger.error('Missing metadata in subscription', { subscription });
      return;
    }

    // Get pricing plan
    const { data: plan } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('id', pricingPlanId)
      .single();

    if (!plan) {
      logger.error('Pricing plan not found', { pricingPlanId });
      return;
    }

    // Create subscription in database
    const { error } = await supabase.from('subscriptions').insert({
      customer_id: customerId,
      pricing_plan_id: pricingPlanId,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: subscription.items.data[0].id,
      status: this.mapStripeStatus(subscription.status),
      billing_cycle: billingCycle,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      amount_cents:
        billingCycle === 'annual'
          ? plan.annual_price_cents
          : plan.monthly_price_cents,
      currency: subscription.currency.toUpperCase(),
    });

    if (error) {
      logger.error('Failed to create subscription in database', { error });
      return;
    }

    // Record subscription change
    await subscriptionService.recordSubscriptionChange({
      subscriptionId: subscription.id,
      customerId,
      changeType: subscription.trial_end ? 'trial_started' : 'created',
      toPlanId: pricingPlanId,
      toAmountCents:
        billingCycle === 'annual'
          ? plan.annual_price_cents
          : plan.monthly_price_cents,
      initiatedBy: 'customer',
    });

    logger.info('Subscription created in database', { subscriptionId: subscription.id });
  }

  private async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!existingSubscription) {
      logger.error('Subscription not found in database', {
        subscriptionId: subscription.id,
      });
      return;
    }

    // Update subscription
    await supabase
      .from('subscriptions')
      .update({
        status: this.mapStripeStatus(subscription.status),
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        canceled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        ended_at: subscription.ended_at
          ? new Date(subscription.ended_at * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    logger.info('Subscription updated in database', {
      subscriptionId: subscription.id,
    });
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!existingSubscription) {
      return;
    }

    await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    // Record cancellation
    await subscriptionService.recordSubscriptionChange({
      subscriptionId: subscription.id,
      customerId: existingSubscription.customer_id,
      changeType: 'canceled',
      fromPlanId: existingSubscription.pricing_plan_id,
      initiatedBy: 'customer',
    });

    logger.info('Subscription deleted in database', {
      subscriptionId: subscription.id,
    });
  }

  private async handleSubscriptionTrialWillEnd(
    subscription: Stripe.Subscription
  ): Promise<void> {
    // Send notification to customer about trial ending
    logger.info('Trial will end soon', {
      subscriptionId: subscription.id,
      trialEnd: subscription.trial_end,
    });
    // TODO: Implement email notification
  }

  // Invoice event handlers
  private async handleInvoiceCreated(invoice: Stripe.Invoice): Promise<void> {
    if (!invoice.subscription) {
      return;
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription)
      .single();

    if (!subscription) {
      return;
    }

    await supabase.from('invoices').insert({
      customer_id: subscription.customer_id,
      subscription_id: subscription.id,
      stripe_invoice_id: invoice.id,
      invoice_number: invoice.number || undefined,
      status: invoice.status || 'draft',
      subtotal_cents: invoice.subtotal || 0,
      tax_cents: invoice.tax || 0,
      discount_cents: invoice.total_discount_amounts?.reduce(
        (sum, d) => sum + d.amount,
        0
      ) || 0,
      total_cents: invoice.total || 0,
      amount_paid_cents: invoice.amount_paid || 0,
      amount_due_cents: invoice.amount_due || 0,
      currency: invoice.currency.toUpperCase(),
      invoice_date: new Date(invoice.created * 1000).toISOString(),
      due_date: invoice.due_date
        ? new Date(invoice.due_date * 1000).toISOString()
        : new Date(invoice.created * 1000).toISOString(),
      period_start: new Date(invoice.period_start! * 1000).toISOString(),
      period_end: new Date(invoice.period_end! * 1000).toISOString(),
      hosted_invoice_url: invoice.hosted_invoice_url || undefined,
    });

    logger.info('Invoice created in database', { invoiceId: invoice.id });
  }

  private async handleInvoiceFinalized(invoice: Stripe.Invoice): Promise<void> {
    await supabase
      .from('invoices')
      .update({
        status: 'open',
        invoice_pdf_url: invoice.invoice_pdf || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_invoice_id', invoice.id);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        amount_paid_cents: invoice.amount_paid,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_invoice_id', invoice.id);

    logger.info('Invoice paid', { invoiceId: invoice.id });
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('attempt_count')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    const attemptCount = (existingInvoice?.attempt_count || 0) + 1;

    await supabase
      .from('invoices')
      .update({
        status: 'open',
        attempt_count: attemptCount,
        payment_failure_reason: invoice.last_finalization_error?.message || 'Unknown error',
        next_payment_attempt: invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_invoice_id', invoice.id);

    logger.warn('Invoice payment failed', {
      invoiceId: invoice.id,
      attemptCount,
    });

    // TODO: Send notification to customer
  }

  // Payment event handlers
  private async handlePaymentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
  }

  private async handlePaymentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    logger.warn('Payment failed', {
      paymentIntentId: paymentIntent.id,
      error: paymentIntent.last_payment_error?.message,
    });
  }

  // Payment method event handlers
  private async handlePaymentMethodAttached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    if (!paymentMethod.customer) {
      return;
    }

    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('stripe_customer_id', paymentMethod.customer)
      .single();

    if (!customer) {
      return;
    }

    await supabase.from('payment_methods').insert({
      customer_id: customer.id,
      stripe_payment_method_id: paymentMethod.id,
      type: paymentMethod.type as any,
      card_brand: paymentMethod.card?.brand,
      card_last4: paymentMethod.card?.last4,
      card_exp_month: paymentMethod.card?.exp_month,
      card_exp_year: paymentMethod.card?.exp_year,
      card_country: paymentMethod.card?.country,
      bank_name: paymentMethod.us_bank_account?.bank_name,
      bank_last4: paymentMethod.us_bank_account?.last4,
    });

    logger.info('Payment method attached', { paymentMethodId: paymentMethod.id });
  }

  private async handlePaymentMethodDetached(
    paymentMethod: Stripe.PaymentMethod
  ): Promise<void> {
    await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('stripe_payment_method_id', paymentMethod.id);

    logger.info('Payment method detached', { paymentMethodId: paymentMethod.id });
  }

  /**
   * Map Stripe subscription status to our status enum
   */
  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status
  ): SubscriptionStatus {
    const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
      active: 'active',
      canceled: 'canceled',
      incomplete: 'incomplete',
      incomplete_expired: 'canceled',
      past_due: 'past_due',
      trialing: 'trialing',
      unpaid: 'unpaid',
      paused: 'canceled',
    };

    return statusMap[stripeStatus] || 'canceled';
  }
}

export const webhookService = new WebhookService();
