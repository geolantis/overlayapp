/**
 * Unit Tests: Stripe Service
 * Comprehensive testing of all Stripe API interactions
 */

import { StripeService } from '../../src/services/stripe.service';
import { createMockStripe, createMockSupabase, createMockLogger } from '../utils/mocks';
import {
  mockCustomer,
  mockPricingPlan,
  mockStripeCustomer,
  mockStripeSubscription,
} from '../utils/factories';
import { pricingTiers } from '../utils/fixtures';

// Mock dependencies
jest.mock('../../src/config/stripe.config', () => ({
  stripe: createMockStripe(),
  stripeConfig: {
    webhookSecret: 'whsec_test',
    paymentMethodTypes: ['card'],
    automaticTax: { enabled: false },
  },
}));

jest.mock('../../src/config/supabase.config', () => ({
  supabase: createMockSupabase(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: createMockLogger(),
}));

describe('StripeService', () => {
  let stripeService: StripeService;
  let mockStripe: any;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    stripeService = new StripeService();
    mockStripe = require('../../src/config/stripe.config').stripe;
    mockSupabase = require('../../src/config/supabase.config').supabase;
  });

  describe('createCustomer', () => {
    it('should create a Stripe customer with valid params', async () => {
      const params = {
        email: 'test@example.com',
        userId: 'user_123',
        name: 'Test User',
        metadata: { plan: 'starter' },
      };

      const result = await stripeService.createCustomer(params);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: params.email,
        name: params.name,
        metadata: {
          user_id: params.userId,
          plan: 'starter',
        },
      });
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(params.email);
    });

    it('should handle Stripe API errors gracefully', async () => {
      mockStripe.customers.create.mockRejectedValueOnce(
        new Error('Stripe API error')
      );

      await expect(
        stripeService.createCustomer({
          email: 'test@example.com',
          userId: 'user_123',
        })
      ).rejects.toThrow('Stripe API error');
    });
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      const existingCustomer = mockCustomer();
      mockSupabase.from().single.mockResolvedValueOnce({
        data: existingCustomer,
        error: null,
      });

      const result = await stripeService.getOrCreateCustomer('user_123');

      expect(result).toEqual(existingCustomer);
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });

    it('should create new customer if not found', async () => {
      mockSupabase.from().single
        .mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })
        .mockResolvedValueOnce({
          data: { user: { id: 'user_123', email: 'new@example.com' } },
          error: null,
        })
        .mockResolvedValueOnce({
          data: mockCustomer({ user_id: 'user_123' }),
          error: null,
        });

      const result = await stripeService.getOrCreateCustomer('user_123');

      expect(mockStripe.customers.create).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledWith('customers');
    });

    it('should throw error if user not found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(
        stripeService.getOrCreateCustomer('invalid_user')
      ).rejects.toThrow('User not found');
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session with valid params', async () => {
      const plan = mockPricingPlan(pricingTiers.starter);
      const customer = mockCustomer();

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: plan, error: null })
        .mockResolvedValueOnce({ data: customer, error: null });

      mockStripe.checkout.sessions.create.mockResolvedValueOnce({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      });

      const result = await stripeService.createCheckoutSession({
        customerId: customer.id,
        pricingPlanId: plan.id,
        billingCycle: 'monthly',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
      });

      expect(result).toHaveProperty('id', 'cs_test123');
      expect(result.url).toBe('https://checkout.stripe.com/test');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalled();
    });

    it('should include trial period if specified', async () => {
      const plan = mockPricingPlan(pricingTiers.pro);
      const customer = mockCustomer();

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: plan, error: null })
        .mockResolvedValueOnce({ data: customer, error: null });

      await stripeService.createCheckoutSession({
        customerId: customer.id,
        pricingPlanId: plan.id,
        billingCycle: 'annual',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
        trialDays: 14,
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        })
      );
    });

    it('should apply discount code if provided', async () => {
      const plan = mockPricingPlan();
      const customer = mockCustomer();

      mockSupabase.from().single
        .mockResolvedValueOnce({ data: plan, error: null })
        .mockResolvedValueOnce({ data: customer, error: null });

      mockStripe.promotionCodes.list.mockResolvedValueOnce({
        data: [{ id: 'promo_123', code: 'SAVE20' }],
      });

      await stripeService.createCheckoutSession({
        customerId: customer.id,
        pricingPlanId: plan.id,
        billingCycle: 'monthly',
        successUrl: 'https://app.com/success',
        cancelUrl: 'https://app.com/cancel',
        discountCode: 'SAVE20',
      });

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ promotion_code: 'promo_123' }],
        })
      );
    });

    it('should throw error if pricing plan not found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Plan not found' },
      });

      await expect(
        stripeService.createCheckoutSession({
          customerId: 'cust_123',
          pricingPlanId: 'invalid_plan',
          billingCycle: 'monthly',
          successUrl: 'https://app.com/success',
          cancelUrl: 'https://app.com/cancel',
        })
      ).rejects.toThrow('Pricing plan not found');
    });
  });

  describe('createBillingPortalSession', () => {
    it('should create billing portal session', async () => {
      const customer = mockCustomer();
      mockSupabase.from().single.mockResolvedValueOnce({
        data: customer,
        error: null,
      });

      mockStripe.billingPortal.sessions.create.mockResolvedValueOnce({
        id: 'bps_test123',
        url: 'https://billing.stripe.com/test',
      });

      const result = await stripeService.createBillingPortalSession({
        customerId: customer.id,
        returnUrl: 'https://app.com/account',
      });

      expect(result.url).toBe('https://billing.stripe.com/test');
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: customer.stripe_customer_id,
        return_url: 'https://app.com/account',
      });
    });

    it('should throw error if customer not found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      await expect(
        stripeService.createBillingPortalSession({
          customerId: 'invalid',
          returnUrl: 'https://app.com',
        })
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription with new plan', async () => {
      const plan = mockPricingPlan(pricingTiers.pro);
      mockSupabase.from().single.mockResolvedValueOnce({
        data: plan,
        error: null,
      });

      mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
        id: 'sub_123',
        items: { data: [{ id: 'si_123' }] },
        metadata: {},
      });

      mockStripe.subscriptions.update.mockResolvedValueOnce({
        id: 'sub_123',
        status: 'active',
      });

      const result = await stripeService.updateSubscription({
        subscriptionId: 'sub_123',
        pricingPlanId: plan.id,
        billingCycle: 'annual',
      });

      expect(result.id).toBe('sub_123');
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_123',
        expect.objectContaining({
          proration_behavior: 'create_prorations',
        })
      );
    });

    it('should use custom proration behavior if provided', async () => {
      const plan = mockPricingPlan();
      mockSupabase.from().single.mockResolvedValueOnce({
        data: plan,
        error: null,
      });

      mockStripe.subscriptions.retrieve.mockResolvedValueOnce({
        id: 'sub_123',
        items: { data: [{ id: 'si_123' }] },
        metadata: {},
      });

      await stripeService.updateSubscription({
        subscriptionId: 'sub_123',
        pricingPlanId: plan.id,
        billingCycle: 'monthly',
        prorationBehavior: 'none',
      });

      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_123',
        expect.objectContaining({
          proration_behavior: 'none',
        })
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end by default', async () => {
      mockStripe.subscriptions.update.mockResolvedValueOnce({
        id: 'sub_123',
        cancel_at_period_end: true,
      });

      const result = await stripeService.cancelSubscription({
        subscriptionId: 'sub_123',
      });

      expect(result.cancel_at_period_end).toBe(true);
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_123',
        { cancel_at_period_end: true }
      );
    });

    it('should cancel immediately if specified', async () => {
      mockStripe.subscriptions.update.mockResolvedValueOnce({
        id: 'sub_123',
        cancel_at_period_end: false,
        status: 'canceled',
      });

      const result = await stripeService.cancelSubscription({
        subscriptionId: 'sub_123',
        cancelAtPeriodEnd: false,
      });

      expect(result.cancel_at_period_end).toBe(false);
    });
  });

  describe('reportUsage', () => {
    it('should report usage to Stripe', async () => {
      mockStripe.subscriptionItems.createUsageRecord.mockResolvedValueOnce({
        id: 'mbur_123',
        quantity: 100,
      });

      const result = await stripeService.reportUsage({
        subscriptionItemId: 'si_123',
        quantity: 100,
      });

      expect(result.quantity).toBe(100);
      expect(mockStripe.subscriptionItems.createUsageRecord).toHaveBeenCalledWith(
        'si_123',
        expect.objectContaining({
          quantity: 100,
          action: 'set',
        })
      );
    });

    it('should use increment action if specified', async () => {
      await stripeService.reportUsage({
        subscriptionItemId: 'si_123',
        quantity: 50,
        action: 'increment',
      });

      expect(mockStripe.subscriptionItems.createUsageRecord).toHaveBeenCalledWith(
        'si_123',
        expect.objectContaining({
          action: 'increment',
        })
      );
    });
  });

  describe('retryInvoicePayment', () => {
    it('should retry failed invoice payment', async () => {
      mockStripe.invoices.pay.mockResolvedValueOnce({
        id: 'in_123',
        status: 'paid',
      });

      const result = await stripeService.retryInvoicePayment('in_123');

      expect(result.status).toBe('paid');
      expect(mockStripe.invoices.pay).toHaveBeenCalledWith('in_123');
    });

    it('should handle retry failures', async () => {
      mockStripe.invoices.pay.mockRejectedValueOnce(
        new Error('Payment failed')
      );

      await expect(
        stripeService.retryInvoicePayment('in_123')
      ).rejects.toThrow('Payment failed');
    });
  });
});
