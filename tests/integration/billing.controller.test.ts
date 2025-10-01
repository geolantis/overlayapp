/**
 * Integration Tests: Billing Controller
 * End-to-end API endpoint testing
 */

import request from 'supertest';
import express from 'express';
import { billingController } from '../../src/controllers/billing.controller';
import { createMockSupabase } from '../utils/mocks';
import { mockCustomer, mockSubscription, mockInvoice } from '../utils/factories';
import { pricingTiers } from '../utils/fixtures';

// Mock dependencies
jest.mock('../../src/config/supabase.config', () => ({
  supabase: createMockSupabase(),
}));

jest.mock('../../src/services/stripe.service');
jest.mock('../../src/services/subscription.service');
jest.mock('../../src/services/usage.service');
jest.mock('../../src/services/webhook.service');

describe('Billing Controller Integration', () => {
  let app: express.Application;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('../../src/config/supabase.config').supabase;

    // Setup Express app
    app = express();
    app.use(express.json());

    // Mock auth middleware
    app.use((req: any, res, next) => {
      req.user = { id: 'user_test_123', email: 'test@example.com' };
      next();
    });

    // Setup routes
    app.get('/api/billing/plans', billingController.getPlans.bind(billingController));
    app.post('/api/billing/checkout', billingController.createCheckout.bind(billingController));
    app.post('/api/billing/portal', billingController.createPortalSession.bind(billingController));
    app.get('/api/billing/subscription', billingController.getSubscription.bind(billingController));
    app.get('/api/billing/usage', billingController.getUsage.bind(billingController));
    app.get('/api/billing/invoices', billingController.getInvoices.bind(billingController));
  });

  describe('GET /api/billing/plans', () => {
    it('should return all visible pricing plans', async () => {
      const plans = [pricingTiers.starter, pricingTiers.pro];
      mockSupabase.from().order.mockResolvedValueOnce({
        data: plans,
        error: null,
      });

      const response = await request(app).get('/api/billing/plans');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(plans);
    });

    it('should handle database errors', async () => {
      mockSupabase.from().order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await request(app).get('/api/billing/plans');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/billing/checkout', () => {
    it('should create checkout session with valid params', async () => {
      const mockStripeService = require('../../src/services/stripe.service').stripeService;
      mockStripeService.getOrCreateCustomer.mockResolvedValueOnce(mockCustomer());
      mockStripeService.createCheckoutSession.mockResolvedValueOnce({
        id: 'cs_test123',
        url: 'https://checkout.stripe.com/test',
      });

      const response = await request(app)
        .post('/api/billing/checkout')
        .send({
          pricing_plan_id: 'plan_starter',
          billing_cycle: 'monthly',
          success_url: 'https://app.com/success',
          cancel_url: 'https://app.com/cancel',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessionId');
      expect(response.body.data).toHaveProperty('url');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/billing/checkout')
        .send({
          pricing_plan_id: 'plan_starter',
          // Missing other required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('should require authentication', async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.post('/api/billing/checkout', billingController.createCheckout.bind(billingController));

      const response = await request(appNoAuth)
        .post('/api/billing/checkout')
        .send({
          pricing_plan_id: 'plan_starter',
          billing_cycle: 'monthly',
          success_url: 'https://app.com/success',
          cancel_url: 'https://app.com/cancel',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/billing/portal', () => {
    it('should create billing portal session', async () => {
      const customer = mockCustomer();
      mockSupabase.from().single.mockResolvedValueOnce({
        data: customer,
        error: null,
      });

      const mockStripeService = require('../../src/services/stripe.service').stripeService;
      mockStripeService.createBillingPortalSession.mockResolvedValueOnce({
        url: 'https://billing.stripe.com/test',
      });

      const response = await request(app)
        .post('/api/billing/portal')
        .send({
          return_url: 'https://app.com/account',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.url).toBe('https://billing.stripe.com/test');
    });

    it('should return 404 if customer not found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const response = await request(app)
        .post('/api/billing/portal')
        .send({
          return_url: 'https://app.com/account',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Customer not found');
    });
  });

  describe('GET /api/billing/subscription', () => {
    it('should return active subscription for user', async () => {
      const subscription = mockSubscription();
      const mockSubscriptionService = require('../../src/services/subscription.service').subscriptionService;
      mockSubscriptionService.getActiveSubscription.mockResolvedValueOnce(subscription);

      const response = await request(app).get('/api/billing/subscription');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(subscription);
    });

    it('should return 404 if no active subscription', async () => {
      const mockSubscriptionService = require('../../src/services/subscription.service').subscriptionService;
      mockSubscriptionService.getActiveSubscription.mockResolvedValueOnce(null);

      const response = await request(app).get('/api/billing/subscription');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No active subscription');
    });
  });

  describe('GET /api/billing/usage', () => {
    it('should return usage data for active subscription', async () => {
      const subscription = mockSubscription();
      const mockSubscriptionService = require('../../src/services/subscription.service').subscriptionService;
      const mockUsageService = require('../../src/services/usage.service').usageService;

      mockSubscriptionService.getActiveSubscription.mockResolvedValueOnce(subscription);
      mockUsageService.getCurrentPeriodUsage.mockResolvedValueOnce({
        storage: 50,
        api_requests: 5000,
        pdf_overlays: 500,
      });
      mockUsageService.getUsageLimits.mockResolvedValueOnce({
        storage_gb: 100,
        api_requests_per_month: 10000,
        pdf_overlays_per_month: 1000,
      });

      const response = await request(app).get('/api/billing/usage');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('current');
      expect(response.body.data).toHaveProperty('limits');
      expect(response.body.data).toHaveProperty('period');
    });
  });

  describe('GET /api/billing/invoices', () => {
    it('should return customer invoices', async () => {
      const customer = mockCustomer();
      const invoices = [mockInvoice(), mockInvoice()];

      mockSupabase.from().single.mockResolvedValueOnce({
        data: customer,
        error: null,
      });

      mockSupabase.from().order.mockResolvedValueOnce({
        data: invoices,
        error: null,
      });

      const response = await request(app).get('/api/billing/invoices');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 404 if customer not found', async () => {
      mockSupabase.from().single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const response = await request(app).get('/api/billing/invoices');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Customer not found');
    });
  });
});
