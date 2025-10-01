/**
 * Usage Tracking and Metering Service
 * Tracks customer usage of storage, API requests, and PDF overlays
 */

import { supabase } from '../config/supabase.config';
import { stripeService } from './stripe.service';
import { logger } from '../utils/logger';
import type {
  UsageRecord,
  UsageReportRequest,
  UsageType,
} from '../types/billing.types';

export class UsageService {
  /**
   * Report usage
   */
  async reportUsage(request: UsageReportRequest): Promise<UsageRecord> {
    try {
      // Get subscription
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', request.subscription_id)
        .single();

      if (subError || !subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate period
      const timestamp = request.timestamp || new Date();
      const periodStart = new Date(subscription.current_period_start);
      const periodEnd = new Date(subscription.current_period_end);

      // Validate timestamp is within current period
      if (timestamp < periodStart || timestamp > periodEnd) {
        throw new Error('Usage timestamp outside current billing period');
      }

      // Record usage in database
      const { data: usageRecord, error: usageError } = await supabase
        .from('usage_records')
        .insert({
          subscription_id: request.subscription_id,
          customer_id: subscription.customer_id,
          usage_type: request.usage_type,
          quantity: request.quantity,
          unit: this.getUnitForUsageType(request.usage_type),
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          is_billable: subscription.metered_billing_enabled,
        })
        .select()
        .single();

      if (usageError) {
        throw usageError;
      }

      // Report to Stripe if metered billing is enabled
      if (subscription.metered_billing_enabled && subscription.stripe_subscription_item_id) {
        await stripeService.reportUsage({
          subscriptionItemId: subscription.stripe_subscription_item_id,
          quantity: Math.round(request.quantity),
          timestamp: Math.floor(timestamp.getTime() / 1000),
        });
      }

      logger.info('Usage recorded', {
        subscriptionId: request.subscription_id,
        usageType: request.usage_type,
        quantity: request.quantity,
      });

      return usageRecord as UsageRecord;
    } catch (error) {
      logger.error('Failed to report usage', { error, request });
      throw error;
    }
  }

  /**
   * Get current period usage for subscription
   */
  async getCurrentPeriodUsage(
    subscriptionId: string
  ): Promise<Record<UsageType, number>> {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('current_period_start, current_period_end')
        .eq('id', subscriptionId)
        .single();

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const { data: usageRecords } = await supabase
        .from('usage_records')
        .select('usage_type, quantity')
        .eq('subscription_id', subscriptionId)
        .gte('period_start', subscription.current_period_start)
        .lte('period_end', subscription.current_period_end);

      // Aggregate usage by type
      const usage: Record<string, number> = {
        storage: 0,
        api_requests: 0,
        pdf_overlays: 0,
      };

      if (usageRecords) {
        for (const record of usageRecords) {
          usage[record.usage_type] = (usage[record.usage_type] || 0) + record.quantity;
        }
      }

      return usage as Record<UsageType, number>;
    } catch (error) {
      logger.error('Failed to get current period usage', { error, subscriptionId });
      throw error;
    }
  }

  /**
   * Get usage limits for subscription
   */
  async getUsageLimits(subscriptionId: string): Promise<{
    storage_gb: number;
    api_requests_per_month: number;
    pdf_overlays_per_month: number;
  }> {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        `
        pricing_plan_id,
        pricing_plans(storage_gb, api_requests_per_month, pdf_overlays_per_month)
      `
      )
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return subscription.pricing_plans as any;
  }

  /**
   * Check if usage is within limits
   */
  async checkUsageLimits(subscriptionId: string): Promise<{
    storage: { current: number; limit: number; exceeded: boolean };
    api_requests: { current: number; limit: number; exceeded: boolean };
    pdf_overlays: { current: number; limit: number; exceeded: boolean };
  }> {
    const [currentUsage, limits] = await Promise.all([
      this.getCurrentPeriodUsage(subscriptionId),
      this.getUsageLimits(subscriptionId),
    ]);

    return {
      storage: {
        current: currentUsage.storage || 0,
        limit: limits.storage_gb,
        exceeded: (currentUsage.storage || 0) > limits.storage_gb,
      },
      api_requests: {
        current: currentUsage.api_requests || 0,
        limit: limits.api_requests_per_month,
        exceeded: (currentUsage.api_requests || 0) > limits.api_requests_per_month,
      },
      pdf_overlays: {
        current: currentUsage.pdf_overlays || 0,
        limit: limits.pdf_overlays_per_month,
        exceeded: (currentUsage.pdf_overlays || 0) > limits.pdf_overlays_per_month,
      },
    };
  }

  /**
   * Get usage history
   */
  async getUsageHistory(
    subscriptionId: string,
    usageType?: UsageType,
    startDate?: Date,
    endDate?: Date
  ): Promise<UsageRecord[]> {
    let query = supabase
      .from('usage_records')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('recorded_at', { ascending: false });

    if (usageType) {
      query = query.eq('usage_type', usageType);
    }

    if (startDate) {
      query = query.gte('recorded_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('recorded_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to get usage history', { error, subscriptionId });
      return [];
    }

    return data as UsageRecord[];
  }

  /**
   * Get aggregated usage by period
   */
  async getAggregatedUsage(params: {
    subscriptionId: string;
    usageType?: UsageType;
    groupBy: 'day' | 'week' | 'month';
    startDate: Date;
    endDate: Date;
  }): Promise<Array<{ period: string; quantity: number }>> {
    try {
      const { data, error } = await supabase.rpc('get_aggregated_usage', {
        p_subscription_id: params.subscriptionId,
        p_usage_type: params.usageType,
        p_start_date: params.startDate.toISOString(),
        p_end_date: params.endDate.toISOString(),
        p_group_by: params.groupBy,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to get aggregated usage', { error, params });
      return [];
    }
  }

  /**
   * Track storage usage
   */
  async trackStorageUsage(params: {
    userId: string;
    storageBytes: number;
  }): Promise<void> {
    try {
      // Get active subscription
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', params.userId)
        .single();

      if (!customer) {
        logger.warn('No customer found for storage tracking', { userId: params.userId });
        return;
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('customer_id', customer.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (!subscription) {
        logger.warn('No active subscription for storage tracking', {
          userId: params.userId,
        });
        return;
      }

      // Convert bytes to GB
      const storageGB = params.storageBytes / (1024 * 1024 * 1024);

      await this.reportUsage({
        subscription_id: subscription.id,
        usage_type: 'storage',
        quantity: storageGB,
      });
    } catch (error) {
      logger.error('Failed to track storage usage', { error, params });
    }
  }

  /**
   * Track API request
   */
  async trackAPIRequest(params: {
    userId: string;
    endpoint?: string;
  }): Promise<void> {
    try {
      // Get active subscription
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', params.userId)
        .single();

      if (!customer) {
        return;
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('customer_id', customer.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (!subscription) {
        return;
      }

      await this.reportUsage({
        subscription_id: subscription.id,
        usage_type: 'api_requests',
        quantity: 1,
      });
    } catch (error) {
      logger.error('Failed to track API request', { error, params });
    }
  }

  /**
   * Track PDF overlay generation
   */
  async trackPDFOverlay(params: {
    userId: string;
    pdfId?: string;
  }): Promise<void> {
    try {
      // Get active subscription
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', params.userId)
        .single();

      if (!customer) {
        return;
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('customer_id', customer.id)
        .in('status', ['active', 'trialing'])
        .single();

      if (!subscription) {
        return;
      }

      await this.reportUsage({
        subscription_id: subscription.id,
        usage_type: 'pdf_overlays',
        quantity: 1,
      });
    } catch (error) {
      logger.error('Failed to track PDF overlay', { error, params });
    }
  }

  /**
   * Get unit for usage type
   */
  private getUnitForUsageType(usageType: UsageType): string {
    const unitMap: Record<UsageType, string> = {
      storage: 'gb',
      api_requests: 'requests',
      pdf_overlays: 'overlays',
    };

    return unitMap[usageType];
  }

  /**
   * Reset usage counters (called at start of new billing period)
   */
  async resetUsageCounters(subscriptionId: string): Promise<void> {
    try {
      // Mark all previous usage as billed
      await supabase
        .from('usage_records')
        .update({
          billed_at: new Date().toISOString(),
        })
        .eq('subscription_id', subscriptionId)
        .is('billed_at', null);

      logger.info('Usage counters reset', { subscriptionId });
    } catch (error) {
      logger.error('Failed to reset usage counters', { error, subscriptionId });
    }
  }
}

export const usageService = new UsageService();
