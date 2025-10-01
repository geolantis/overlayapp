/**
 * Subscription Management Service
 * Handles subscription lifecycle, upgrades, downgrades, and cancellations
 */

import { supabase } from '../config/supabase.config';
import { stripeService } from './stripe.service';
import { logger } from '../utils/logger';
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
  Subscription,
  SubscriptionChange,
  BillingCycle,
} from '../types/billing.types';

export class SubscriptionService {
  /**
   * Create a new subscription
   */
  async createSubscription(
    request: CreateSubscriptionRequest
  ): Promise<Subscription> {
    try {
      // Get or create customer
      const customer = await stripeService.getOrCreateCustomer(request.user_id);

      // Get pricing plan
      const { data: plan, error: planError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('id', request.pricing_plan_id)
        .single();

      if (planError || !plan) {
        throw new Error('Pricing plan not found');
      }

      // Create Stripe subscription
      const stripeSubscription = await stripeService.createSubscription({
        customerId: customer.id,
        pricingPlanId: request.pricing_plan_id,
        billingCycle: request.billing_cycle,
        paymentMethodId: request.payment_method_id,
        trialDays: request.trial_days,
      });

      // Get the created subscription from database (created by webhook)
      // Wait a bit for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', stripeSubscription.id)
        .single();

      if (subError || !subscription) {
        throw new Error('Failed to retrieve created subscription');
      }

      logger.info('Subscription created', {
        subscriptionId: subscription.id,
        customerId: customer.id,
      });

      return subscription as Subscription;
    } catch (error) {
      logger.error('Failed to create subscription', { error, request });
      throw error;
    }
  }

  /**
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(
    subscriptionId: string,
    request: UpdateSubscriptionRequest
  ): Promise<Subscription> {
    try {
      // Get current subscription
      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError || !currentSub) {
        throw new Error('Subscription not found');
      }

      // Handle plan change
      if (request.pricing_plan_id && request.billing_cycle) {
        const { data: newPlan } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('id', request.pricing_plan_id)
          .single();

        if (!newPlan) {
          throw new Error('New pricing plan not found');
        }

        const { data: oldPlan } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('id', currentSub.pricing_plan_id)
          .single();

        // Update in Stripe
        await stripeService.updateSubscription({
          subscriptionId: currentSub.stripe_subscription_id!,
          pricingPlanId: request.pricing_plan_id,
          billingCycle: request.billing_cycle,
        });

        // Determine if upgrade or downgrade
        const oldAmount =
          currentSub.billing_cycle === 'annual'
            ? oldPlan?.annual_price_cents
            : oldPlan?.monthly_price_cents;
        const newAmount =
          request.billing_cycle === 'annual'
            ? newPlan.annual_price_cents
            : newPlan.monthly_price_cents;

        const changeType =
          newAmount > oldAmount! ? 'upgraded' : 'downgraded';

        // Record change
        await this.recordSubscriptionChange({
          subscriptionId: currentSub.stripe_subscription_id!,
          customerId: currentSub.customer_id,
          changeType,
          fromPlanId: currentSub.pricing_plan_id,
          toPlanId: request.pricing_plan_id,
          fromAmountCents: oldAmount,
          toAmountCents: newAmount,
          initiatedBy: 'customer',
        });
      }

      // Handle cancellation
      if (request.cancel_at_period_end !== undefined) {
        await stripeService.cancelSubscription({
          subscriptionId: currentSub.stripe_subscription_id!,
          cancelAtPeriodEnd: request.cancel_at_period_end,
        });

        if (request.cancel_at_period_end) {
          await this.recordSubscriptionChange({
            subscriptionId: currentSub.stripe_subscription_id!,
            customerId: currentSub.customer_id,
            changeType: 'canceled',
            fromPlanId: currentSub.pricing_plan_id,
            initiatedBy: 'customer',
          });
        }
      }

      // Update metadata if provided
      if (request.metadata) {
        await supabase
          .from('subscriptions')
          .update({ metadata: request.metadata })
          .eq('id', subscriptionId);
      }

      // Get updated subscription
      const { data: updatedSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      logger.info('Subscription updated', { subscriptionId });

      return updatedSub as Subscription;
    } catch (error) {
      logger.error('Failed to update subscription', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Cancel subscription immediately
   */
  async cancelSubscriptionImmediately(subscriptionId: string): Promise<void> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Cancel in Stripe immediately
      await stripeService.cancelSubscription({
        subscriptionId: subscription.stripe_subscription_id!,
        cancelAtPeriodEnd: false,
      });

      // Record cancellation
      await this.recordSubscriptionChange({
        subscriptionId: subscription.stripe_subscription_id!,
        customerId: subscription.customer_id,
        changeType: 'canceled',
        fromPlanId: subscription.pricing_plan_id,
        initiatedBy: 'customer',
      });

      logger.info('Subscription canceled immediately', { subscriptionId });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Subscription> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.cancel_at_period_end) {
        throw new Error('Subscription is not scheduled for cancellation');
      }

      // Reactivate in Stripe
      await stripeService.cancelSubscription({
        subscriptionId: subscription.stripe_subscription_id!,
        cancelAtPeriodEnd: false,
      });

      // Record reactivation
      await this.recordSubscriptionChange({
        subscriptionId: subscription.stripe_subscription_id!,
        customerId: subscription.customer_id,
        changeType: 'reactivated',
        fromPlanId: subscription.pricing_plan_id,
        toPlanId: subscription.pricing_plan_id,
        initiatedBy: 'customer',
      });

      // Get updated subscription
      const { data: updatedSub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      logger.info('Subscription reactivated', { subscriptionId });

      return updatedSub as Subscription;
    } catch (error) {
      logger.error('Failed to reactivate subscription', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        customer:customers(*),
        plan:pricing_plans(*)
      `
      )
      .eq('id', subscriptionId)
      .single();

    if (error) {
      logger.error('Failed to get subscription', { error, subscriptionId });
      return null;
    }

    return data as Subscription;
  }

  /**
   * Get customer's active subscription
   */
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!customer) {
      return null;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        plan:pricing_plans(*)
      `
      )
      .eq('customer_id', customer.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return null;
    }

    return data as Subscription;
  }

  /**
   * Get subscription history
   */
  async getSubscriptionHistory(
    subscriptionId: string
  ): Promise<SubscriptionChange[]> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      return [];
    }

    const { data, error } = await supabase
      .from('subscription_changes')
      .select(
        `
        *,
        from_plan:pricing_plans!from_plan_id(*),
        to_plan:pricing_plans!to_plan_id(*)
      `
      )
      .eq('subscription_id', subscription.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get subscription history', { error, subscriptionId });
      return [];
    }

    return data as SubscriptionChange[];
  }

  /**
   * Record subscription change
   */
  async recordSubscriptionChange(params: {
    subscriptionId: string;
    customerId: string;
    changeType: SubscriptionChange['change_type'];
    fromPlanId?: string;
    toPlanId?: string;
    fromAmountCents?: number;
    toAmountCents?: number;
    prorationAmountCents?: number;
    reason?: string;
    initiatedBy: 'customer' | 'admin' | 'system';
  }): Promise<void> {
    try {
      // Get internal subscription ID
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_subscription_id', params.subscriptionId)
        .single();

      if (!subscription) {
        logger.error('Subscription not found for change recording', {
          subscriptionId: params.subscriptionId,
        });
        return;
      }

      await supabase.from('subscription_changes').insert({
        subscription_id: subscription.id,
        customer_id: params.customerId,
        change_type: params.changeType,
        from_plan_id: params.fromPlanId,
        to_plan_id: params.toPlanId,
        from_amount_cents: params.fromAmountCents,
        to_amount_cents: params.toAmountCents,
        proration_amount_cents: params.prorationAmountCents,
        reason: params.reason,
        initiated_by: params.initiatedBy,
      });

      logger.info('Subscription change recorded', {
        subscriptionId: params.subscriptionId,
        changeType: params.changeType,
      });
    } catch (error) {
      logger.error('Failed to record subscription change', { error, params });
    }
  }

  /**
   * Check if user has active subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(userId);
    return subscription !== null;
  }

  /**
   * Get subscription usage limits
   */
  async getSubscriptionLimits(userId: string): Promise<{
    storage_gb: number;
    api_requests_per_month: number;
    pdf_overlays_per_month: number;
    team_members_limit: number;
  } | null> {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return null;
    }

    const { data: plan } = await supabase
      .from('pricing_plans')
      .select('storage_gb, api_requests_per_month, pdf_overlays_per_month, team_members_limit')
      .eq('id', subscription.pricing_plan_id)
      .single();

    return plan;
  }

  /**
   * Get subscriptions expiring soon (for notifications)
   */
  async getExpiringSubscriptions(daysAhead: number = 7): Promise<Subscription[]> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysAhead);

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('cancel_at_period_end', true)
      .lte('current_period_end', expirationDate.toISOString())
      .gte('current_period_end', new Date().toISOString());

    if (error) {
      logger.error('Failed to get expiring subscriptions', { error });
      return [];
    }

    return data as Subscription[];
  }
}

export const subscriptionService = new SubscriptionService();
