/**
 * Analytics Service
 * Provides revenue metrics, churn analysis, and usage analytics
 */

import { supabase } from '../config/supabase.config';
import { logger } from '../utils/logger';
import type {
  RevenueAnalytics,
  ChurnAnalysis,
  RevenueBreakdown,
} from '../types/billing.types';

export class AnalyticsService {
  /**
   * Calculate Monthly Recurring Revenue (MRR)
   */
  async calculateMRR(): Promise<number> {
    try {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('amount_cents, billing_cycle')
        .in('status', ['active', 'trialing']);

      if (!subscriptions) {
        return 0;
      }

      let totalMRR = 0;
      for (const sub of subscriptions) {
        if (sub.billing_cycle === 'annual') {
          // Convert annual to monthly
          totalMRR += sub.amount_cents / 12;
        } else {
          totalMRR += sub.amount_cents;
        }
      }

      return Math.round(totalMRR);
    } catch (error) {
      logger.error('Failed to calculate MRR', { error });
      return 0;
    }
  }

  /**
   * Calculate Annual Recurring Revenue (ARR)
   */
  async calculateARR(): Promise<number> {
    const mrr = await this.calculateMRR();
    return mrr * 12;
  }

  /**
   * Calculate churn rate
   */
  async calculateChurnRate(
    periodStart: Date,
    periodEnd: Date
  ): Promise<ChurnAnalysis> {
    try {
      // Get customers at start of period
      const { data: startCustomers } = await supabase
        .from('subscriptions')
        .select('customer_id')
        .in('status', ['active', 'trialing'])
        .lte('created_at', periodStart.toISOString());

      const startCount = new Set(
        startCustomers?.map((s) => s.customer_id) || []
      ).size;

      // Get customers who churned during period
      const { data: churnedSubs } = await supabase
        .from('subscription_changes')
        .select('customer_id, reason')
        .eq('change_type', 'canceled')
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString());

      const churnedCount = new Set(
        churnedSubs?.map((s) => s.customer_id) || []
      ).size;

      // Aggregate churn reasons
      const reasons: Record<string, number> = {};
      for (const sub of churnedSubs || []) {
        const reason = sub.reason || 'No reason provided';
        reasons[reason] = (reasons[reason] || 0) + 1;
      }

      // Get customers at end of period
      const { data: endCustomers } = await supabase
        .from('subscriptions')
        .select('customer_id')
        .in('status', ['active', 'trialing'])
        .lte('created_at', periodEnd.toISOString());

      const endCount = new Set(endCustomers?.map((s) => s.customer_id) || []).size;

      const churnRate = startCount > 0 ? (churnedCount / startCount) * 100 : 0;

      return {
        period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
        total_customers_start: startCount,
        total_customers_end: endCount,
        churned_customers: churnedCount,
        churn_rate: parseFloat(churnRate.toFixed(2)),
        reasons,
      };
    } catch (error) {
      logger.error('Failed to calculate churn rate', { error });
      throw error;
    }
  }

  /**
   * Get revenue breakdown
   */
  async getRevenueBreakdown(
    periodStart: Date,
    periodEnd: Date
  ): Promise<RevenueBreakdown> {
    try {
      // Get all paid invoices in period
      const { data: invoices } = await supabase
        .from('invoices')
        .select(
          `
          *,
          subscription:subscriptions(pricing_plan_id),
          line_items:invoice_line_items(*)
        `
        )
        .eq('status', 'paid')
        .gte('paid_at', periodStart.toISOString())
        .lte('paid_at', periodEnd.toISOString());

      if (!invoices) {
        return {
          period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
          subscription_revenue: 0,
          usage_revenue: 0,
          one_time_revenue: 0,
          total_revenue: 0,
          by_plan: {},
          by_region: {},
        };
      }

      let subscriptionRevenue = 0;
      let usageRevenue = 0;
      let oneTimeRevenue = 0;
      const byPlan: Record<string, number> = {};
      const byRegion: Record<string, number> = {};

      for (const invoice of invoices as any[]) {
        const totalCents = invoice.total_cents;

        // Aggregate by revenue type
        for (const item of invoice.line_items || []) {
          if (item.item_type === 'subscription') {
            subscriptionRevenue += item.amount_cents;
          } else if (item.item_type === 'usage') {
            usageRevenue += item.amount_cents;
          } else if (item.item_type === 'one_time') {
            oneTimeRevenue += item.amount_cents;
          }
        }

        // Aggregate by plan
        if (invoice.subscription?.pricing_plan_id) {
          const planId = invoice.subscription.pricing_plan_id;
          byPlan[planId] = (byPlan[planId] || 0) + totalCents;
        }

        // Aggregate by region (based on currency)
        const region = this.currencyToRegion(invoice.currency);
        byRegion[region] = (byRegion[region] || 0) + totalCents;
      }

      return {
        period: `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`,
        subscription_revenue: subscriptionRevenue,
        usage_revenue: usageRevenue,
        one_time_revenue: oneTimeRevenue,
        total_revenue: subscriptionRevenue + usageRevenue + oneTimeRevenue,
        by_plan: byPlan,
        by_region: byRegion,
      };
    } catch (error) {
      logger.error('Failed to get revenue breakdown', { error });
      throw error;
    }
  }

  /**
   * Calculate Customer Lifetime Value (LTV)
   */
  async calculateLTV(): Promise<number> {
    try {
      // Get average subscription value
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('amount_cents, billing_cycle, created_at, ended_at')
        .not('ended_at', 'is', null);

      if (!subscriptions || subscriptions.length === 0) {
        return 0;
      }

      let totalRevenue = 0;
      let totalLifetimeMonths = 0;

      for (const sub of subscriptions) {
        const startDate = new Date(sub.created_at);
        const endDate = new Date(sub.ended_at!);
        const lifetimeMonths =
          (endDate.getTime() - startDate.getTime()) /
          (1000 * 60 * 60 * 24 * 30);

        if (sub.billing_cycle === 'annual') {
          totalRevenue += (sub.amount_cents / 12) * lifetimeMonths;
        } else {
          totalRevenue += sub.amount_cents * lifetimeMonths;
        }

        totalLifetimeMonths += lifetimeMonths;
      }

      const averageLifetimeMonths = totalLifetimeMonths / subscriptions.length;
      const averageRevenuePerMonth = totalRevenue / totalLifetimeMonths;

      return Math.round(averageRevenuePerMonth * averageLifetimeMonths);
    } catch (error) {
      logger.error('Failed to calculate LTV', { error });
      return 0;
    }
  }

  /**
   * Get plan distribution
   */
  async getPlanDistribution(): Promise<Record<string, number>> {
    try {
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select('pricing_plan_id, pricing_plans(name)')
        .in('status', ['active', 'trialing']);

      const distribution: Record<string, number> = {};

      for (const sub of subscriptions as any[] || []) {
        const planName = sub.pricing_plans?.name || 'unknown';
        distribution[planName] = (distribution[planName] || 0) + 1;
      }

      return distribution;
    } catch (error) {
      logger.error('Failed to get plan distribution', { error });
      return {};
    }
  }

  /**
   * Aggregate analytics for a period
   */
  async aggregateAnalytics(
    periodType: 'daily' | 'weekly' | 'monthly' | 'yearly',
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    try {
      const [mrr, arr, churnRate, revenueBreakdown, ltv, planDistribution] =
        await Promise.all([
          this.calculateMRR(),
          this.calculateARR(),
          this.calculateChurnRate(periodStart, periodEnd),
          this.getRevenueBreakdown(periodStart, periodEnd),
          this.calculateLTV(),
          this.getPlanDistribution(),
        ]);

      // Get customer counts
      const { data: activeCustomers } = await supabase
        .from('subscriptions')
        .select('customer_id')
        .in('status', ['active', 'trialing']);

      const totalActiveCustomers = new Set(
        activeCustomers?.map((s) => s.customer_id) || []
      ).size;

      // Get subscription counts
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('status', 'active');

      const { data: trialSubscriptions } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('status', 'trialing');

      // Get usage totals
      const { data: usageRecords } = await supabase
        .from('usage_records')
        .select('usage_type, quantity')
        .gte('recorded_at', periodStart.toISOString())
        .lte('recorded_at', periodEnd.toISOString());

      let totalStorage = 0;
      let totalAPIRequests = 0;
      let totalPDFOverlays = 0;

      for (const record of usageRecords || []) {
        if (record.usage_type === 'storage') {
          totalStorage += record.quantity;
        } else if (record.usage_type === 'api_requests') {
          totalAPIRequests += record.quantity;
        } else if (record.usage_type === 'pdf_overlays') {
          totalPDFOverlays += record.quantity;
        }
      }

      // Store aggregated analytics
      await supabase.from('revenue_analytics').upsert(
        {
          period_type: periodType,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          mrr_cents: mrr,
          arr_cents: arr,
          total_revenue_cents: revenueBreakdown.total_revenue,
          new_customers: churnRate.total_customers_end - churnRate.total_customers_start + churnRate.churned_customers,
          churned_customers: churnRate.churned_customers,
          total_active_customers: totalActiveCustomers,
          active_subscriptions: activeSubscriptions?.length || 0,
          trial_subscriptions: trialSubscriptions?.length || 0,
          plan_distribution: planDistribution,
          total_storage_gb: parseFloat(totalStorage.toFixed(2)),
          total_api_requests: totalAPIRequests,
          total_pdf_overlays: totalPDFOverlays,
          churn_rate_percent: churnRate.churn_rate,
          ltv_cents: ltv,
        },
        {
          onConflict: 'period_type,period_start',
        }
      );

      logger.info('Analytics aggregated', {
        periodType,
        periodStart,
        periodEnd,
      });
    } catch (error) {
      logger.error('Failed to aggregate analytics', { error });
      throw error;
    }
  }

  /**
   * Get analytics for dashboard
   */
  async getDashboardAnalytics(days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [mrr, arr, churnRate, revenueBreakdown, ltv] = await Promise.all([
        this.calculateMRR(),
        this.calculateARR(),
        this.calculateChurnRate(startDate, endDate),
        this.getRevenueBreakdown(startDate, endDate),
        this.calculateLTV(),
      ]);

      return {
        mrr: mrr / 100, // Convert to dollars
        arr: arr / 100,
        churn_rate: churnRate.churn_rate,
        ltv: ltv / 100,
        revenue_breakdown: {
          subscription: revenueBreakdown.subscription_revenue / 100,
          usage: revenueBreakdown.usage_revenue / 100,
          one_time: revenueBreakdown.one_time_revenue / 100,
          total: revenueBreakdown.total_revenue / 100,
        },
        customer_metrics: {
          total_active: churnRate.total_customers_end,
          churned: churnRate.churned_customers,
        },
      };
    } catch (error) {
      logger.error('Failed to get dashboard analytics', { error });
      throw error;
    }
  }

  /**
   * Map currency to region
   */
  private currencyToRegion(currency: string): string {
    const regionMap: Record<string, string> = {
      USD: 'North America',
      CAD: 'North America',
      EUR: 'Europe',
      GBP: 'Europe',
      AUD: 'Australia',
      JPY: 'Asia',
      CNY: 'Asia',
    };

    return regionMap[currency] || 'Other';
  }
}

export const analyticsService = new AnalyticsService();
