/**
 * Billing API Controller
 * Handles all billing-related HTTP requests
 */

import { Request, Response } from 'express';
import { stripeService } from '../services/stripe.service';
import { subscriptionService } from '../services/subscription.service';
import { usageService } from '../services/usage.service';
import { webhookService } from '../services/webhook.service';
import { logger } from '../utils/logger';
import { supabase } from '../config/supabase.config';
import type {
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from '../types/billing.types';

export class BillingController {
  /**
   * GET /api/billing/plans
   * Get all available pricing plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const { data: plans, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_visible', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: plans,
      });
    } catch (error) {
      logger.error('Failed to get pricing plans', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get pricing plans',
      });
    }
  }

  /**
   * POST /api/billing/checkout
   * Create a checkout session for new subscription
   */
  async createCheckout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets req.user
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { pricing_plan_id, billing_cycle, success_url, cancel_url, discount_code } =
        req.body;

      // Validate input
      if (!pricing_plan_id || !billing_cycle || !success_url || !cancel_url) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      // Get or create customer
      const customer = await stripeService.getOrCreateCustomer(userId);

      // Create checkout session
      const session = await stripeService.createCheckoutSession({
        customerId: customer.id,
        pricingPlanId: pricing_plan_id,
        billingCycle: billing_cycle,
        successUrl: success_url,
        cancelUrl: cancel_url,
        trialDays: 14, // Default trial period
        discountCode: discount_code,
      });

      res.json({
        success: true,
        data: {
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      logger.error('Failed to create checkout session', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create checkout session',
      });
    }
  }

  /**
   * POST /api/billing/portal
   * Create billing portal session
   */
  async createPortalSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { return_url } = req.body;

      if (!return_url) {
        res.status(400).json({
          success: false,
          error: 'return_url is required',
        });
        return;
      }

      // Get customer
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      // Create portal session
      const session = await stripeService.createBillingPortalSession({
        customerId: customer.id,
        returnUrl: return_url,
      });

      res.json({
        success: true,
        data: {
          url: session.url,
        },
      });
    } catch (error) {
      logger.error('Failed to create portal session', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to create portal session',
      });
    }
  }

  /**
   * GET /api/billing/subscription
   * Get current subscription
   */
  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const subscription = await subscriptionService.getActiveSubscription(userId);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
        return;
      }

      res.json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error('Failed to get subscription', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get subscription',
      });
    }
  }

  /**
   * PUT /api/billing/subscription/:id
   * Update subscription (upgrade/downgrade)
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const updateRequest: UpdateSubscriptionRequest = req.body;

      // Verify subscription belongs to user
      const subscription = await subscriptionService.getSubscription(id);
      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
        });
        return;
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', subscription.customer_id)
        .single();

      if (customer?.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
        return;
      }

      // Update subscription
      const updatedSubscription = await subscriptionService.updateSubscription(
        id,
        updateRequest
      );

      res.json({
        success: true,
        data: updatedSubscription,
      });
    } catch (error) {
      logger.error('Failed to update subscription', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription',
      });
    }
  }

  /**
   * DELETE /api/billing/subscription/:id
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const { immediately } = req.query;

      // Verify subscription belongs to user
      const subscription = await subscriptionService.getSubscription(id);
      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
        });
        return;
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', subscription.customer_id)
        .single();

      if (customer?.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
        return;
      }

      // Cancel subscription
      if (immediately === 'true') {
        await subscriptionService.cancelSubscriptionImmediately(id);
      } else {
        await subscriptionService.updateSubscription(id, {
          cancel_at_period_end: true,
        });
      }

      res.json({
        success: true,
        message: 'Subscription canceled successfully',
      });
    } catch (error) {
      logger.error('Failed to cancel subscription', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription',
      });
    }
  }

  /**
   * POST /api/billing/subscription/:id/reactivate
   * Reactivate canceled subscription
   */
  async reactivateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { id } = req.params;

      // Verify subscription belongs to user
      const subscription = await subscriptionService.getSubscription(id);
      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found',
        });
        return;
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', subscription.customer_id)
        .single();

      if (customer?.user_id !== userId) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
        });
        return;
      }

      // Reactivate subscription
      const reactivatedSubscription =
        await subscriptionService.reactivateSubscription(id);

      res.json({
        success: true,
        data: reactivatedSubscription,
      });
    } catch (error) {
      logger.error('Failed to reactivate subscription', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to reactivate subscription',
      });
    }
  }

  /**
   * GET /api/billing/usage
   * Get current usage
   */
  async getUsage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const subscription = await subscriptionService.getActiveSubscription(userId);
      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'No active subscription found',
        });
        return;
      }

      const [currentUsage, limits] = await Promise.all([
        usageService.getCurrentPeriodUsage(subscription.id),
        usageService.getUsageLimits(subscription.id),
      ]);

      res.json({
        success: true,
        data: {
          current: currentUsage,
          limits,
          period: {
            start: subscription.current_period_start,
            end: subscription.current_period_end,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to get usage', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get usage',
      });
    }
  }

  /**
   * GET /api/billing/invoices
   * Get customer invoices
   */
  async getInvoices(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!customer) {
        res.status(404).json({
          success: false,
          error: 'Customer not found',
        });
        return;
      }

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      logger.error('Failed to get invoices', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get invoices',
      });
    }
  }

  /**
   * POST /api/billing/webhooks/stripe
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      if (!signature) {
        res.status(400).json({
          success: false,
          error: 'Missing stripe-signature header',
        });
        return;
      }

      // Construct event from webhook
      const event = webhookService.constructEvent(req.body, signature);

      // Handle event asynchronously
      webhookService.handleEvent(event).catch((error) => {
        logger.error('Error in webhook handler', { error, eventType: event.type });
      });

      // Respond immediately to Stripe
      res.json({ received: true });
    } catch (error) {
      logger.error('Webhook error', { error });
      res.status(400).json({
        success: false,
        error: 'Webhook error',
      });
    }
  }
}

export const billingController = new BillingController();
