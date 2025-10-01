/**
 * Test Data Factories
 * Generate realistic test data for all entities
 */

import type {
  Customer,
  PricingPlan,
  Subscription,
  Invoice,
  UsageRecord,
  PaymentMethod,
  SubscriptionChange,
  BillingAddress,
} from '../../src/types/billing.types';

let customerCounter = 1;
let subscriptionCounter = 1;
let invoiceCounter = 1;

/**
 * Generate mock customer
 */
export const mockCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: `customer_${customerCounter++}`,
  user_id: `user_${Date.now()}`,
  stripe_customer_id: `cus_mock${Date.now()}`,
  billing_email: 'test@example.com',
  currency: 'USD',
  locale: 'en-US',
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Generate mock pricing plan
 */
export const mockPricingPlan = (overrides: Partial<PricingPlan> = {}): PricingPlan => ({
  id: `plan_${Date.now()}`,
  name: 'test-plan',
  display_name: 'Test Plan',
  description: 'A test pricing plan',
  monthly_price_cents: 1000,
  annual_price_cents: 10000,
  currency: 'USD',
  stripe_monthly_price_id: 'price_monthly_mock',
  stripe_annual_price_id: 'price_annual_mock',
  stripe_product_id: 'prod_mock',
  storage_gb: 100,
  api_requests_per_month: 10000,
  pdf_overlays_per_month: 1000,
  team_members_limit: 5,
  features: ['feature1', 'feature2'],
  is_active: true,
  is_visible: true,
  sort_order: 1,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Generate mock subscription
 */
export const mockSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: `subscription_${subscriptionCounter++}`,
  customer_id: `customer_${customerCounter}`,
  pricing_plan_id: `plan_${Date.now()}`,
  stripe_subscription_id: `sub_mock${Date.now()}`,
  stripe_subscription_item_id: `si_mock${Date.now()}`,
  status: 'active',
  billing_cycle: 'monthly',
  current_period_start: new Date(),
  current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  cancel_at_period_end: false,
  amount_cents: 1000,
  currency: 'USD',
  metered_billing_enabled: false,
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Generate mock invoice
 */
export const mockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: `invoice_${invoiceCounter++}`,
  customer_id: `customer_${customerCounter}`,
  subscription_id: `subscription_${subscriptionCounter}`,
  stripe_invoice_id: `in_mock${Date.now()}`,
  invoice_number: `INV-${Date.now()}`,
  status: 'paid',
  subtotal_cents: 1000,
  tax_cents: 100,
  discount_cents: 0,
  total_cents: 1100,
  amount_paid_cents: 1100,
  amount_due_cents: 0,
  currency: 'USD',
  invoice_date: new Date(),
  due_date: new Date(),
  period_start: new Date(),
  period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  attempt_count: 1,
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Generate mock usage record
 */
export const mockUsageRecord = (overrides: Partial<UsageRecord> = {}): UsageRecord => ({
  id: `usage_${Date.now()}`,
  subscription_id: `subscription_${subscriptionCounter}`,
  customer_id: `customer_${customerCounter}`,
  usage_type: 'api_requests',
  quantity: 100,
  unit: 'requests',
  period_start: new Date(),
  period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  is_billable: true,
  metadata: {},
  recorded_at: new Date(),
  ...overrides,
});

/**
 * Generate mock payment method
 */
export const mockPaymentMethod = (overrides: Partial<PaymentMethod> = {}): PaymentMethod => ({
  id: `pm_${Date.now()}`,
  customer_id: `customer_${customerCounter}`,
  stripe_payment_method_id: `pm_mock${Date.now()}`,
  type: 'card',
  card_brand: 'visa',
  card_last4: '4242',
  card_exp_month: 12,
  card_exp_year: 2025,
  card_country: 'US',
  is_default: true,
  is_active: true,
  metadata: {},
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

/**
 * Generate mock subscription change
 */
export const mockSubscriptionChange = (
  overrides: Partial<SubscriptionChange> = {}
): SubscriptionChange => ({
  id: `change_${Date.now()}`,
  subscription_id: `subscription_${subscriptionCounter}`,
  customer_id: `customer_${customerCounter}`,
  change_type: 'upgraded',
  from_plan_id: 'plan_basic',
  to_plan_id: 'plan_pro',
  from_amount_cents: 1000,
  to_amount_cents: 2000,
  initiated_by: 'customer',
  metadata: {},
  created_at: new Date(),
  ...overrides,
});

/**
 * Generate mock billing address
 */
export const mockBillingAddress = (
  overrides: Partial<BillingAddress> = {}
): BillingAddress => ({
  line1: '123 Test Street',
  city: 'San Francisco',
  state: 'CA',
  postal_code: '94105',
  country: 'US',
  ...overrides,
});

/**
 * Generate mock Stripe customer
 */
export const mockStripeCustomer = (overrides: any = {}): any => ({
  id: `cus_mock${Date.now()}`,
  object: 'customer',
  email: 'test@example.com',
  name: 'Test Customer',
  metadata: {},
  created: Math.floor(Date.now() / 1000),
  ...overrides,
});

/**
 * Generate mock Stripe subscription
 */
export const mockStripeSubscription = (overrides: any = {}): any => ({
  id: `sub_mock${Date.now()}`,
  object: 'subscription',
  customer: 'cus_mock123',
  status: 'active',
  items: {
    data: [
      {
        id: `si_mock${Date.now()}`,
        price: { id: 'price_mock123' },
      },
    ],
  },
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  cancel_at_period_end: false,
  metadata: {},
  currency: 'usd',
  ...overrides,
});

/**
 * Generate mock Stripe invoice
 */
export const mockStripeInvoice = (overrides: any = {}): any => ({
  id: `in_mock${Date.now()}`,
  object: 'invoice',
  customer: 'cus_mock123',
  subscription: 'sub_mock123',
  status: 'paid',
  total: 1000,
  subtotal: 900,
  tax: 100,
  amount_paid: 1000,
  amount_due: 0,
  currency: 'usd',
  created: Math.floor(Date.now() / 1000),
  period_start: Math.floor(Date.now() / 1000),
  period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
  ...overrides,
});

/**
 * Generate mock Stripe webhook event
 */
export const mockStripeWebhookEvent = (type: string, data: any): any => ({
  id: `evt_mock${Date.now()}`,
  object: 'event',
  type,
  data: { object: data },
  created: Math.floor(Date.now() / 1000),
  api_version: '2023-10-16',
});

/**
 * Reset counters (useful between test suites)
 */
export const resetFactoryCounters = () => {
  customerCounter = 1;
  subscriptionCounter = 1;
  invoiceCounter = 1;
};
