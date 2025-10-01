/**
 * Test Mocks and Stubs
 * Comprehensive mocking utilities for external dependencies
 */

import Stripe from 'stripe';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock Stripe Client
 */
export const createMockStripe = (): Partial<Stripe> => ({
  customers: {
    create: jest.fn().mockResolvedValue({
      id: 'cus_mock123',
      email: 'test@example.com',
      metadata: {},
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'cus_mock123',
      email: 'test@example.com',
    }),
    update: jest.fn().mockResolvedValue({
      id: 'cus_mock123',
      email: 'updated@example.com',
    }),
    del: jest.fn().mockResolvedValue({ id: 'cus_mock123', deleted: true }),
  } as any,

  subscriptions: {
    create: jest.fn().mockResolvedValue({
      id: 'sub_mock123',
      customer: 'cus_mock123',
      status: 'active',
      items: {
        data: [{ id: 'si_mock123', price: { id: 'price_mock123' } }],
      },
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
      items: {
        data: [{ id: 'si_mock123' }],
      },
    }),
    update: jest.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'active',
    }),
    cancel: jest.fn().mockResolvedValue({
      id: 'sub_mock123',
      status: 'canceled',
    }),
  } as any,

  checkout: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'cs_mock123',
        url: 'https://checkout.stripe.com/mock',
        customer: 'cus_mock123',
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cs_mock123',
        payment_status: 'paid',
      }),
    },
  } as any,

  billingPortal: {
    sessions: {
      create: jest.fn().mockResolvedValue({
        id: 'bps_mock123',
        url: 'https://billing.stripe.com/mock',
      }),
    },
  } as any,

  invoices: {
    create: jest.fn().mockResolvedValue({
      id: 'in_mock123',
      status: 'draft',
      total: 1000,
    }),
    retrieve: jest.fn().mockResolvedValue({
      id: 'in_mock123',
      status: 'paid',
    }),
    pay: jest.fn().mockResolvedValue({
      id: 'in_mock123',
      status: 'paid',
    }),
  } as any,

  subscriptionItems: {
    createUsageRecord: jest.fn().mockResolvedValue({
      id: 'mbur_mock123',
      quantity: 100,
      timestamp: Math.floor(Date.now() / 1000),
    }),
  } as any,

  promotionCodes: {
    list: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'promo_mock123',
          code: 'TESTCODE',
          active: true,
          coupon: { id: 'coupon_mock123', percent_off: 20 },
        },
      ],
    }),
  } as any,

  paymentMethods: {
    attach: jest.fn().mockResolvedValue({
      id: 'pm_mock123',
      type: 'card',
    }),
    detach: jest.fn().mockResolvedValue({
      id: 'pm_mock123',
      type: 'card',
    }),
  } as any,

  webhooks: {
    constructEvent: jest.fn(),
  } as any,
});

/**
 * Mock Supabase Client
 */
export const createMockSupabase = (): Partial<SupabaseClient> => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    from: jest.fn().mockReturnValue(mockQuery),
    auth: {
      admin: {
        getUserById: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: 'user_mock123',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User' },
            },
          },
          error: null,
        }),
      },
    } as any,
    rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
  } as any;
};

/**
 * Mock Logger
 */
export const createMockLogger = () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
});

/**
 * Mock Express Request
 */
export const createMockRequest = (overrides: any = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: { id: 'user_mock123', email: 'test@example.com' },
  ...overrides,
});

/**
 * Mock Express Response
 */
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
  };
  return res;
};

/**
 * Mock Express Next Function
 */
export const createMockNext = () => jest.fn();
