/**
 * Stripe Service
 * Handles all Stripe API interactions for subscriptions, payments, and customers
 */

import Stripe from 'stripe';
import { stripe, stripeConfig } from '../config/stripe.config';
import { supabase } from '../config/supabase.config';
import { logger } from '../utils/logger';
import type {
  CreateSubscriptionRequest,
  BillingCycle,
  Customer,
  Subscription,
  PricingPlan,
} from '../types/billing.types';

export class StripeService {
  /**
   * Create a Stripe customer
   */
  async createCustomer(params: {
    email: string;
    userId: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: {
          user_id: params.userId,
          ...params.metadata,
        },
      });

      logger.info('Stripe customer created', {
        customerId: customer.id,
        userId: params.userId,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create Stripe customer', { error, params });
      throw error;
    }
  }

  /**
   * Get or create customer from database
   */
  async getOrCreateCustomer(userId: string): Promise<Customer> {
    // Check if customer exists in our database
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingCustomer && !fetchError) {
      return existingCustomer as Customer;
    }

    // Get user email from auth
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(
      userId
    );

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Create Stripe customer
    const stripeCustomer = await this.createCustomer({
      email: user.user.email!,
      userId: userId,
      name: user.user.user_metadata?.['full_name'],
    });

    // Create customer in our database
    const { data: newCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomer.id,
        billing_email: user.user.email!,
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create customer in database', { error: createError });
      throw createError;
    }

    return newCustomer as Customer;
  }

  /**
   * Create a checkout session for new subscription
   */
  async createCheckoutSession(params: {
    customerId: string;
    pricingPlanId: string;
    billingCycle: BillingCycle;
    successUrl: string;
    cancelUrl: string;
    trialDays?: number;
    discountCode?: string;
  }): Promise<Stripe.Checkout.Session> {
    try {
      // Get pricing plan from database
      const { data: plan, error: planError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('id', params.pricingPlanId)
        .single();

      if (planError || !plan) {
        throw new Error('Pricing plan not found');
      }

      // Get customer from database
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', params.customerId)
        .single();

      if (customerError || !customer) {
        throw new Error('Customer not found');
      }

      // Get correct Stripe price ID
      const stripePriceId =
        params.billingCycle === 'annual'
          ? plan.stripe_annual_price_id
          : plan.stripe_monthly_price_id;

      if (!stripePriceId) {
        throw new Error('Stripe price ID not configured for this plan');
      }

      // Build session parameters
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customer.stripe_customer_id,
        mode: 'subscription',
        payment_method_types: stripeConfig.paymentMethodTypes,
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        subscription_data: {
          metadata: {
            pricing_plan_id: params.pricingPlanId,
            customer_id: params.customerId,
            billing_cycle: params.billingCycle,
          },
        },
        automatic_tax: stripeConfig.automaticTax,
      };

      // Add trial period if specified
      if (params.trialDays) {
        sessionParams.subscription_data!.trial_period_days = params.trialDays;
      }

      // Add discount code if provided
      if (params.discountCode) {
        const promotionCode = await this.getPromotionCodeByName(params.discountCode);
        if (promotionCode) {
          sessionParams.discounts = [{ promotion_code: promotionCode.id }];
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      logger.info('Checkout session created', {
        sessionId: session.id,
        customerId: params.customerId,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create checkout session', { error, params });
      throw error;
    }
  }

  /**
   * Create a billing portal session
   */
  async createBillingPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('stripe_customer_id')
        .eq('id', params.customerId)
        .single();

      if (error || !customer) {
        throw new Error('Customer not found');
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        return_url: params.returnUrl,
      });

      return session;
    } catch (error) {
      logger.error('Failed to create billing portal session', { error, params });
      throw error;
    }
  }

  /**
   * Create or update subscription
   */
  async createSubscription(params: {
    customerId: string;
    pricingPlanId: string;
    billingCycle: BillingCycle;
    paymentMethodId?: string;
    trialDays?: number;
  }): Promise<Stripe.Subscription> {
    try {
      // Get customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', params.customerId)
        .single();

      if (customerError || !customer) {
        throw new Error('Customer not found');
      }

      // Get pricing plan
      const { data: plan, error: planError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('id', params.pricingPlanId)
        .single();

      if (planError || !plan) {
        throw new Error('Pricing plan not found');
      }

      // Get correct Stripe price ID
      const stripePriceId =
        params.billingCycle === 'annual'
          ? plan.stripe_annual_price_id
          : plan.stripe_monthly_price_id;

      if (!stripePriceId) {
        throw new Error('Stripe price ID not configured');
      }

      // Set default payment method if provided
      if (params.paymentMethodId) {
        await stripe.paymentMethods.attach(params.paymentMethodId, {
          customer: customer.stripe_customer_id,
        });

        await stripe.customers.update(customer.stripe_customer_id, {
          invoice_settings: {
            default_payment_method: params.paymentMethodId,
          },
        });
      }

      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.stripe_customer_id,
        items: [{ price: stripePriceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          pricing_plan_id: params.pricingPlanId,
          customer_id: params.customerId,
          billing_cycle: params.billingCycle,
        },
      };

      // Add trial if specified
      if (params.trialDays) {
        subscriptionParams.trial_period_days = params.trialDays;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      logger.info('Stripe subscription created', {
        subscriptionId: subscription.id,
        customerId: params.customerId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { error, params });
      throw error;
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(params: {
    subscriptionId: string;
    pricingPlanId: string;
    billingCycle: BillingCycle;
    prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
  }): Promise<Stripe.Subscription> {
    try {
      // Get pricing plan
      const { data: plan, error: planError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('id', params.pricingPlanId)
        .single();

      if (planError || !plan) {
        throw new Error('Pricing plan not found');
      }

      // Get correct Stripe price ID
      const stripePriceId =
        params.billingCycle === 'annual'
          ? plan.stripe_annual_price_id
          : plan.stripe_monthly_price_id;

      if (!stripePriceId) {
        throw new Error('Stripe price ID not configured');
      }

      // Get existing subscription
      const existingSubscription = await stripe.subscriptions.retrieve(
        params.subscriptionId
      );

      // Update subscription
      const subscription = await stripe.subscriptions.update(params.subscriptionId, {
        items: [
          {
            id: existingSubscription.items.data[0].id,
            price: stripePriceId,
          },
        ],
        proration_behavior: params.prorationBehavior || 'create_prorations',
        metadata: {
          ...existingSubscription.metadata,
          pricing_plan_id: params.pricingPlanId,
          billing_cycle: params.billingCycle,
        },
      });

      logger.info('Stripe subscription updated', {
        subscriptionId: subscription.id,
        newPlanId: params.pricingPlanId,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to update subscription', { error, params });
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(params: {
    subscriptionId: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(params.subscriptionId, {
        cancel_at_period_end: params.cancelAtPeriodEnd ?? true,
      });

      logger.info('Stripe subscription canceled', {
        subscriptionId: subscription.id,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      });

      return subscription;
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, params });
      throw error;
    }
  }

  /**
   * Report usage for metered billing
   */
  async reportUsage(params: {
    subscriptionItemId: string;
    quantity: number;
    timestamp?: number;
    action?: 'increment' | 'set';
  }): Promise<Stripe.UsageRecord> {
    try {
      const usageRecord = await stripe.subscriptionItems.createUsageRecord(
        params.subscriptionItemId,
        {
          quantity: params.quantity,
          timestamp: params.timestamp || Math.floor(Date.now() / 1000),
          action: params.action || 'set',
        }
      );

      logger.info('Usage reported to Stripe', {
        subscriptionItemId: params.subscriptionItemId,
        quantity: params.quantity,
      });

      return usageRecord;
    } catch (error) {
      logger.error('Failed to report usage', { error, params });
      throw error;
    }
  }

  /**
   * Get promotion code by name
   */
  private async getPromotionCodeByName(
    code: string
  ): Promise<Stripe.PromotionCode | null> {
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        code: code,
        active: true,
        limit: 1,
      });

      return promotionCodes.data[0] || null;
    } catch (error) {
      logger.error('Failed to get promotion code', { error, code });
      return null;
    }
  }

  /**
   * Retry failed payment
   */
  async retryInvoicePayment(invoiceId: string): Promise<Stripe.Invoice> {
    try {
      const invoice = await stripe.invoices.pay(invoiceId);

      logger.info('Invoice payment retried', { invoiceId: invoice.id });

      return invoice;
    } catch (error) {
      logger.error('Failed to retry invoice payment', { error, invoiceId });
      throw error;
    }
  }
}

export const stripeService = new StripeService();
