/**
 * Unit Tests: Subscription Service
 * Comprehensive testing of subscription lifecycle management
 */

import { SubscriptionService } from '../../src/services/subscription.service';
import { createMockSupabase, createMockLogger } from '../utils/mocks';
import {
  mockCustomer,
  mockPricingPlan,
  mockSubscription,
  mockStripeSubscription,
} from '../utils/factories';
import { pricingTiers, testScenarios } from '../utils/fixtures';

// Mock dependencies
jest.mock('../../src/config/supabase.config', () => ({
  supabase: createMockSupabase(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: createMockLogger(),
}));

jest.mock('../../src/services/stripe.service', () => ({
  stripeService: {
    getOrCreateCustomer: jest.fn(),
    createSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}));

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockSupabase: any;
  let mockStripeService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionService = new SubscriptionService();
    mockSupabase = require('../../src/config/supabase.config').supabase;
    mockStripeService = require('../../src/services/stripe.service').stripeService;
  });

  describe('createSubscription', () => {
    it('should create a new subscription successfully', async () => {
      const customer = mockCustomer();
      const plan = mockPricingPlan(pricingTiers.starter);
      const subscription = mockSubscription();

      mockStripeService.getOrCreateCustomer.mockResolvedValueOnce(customer);
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: plan, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      mockStripeService.createSubscription.mockResolvedValueOnce(
        mockStripeSubscription()
      );

      const result = await subscriptionService.createSubscription({
        user_id: 'user_123',
        pricing_plan_id: plan.id,
        billing_cycle: 'monthly',
      });

      expect(result).toBeDefined();
      expect(mockStripeService.createSubscription).toHaveBeenCalled();
    });

    it('should handle trial period if specified', async () => {
      const customer = mockCustomer();
      const plan = mockPricingPlan(pricingTiers.pro);

      mockStripeService.getOrCreateCustomer.mockResolvedValueOnce(customer);
      mockSupabase.from().single.mockResolvedValueOnce({
        data: plan,
        error: null,
      });

      await subscriptionService.createSubscription({
        user_id: 'user_123',
        pricing_plan_id: plan.id,
        billing_cycle: 'annual',
        trial_days: 14,
      });

      expect(mockStripeService.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          trialDays: 14,
        })
      );
    });

    it('should throw error if plan not found', async () => {
      const customer = mockCustomer();
      mockStripeService.getOrCreateCustomer.mockResolvedValueOnce(customer);
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Plan not found' },
      });

      await expect(
        subscriptionService.createSubscription({
          user_id: 'user_123',
          pricing_plan_id: 'invalid_plan',
          billing_cycle: 'monthly',
        })
      ).rejects.toThrow('Pricing plan not found');
    });
  });

  describe('updateSubscription', () => {
    it('should upgrade subscription successfully', async () => {
      const currentSub = mockSubscription({
        pricing_plan_id: pricingTiers.starter.id,
        amount_cents: 1000,
      });
      const newPlan = mockPricingPlan(pricingTiers.pro);
      const oldPlan = mockPricingPlan(pricingTiers.starter);

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: currentSub, error: null })
        .mockResolvedValueOnce({ data: newPlan, error: null })
        .mockResolvedValueOnce({ data: oldPlan, error: null })
        .mockResolvedValueOnce({ data: currentSub, error: null });

      mockStripeService.updateSubscription.mockResolvedValueOnce({
        id: 'sub_123',
      });

      const result = await subscriptionService.updateSubscription(
        currentSub.id,
        {
          pricing_plan_id: newPlan.id,
          billing_cycle: 'monthly',
        }
      );

      expect(result).toBeDefined();
      expect(mockStripeService.updateSubscription).toHaveBeenCalled();
    });

    it('should downgrade subscription successfully', async () => {
      const currentSub = mockSubscription({
        pricing_plan_id: pricingTiers.pro.id,
        amount_cents: 3000,
      });
      const newPlan = mockPricingPlan(pricingTiers.starter);
      const oldPlan = mockPricingPlan(pricingTiers.pro);

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: currentSub, error: null })
        .mockResolvedValueOnce({ data: newPlan, error: null })
        .mockResolvedValueOnce({ data: oldPlan, error: null })
        .mockResolvedValueOnce({ data: currentSub, error: null });

      mockStripeService.updateSubscription.mockResolvedValueOnce({
        id: 'sub_123',
      });

      const result = await subscriptionService.updateSubscription(
        currentSub.id,
        {
          pricing_plan_id: newPlan.id,
          billing_cycle: 'monthly',
        }
      );

      expect(result).toBeDefined();
    });

    it('should schedule cancellation at period end', async () => {
      const subscription = mockSubscription();
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: subscription, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      mockStripeService.cancelSubscription.mockResolvedValueOnce({
        id: 'sub_123',
        cancel_at_period_end: true,
      });

      const result = await subscriptionService.updateSubscription(
        subscription.id,
        {
          cancel_at_period_end: true,
        }
      );

      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: subscription.stripe_subscription_id,
        cancelAtPeriodEnd: true,
      });
    });

    it('should throw error if subscription not found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        subscriptionService.updateSubscription('invalid_id', {
          pricing_plan_id: 'plan_123',
        })
      ).rejects.toThrow('Subscription not found');
    });
  });

  describe('cancelSubscriptionImmediately', () => {
    it('should cancel subscription immediately', async () => {
      const subscription = mockSubscription();
      mockSupabase.from().single.mockResolvedValueOnce({
        data: subscription,
        error: null,
      });

      mockStripeService.cancelSubscription.mockResolvedValueOnce({
        id: 'sub_123',
        status: 'canceled',
      });

      await subscriptionService.cancelSubscriptionImmediately(subscription.id);

      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: subscription.stripe_subscription_id,
        cancelAtPeriodEnd: false,
      });
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate a canceled subscription', async () => {
      const subscription = mockSubscription({
        cancel_at_period_end: true,
      });

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: subscription, error: null })
        .mockResolvedValueOnce({ data: { user_id: 'user_123' }, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      mockStripeService.cancelSubscription.mockResolvedValueOnce({
        id: 'sub_123',
        cancel_at_period_end: false,
      });

      const result = await subscriptionService.reactivateSubscription(
        subscription.id
      );

      expect(result).toBeDefined();
      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: subscription.stripe_subscription_id,
        cancelAtPeriodEnd: false,
      });
    });

    it('should throw error if subscription not scheduled for cancellation', async () => {
      const subscription = mockSubscription({
        cancel_at_period_end: false,
      });

      mockSupabase.from().single.mockResolvedValueOnce({
        data: subscription,
        error: null,
      });

      await expect(
        subscriptionService.reactivateSubscription(subscription.id)
      ).rejects.toThrow('not scheduled for cancellation');
    });
  });

  describe('getActiveSubscription', () => {
    it('should return active subscription for user', async () => {
      const subscription = mockSubscription({ status: 'active' });

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      const result = await subscriptionService.getActiveSubscription('user_123');

      expect(result).toEqual(subscription);
    });

    it('should return trial subscription for user', async () => {
      const subscription = mockSubscription({ status: 'trialing' });

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      const result = await subscriptionService.getActiveSubscription('user_123');

      expect(result).toEqual(subscription);
    });

    it('should return null if no customer found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await subscriptionService.getActiveSubscription('user_123');

      expect(result).toBeNull();
    });

    it('should return null if no active subscription', async () => {
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const result = await subscriptionService.getActiveSubscription('user_123');

      expect(result).toBeNull();
    });
  });

  describe('hasActiveSubscription', () => {
    it('should return true if user has active subscription', async () => {
      const subscription = mockSubscription({ status: 'active' });

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null })
        .mockResolvedValueOnce({ data: subscription, error: null });

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result).toBe(true);
    });

    it('should return false if no active subscription', async () => {
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: { id: 'cust_123' }, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } });

      const result = await subscriptionService.hasActiveSubscription('user_123');

      expect(result).toBe(false);
    });
  });

  describe('getExpiringSubscriptions', () => {
    it('should return subscriptions expiring within specified days', async () => {
      const expiringSubscriptions = [
        mockSubscription({ cancel_at_period_end: true }),
      ];

      mockSupabase.from().gte.mockResolvedValueOnce({
        data: expiringSubscriptions,
        error: null,
      });

      const result = await subscriptionService.getExpiringSubscriptions(7);

      expect(result).toEqual(expiringSubscriptions);
    });

    it('should return empty array on error', async () => {
      mockSupabase.from().gte.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await subscriptionService.getExpiringSubscriptions(7);

      expect(result).toEqual([]);
    });
  });
});
