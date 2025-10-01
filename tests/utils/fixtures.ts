/**
 * Test Fixtures
 * Common test data scenarios and database fixtures
 */

/**
 * Pricing tiers for testing
 */
export const pricingTiers = {
  free: {
    id: 'plan_free',
    name: 'free',
    display_name: 'Free',
    monthly_price_cents: 0,
    annual_price_cents: 0,
    storage_gb: 10,
    api_requests_per_month: 1000,
    pdf_overlays_per_month: 100,
    team_members_limit: 1,
  },
  starter: {
    id: 'plan_starter',
    name: 'starter',
    display_name: 'Starter',
    monthly_price_cents: 1000, // $10.00
    annual_price_cents: 10000, // $100.00
    storage_gb: 100,
    api_requests_per_month: 10000,
    pdf_overlays_per_month: 1000,
    team_members_limit: 3,
  },
  pro: {
    id: 'plan_pro',
    name: 'pro',
    display_name: 'Pro',
    monthly_price_cents: 3000, // $30.00
    annual_price_cents: 30000, // $300.00
    storage_gb: 500,
    api_requests_per_month: 100000,
    pdf_overlays_per_month: 10000,
    team_members_limit: 10,
  },
  enterprise: {
    id: 'plan_enterprise',
    name: 'enterprise',
    display_name: 'Enterprise',
    monthly_price_cents: 10000, // $100.00
    annual_price_cents: 100000, // $1000.00
    storage_gb: 10000,
    api_requests_per_month: 1000000,
    pdf_overlays_per_month: 100000,
    team_members_limit: 100,
  },
};

/**
 * Test users
 */
export const testUsers = {
  basic: {
    id: 'user_basic_001',
    email: 'basic@example.com',
    name: 'Basic User',
  },
  premium: {
    id: 'user_premium_001',
    email: 'premium@example.com',
    name: 'Premium User',
  },
  enterprise: {
    id: 'user_enterprise_001',
    email: 'enterprise@example.com',
    name: 'Enterprise User',
  },
};

/**
 * Test discount codes
 */
export const discountCodes = {
  percentage: {
    code: 'SAVE20',
    discount_type: 'percentage' as const,
    discount_value: 20,
    duration: 'repeating' as const,
    duration_in_months: 3,
  },
  fixedAmount: {
    code: 'FLAT10',
    discount_type: 'fixed_amount' as const,
    discount_value: 1000, // $10.00
    duration: 'once' as const,
  },
  forever: {
    code: 'LIFETIME50',
    discount_type: 'percentage' as const,
    discount_value: 50,
    duration: 'forever' as const,
  },
};

/**
 * Common test scenarios
 */
export const testScenarios = {
  newSubscription: {
    user_id: testUsers.basic.id,
    pricing_plan_id: pricingTiers.starter.id,
    billing_cycle: 'monthly' as const,
    trial_days: 14,
  },
  upgrade: {
    from_plan: pricingTiers.starter.id,
    to_plan: pricingTiers.pro.id,
    billing_cycle: 'monthly' as const,
  },
  downgrade: {
    from_plan: pricingTiers.pro.id,
    to_plan: pricingTiers.starter.id,
    billing_cycle: 'monthly' as const,
  },
  annualSwitch: {
    from_cycle: 'monthly' as const,
    to_cycle: 'annual' as const,
    plan: pricingTiers.pro.id,
  },
};

/**
 * Test payment methods
 */
export const testPaymentMethods = {
  validCard: {
    type: 'card' as const,
    card_brand: 'visa',
    card_last4: '4242',
    card_exp_month: 12,
    card_exp_year: 2025,
  },
  expiredCard: {
    type: 'card' as const,
    card_brand: 'visa',
    card_last4: '0001',
    card_exp_month: 1,
    card_exp_year: 2020,
  },
  declinedCard: {
    type: 'card' as const,
    card_brand: 'visa',
    card_last4: '0002',
    card_exp_month: 12,
    card_exp_year: 2025,
  },
};

/**
 * Stripe webhook event types for testing
 */
export const webhookEvents = [
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.created',
  'invoice.finalized',
  'invoice.paid',
  'invoice.payment_failed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_method.attached',
  'payment_method.detached',
];

/**
 * Usage tracking scenarios
 */
export const usageScenarios = {
  lowUsage: {
    storage: 5, // GB
    api_requests: 500,
    pdf_overlays: 50,
  },
  mediumUsage: {
    storage: 50,
    api_requests: 5000,
    pdf_overlays: 500,
  },
  highUsage: {
    storage: 200,
    api_requests: 50000,
    pdf_overlays: 5000,
  },
  overLimit: {
    storage: 150, // Over 100GB limit
    api_requests: 15000, // Over 10000 limit
    pdf_overlays: 1500, // Over 1000 limit
  },
};

/**
 * Invoice states for testing
 */
export const invoiceStates = {
  draft: { status: 'draft' as const, amount_paid_cents: 0, amount_due_cents: 1000 },
  open: { status: 'open' as const, amount_paid_cents: 0, amount_due_cents: 1000 },
  paid: { status: 'paid' as const, amount_paid_cents: 1000, amount_due_cents: 0 },
  void: { status: 'void' as const, amount_paid_cents: 0, amount_due_cents: 0 },
  uncollectible: {
    status: 'uncollectible' as const,
    amount_paid_cents: 0,
    amount_due_cents: 1000,
  },
};

/**
 * Error scenarios for testing
 */
export const errorScenarios = {
  invalidCard: {
    code: 'card_declined',
    message: 'Your card was declined',
  },
  insufficientFunds: {
    code: 'insufficient_funds',
    message: 'Your card has insufficient funds',
  },
  expiredCard: {
    code: 'expired_card',
    message: 'Your card has expired',
  },
  networkError: {
    code: 'processing_error',
    message: 'An error occurred while processing your card',
  },
};
