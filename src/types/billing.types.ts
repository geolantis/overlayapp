/**
 * Billing and Subscription Type Definitions
 */

export type BillingCycle = 'monthly' | 'annual';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible';

export type UsageType = 'storage' | 'api_requests' | 'pdf_overlays';

export type ChangeType =
  | 'created'
  | 'upgraded'
  | 'downgraded'
  | 'canceled'
  | 'reactivated'
  | 'trial_started'
  | 'trial_ended'
  | 'payment_failed'
  | 'payment_succeeded';

export type PaymentMethodType =
  | 'card'
  | 'sepa_debit'
  | 'bacs_debit'
  | 'us_bank_account';

export interface PricingPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  monthly_price_cents: number;
  annual_price_cents: number;
  currency: string;
  stripe_monthly_price_id?: string;
  stripe_annual_price_id?: string;
  stripe_product_id?: string;
  storage_gb: number;
  api_requests_per_month: number;
  pdf_overlays_per_month: number;
  team_members_limit: number;
  features: string[];
  is_active: boolean;
  is_visible: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Customer {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  company_name?: string;
  billing_email: string;
  tax_id?: string;
  billing_address?: BillingAddress;
  default_payment_method_id?: string;
  payment_method_type?: PaymentMethodType;
  currency: string;
  locale: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface Subscription {
  id: string;
  customer_id: string;
  pricing_plan_id: string;
  stripe_subscription_id?: string;
  stripe_subscription_item_id?: string;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  trial_start?: Date;
  trial_end?: Date;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  canceled_at?: Date;
  ended_at?: Date;
  amount_cents: number;
  currency: string;
  metered_billing_enabled: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface UsageRecord {
  id: string;
  subscription_id: string;
  customer_id: string;
  usage_type: UsageType;
  quantity: number;
  unit: string;
  period_start: Date;
  period_end: Date;
  is_billable: boolean;
  billed_at?: Date;
  invoice_id?: string;
  metadata: Record<string, any>;
  recorded_at: Date;
}

export interface Invoice {
  id: string;
  customer_id: string;
  subscription_id?: string;
  stripe_invoice_id?: string;
  stripe_payment_intent_id?: string;
  invoice_number?: string;
  status: InvoiceStatus;
  subtotal_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  amount_due_cents: number;
  currency: string;
  invoice_date: Date;
  due_date: Date;
  paid_at?: Date;
  period_start: Date;
  period_end: Date;
  payment_method?: string;
  payment_failure_reason?: string;
  attempt_count: number;
  next_payment_attempt?: Date;
  invoice_pdf_url?: string;
  hosted_invoice_url?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_amount_cents: number;
  amount_cents: number;
  item_type: 'subscription' | 'usage' | 'one_time' | 'discount';
  is_proration: boolean;
  proration_details?: any;
  period_start?: Date;
  period_end?: Date;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface PaymentMethod {
  id: string;
  customer_id: string;
  stripe_payment_method_id: string;
  type: PaymentMethodType;
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  card_country?: string;
  bank_name?: string;
  bank_last4?: string;
  is_default: boolean;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface SubscriptionChange {
  id: string;
  subscription_id: string;
  customer_id: string;
  change_type: ChangeType;
  from_plan_id?: string;
  to_plan_id?: string;
  from_amount_cents?: number;
  to_amount_cents?: number;
  proration_amount_cents?: number;
  proration_date?: Date;
  reason?: string;
  initiated_by: 'customer' | 'admin' | 'system';
  metadata: Record<string, any>;
  created_at: Date;
}

export interface EnterprisePricing {
  id: string;
  customer_id: string;
  base_price_cents: number;
  billing_cycle: BillingCycle;
  currency: string;
  storage_gb?: number;
  api_requests_per_month?: number;
  pdf_overlays_per_month?: number;
  team_members_limit?: number;
  volume_discount_rules: VolumeDiscountRule[];
  contract_start_date: Date;
  contract_end_date: Date;
  auto_renew: boolean;
  support_level: 'enterprise' | 'premium' | 'dedicated';
  is_active: boolean;
  notes?: string;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface VolumeDiscountRule {
  threshold: number;
  discount_percent: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  currency: string;
  duration: 'once' | 'repeating' | 'forever';
  duration_in_months?: number;
  valid_from: Date;
  valid_until?: Date;
  max_redemptions?: number;
  times_redeemed: number;
  applicable_plans?: string[];
  first_time_customers_only: boolean;
  minimum_amount_cents?: number;
  is_active: boolean;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface RevenueAnalytics {
  id: string;
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  period_start: Date;
  period_end: Date;
  mrr_cents: number;
  arr_cents: number;
  total_revenue_cents: number;
  new_customers: number;
  churned_customers: number;
  total_active_customers: number;
  new_subscriptions: number;
  canceled_subscriptions: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  plan_distribution: Record<string, number>;
  total_storage_gb: number;
  total_api_requests: number;
  total_pdf_overlays: number;
  churn_rate_percent: number;
  ltv_cents: number;
  cac_cents: number;
  calculated_at: Date;
}

// API Request/Response Types
export interface CreateSubscriptionRequest {
  user_id: string;
  pricing_plan_id: string;
  billing_cycle: BillingCycle;
  payment_method_id?: string;
  trial_days?: number;
  discount_code?: string;
  billing_address?: BillingAddress;
  metadata?: Record<string, any>;
}

export interface UpdateSubscriptionRequest {
  pricing_plan_id?: string;
  billing_cycle?: BillingCycle;
  cancel_at_period_end?: boolean;
  metadata?: Record<string, any>;
}

export interface UsageReportRequest {
  subscription_id: string;
  usage_type: UsageType;
  quantity: number;
  timestamp?: Date;
  idempotency_key?: string;
}

export interface BillingPortalSession {
  url: string;
  return_url: string;
}

export interface CheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  subscription_id?: string;
}

// Analytics Request Types
export interface AnalyticsQuery {
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  start_date: Date;
  end_date: Date;
  metrics?: string[];
}

export interface ChurnAnalysis {
  period: string;
  total_customers_start: number;
  total_customers_end: number;
  churned_customers: number;
  churn_rate: number;
  reasons: Record<string, number>;
}

export interface RevenueBreakdown {
  period: string;
  subscription_revenue: number;
  usage_revenue: number;
  one_time_revenue: number;
  total_revenue: number;
  by_plan: Record<string, number>;
  by_region: Record<string, number>;
}
