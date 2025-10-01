-- =====================================================
-- Billing and Subscription Database Schema
-- Designed for Supabase PostgreSQL
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PRICING PLANS TABLE
-- =====================================================
CREATE TABLE pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'starter', 'professional', 'enterprise'
    display_name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Pricing
    monthly_price_cents INTEGER NOT NULL,
    annual_price_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe Integration
    stripe_monthly_price_id VARCHAR(100),
    stripe_annual_price_id VARCHAR(100),
    stripe_product_id VARCHAR(100),

    -- Usage Limits
    storage_gb INTEGER NOT NULL,
    api_requests_per_month INTEGER NOT NULL,
    pdf_overlays_per_month INTEGER NOT NULL,
    team_members_limit INTEGER NOT NULL,

    -- Features
    features JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_prices CHECK (monthly_price_cents >= 0 AND annual_price_cents >= 0),
    CONSTRAINT positive_limits CHECK (storage_gb > 0 AND api_requests_per_month > 0)
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Stripe Integration
    stripe_customer_id VARCHAR(100) UNIQUE,

    -- Company Info
    company_name VARCHAR(200),
    billing_email VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100),

    -- Address
    billing_address JSONB,

    -- Payment Method
    default_payment_method_id VARCHAR(100),
    payment_method_type VARCHAR(50), -- 'card', 'sepa_debit', 'bacs_debit'

    -- Preferences
    currency VARCHAR(3) DEFAULT 'USD',
    locale VARCHAR(10) DEFAULT 'en',

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_customer UNIQUE(user_id)
);

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    pricing_plan_id UUID NOT NULL REFERENCES pricing_plans(id),

    -- Stripe Integration
    stripe_subscription_id VARCHAR(100) UNIQUE,
    stripe_subscription_item_id VARCHAR(100),

    -- Subscription Details
    status VARCHAR(50) NOT NULL, -- 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
    billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'annual'

    -- Trial
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,

    -- Billing Dates
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,

    -- Pricing
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Usage-Based Billing
    metered_billing_enabled BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_status CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete')),
    CONSTRAINT valid_billing_cycle CHECK (billing_cycle IN ('monthly', 'annual'))
);

-- =====================================================
-- USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Usage Type
    usage_type VARCHAR(50) NOT NULL, -- 'storage', 'api_requests', 'pdf_overlays'

    -- Measurement
    quantity DECIMAL(15, 6) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- 'gb', 'requests', 'overlays'

    -- Time Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Billing
    is_billable BOOLEAN DEFAULT true,
    billed_at TIMESTAMPTZ,
    invoice_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT positive_quantity CHECK (quantity >= 0)
);

-- Index for fast usage queries
CREATE INDEX idx_usage_records_subscription_period ON usage_records(subscription_id, period_start, period_end);
CREATE INDEX idx_usage_records_customer_type ON usage_records(customer_id, usage_type);
CREATE INDEX idx_usage_records_unbilled ON usage_records(is_billable, billed_at) WHERE billed_at IS NULL;

-- =====================================================
-- INVOICES TABLE
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Stripe Integration
    stripe_invoice_id VARCHAR(100) UNIQUE,
    stripe_payment_intent_id VARCHAR(100),

    -- Invoice Details
    invoice_number VARCHAR(50) UNIQUE,
    status VARCHAR(50) NOT NULL, -- 'draft', 'open', 'paid', 'void', 'uncollectible'

    -- Amounts (in cents)
    subtotal_cents INTEGER NOT NULL,
    tax_cents INTEGER DEFAULT 0,
    discount_cents INTEGER DEFAULT 0,
    total_cents INTEGER NOT NULL,
    amount_paid_cents INTEGER DEFAULT 0,
    amount_due_cents INTEGER NOT NULL,

    currency VARCHAR(3) DEFAULT 'USD',

    -- Dates
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,

    -- Billing Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,

    -- Payment
    payment_method VARCHAR(50),
    payment_failure_reason TEXT,
    attempt_count INTEGER DEFAULT 0,
    next_payment_attempt TIMESTAMPTZ,

    -- Files
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_invoice_status CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    CONSTRAINT positive_amounts CHECK (subtotal_cents >= 0 AND total_cents >= 0)
);

-- =====================================================
-- INVOICE LINE ITEMS TABLE
-- =====================================================
CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Item Details
    description TEXT NOT NULL,
    quantity DECIMAL(15, 6) NOT NULL DEFAULT 1,
    unit_amount_cents INTEGER NOT NULL,
    amount_cents INTEGER NOT NULL,

    -- Type
    item_type VARCHAR(50) NOT NULL, -- 'subscription', 'usage', 'one_time', 'discount'

    -- Proration
    is_proration BOOLEAN DEFAULT false,
    proration_details JSONB,

    -- Period
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENT METHODS TABLE
-- =====================================================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Stripe Integration
    stripe_payment_method_id VARCHAR(100) UNIQUE NOT NULL,

    -- Payment Method Details
    type VARCHAR(50) NOT NULL, -- 'card', 'sepa_debit', 'bacs_debit', 'us_bank_account'

    -- Card Details (if applicable)
    card_brand VARCHAR(50),
    card_last4 VARCHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    card_country VARCHAR(2),

    -- Bank Details (if applicable)
    bank_name VARCHAR(100),
    bank_last4 VARCHAR(4),

    -- Status
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SUBSCRIPTION CHANGES HISTORY
-- =====================================================
CREATE TABLE subscription_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Change Details
    change_type VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'reactivated', 'trial_started', 'trial_ended'
    from_plan_id UUID REFERENCES pricing_plans(id),
    to_plan_id UUID REFERENCES pricing_plans(id),

    -- Pricing Impact
    from_amount_cents INTEGER,
    to_amount_cents INTEGER,

    -- Proration
    proration_amount_cents INTEGER,
    proration_date TIMESTAMPTZ,

    -- Reason
    reason TEXT,
    initiated_by VARCHAR(50), -- 'customer', 'admin', 'system'

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_change_type CHECK (change_type IN ('created', 'upgraded', 'downgraded', 'canceled', 'reactivated', 'trial_started', 'trial_ended', 'payment_failed', 'payment_succeeded'))
);

-- =====================================================
-- ENTERPRISE CUSTOM PRICING TABLE
-- =====================================================
CREATE TABLE enterprise_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

    -- Custom Pricing
    base_price_cents INTEGER NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Custom Limits
    storage_gb INTEGER,
    api_requests_per_month INTEGER,
    pdf_overlays_per_month INTEGER,
    team_members_limit INTEGER,

    -- Volume Discounts
    volume_discount_rules JSONB DEFAULT '[]', -- [{threshold: 1000, discount_percent: 10}]

    -- Contract
    contract_start_date DATE NOT NULL,
    contract_end_date DATE NOT NULL,
    auto_renew BOOLEAN DEFAULT false,

    -- Support Level
    support_level VARCHAR(50) DEFAULT 'enterprise', -- 'enterprise', 'premium', 'dedicated'

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- DISCOUNT CODES TABLE
-- =====================================================
CREATE TABLE discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Code Details
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Discount Type
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
    discount_value INTEGER NOT NULL, -- percentage (1-100) or cents
    currency VARCHAR(3) DEFAULT 'USD',

    -- Duration
    duration VARCHAR(20) NOT NULL, -- 'once', 'repeating', 'forever'
    duration_in_months INTEGER, -- for 'repeating'

    -- Validity
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,
    max_redemptions INTEGER,
    times_redeemed INTEGER DEFAULT 0,

    -- Restrictions
    applicable_plans UUID[], -- array of plan IDs, null = all plans
    first_time_customers_only BOOLEAN DEFAULT false,
    minimum_amount_cents INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed_amount')),
    CONSTRAINT valid_duration CHECK (duration IN ('once', 'repeating', 'forever')),
    CONSTRAINT valid_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value BETWEEN 1 AND 100) OR
        (discount_type = 'fixed_amount' AND discount_value > 0)
    )
);

-- =====================================================
-- APPLIED DISCOUNTS TABLE
-- =====================================================
CREATE TABLE applied_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

    -- Application Details
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    -- Amounts
    discount_amount_cents INTEGER NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT unique_customer_discount UNIQUE(discount_code_id, customer_id)
);

-- =====================================================
-- ANALYTICS AGGREGATIONS TABLE
-- =====================================================
CREATE TABLE revenue_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Time Period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Revenue Metrics (in cents)
    mrr_cents BIGINT DEFAULT 0, -- Monthly Recurring Revenue
    arr_cents BIGINT DEFAULT 0, -- Annual Recurring Revenue
    total_revenue_cents BIGINT DEFAULT 0,

    -- Customer Metrics
    new_customers INTEGER DEFAULT 0,
    churned_customers INTEGER DEFAULT 0,
    total_active_customers INTEGER DEFAULT 0,

    -- Subscription Metrics
    new_subscriptions INTEGER DEFAULT 0,
    canceled_subscriptions INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    trial_subscriptions INTEGER DEFAULT 0,

    -- Plan Distribution
    plan_distribution JSONB DEFAULT '{}', -- {starter: 100, professional: 50, enterprise: 10}

    -- Usage Metrics
    total_storage_gb DECIMAL(15, 2) DEFAULT 0,
    total_api_requests BIGINT DEFAULT 0,
    total_pdf_overlays BIGINT DEFAULT 0,

    -- Financial Metrics
    churn_rate_percent DECIMAL(5, 2) DEFAULT 0,
    ltv_cents BIGINT DEFAULT 0, -- Customer Lifetime Value
    cac_cents BIGINT DEFAULT 0, -- Customer Acquisition Cost

    -- Metadata
    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_period UNIQUE(period_type, period_start)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Customers
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_active ON subscriptions(customer_id, status) WHERE status = 'active';

-- Invoices
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status = 'open';
CREATE INDEX idx_invoices_stripe_id ON invoices(stripe_invoice_id);

-- Payment Methods
CREATE INDEX idx_payment_methods_customer ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_default ON payment_methods(customer_id, is_default) WHERE is_default = true;

-- Analytics
CREATE INDEX idx_revenue_analytics_period ON revenue_analytics(period_type, period_start);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- Customers: Users can only see their own data
CREATE POLICY customers_select_own ON customers
    FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: Users can only see their own subscriptions
CREATE POLICY subscriptions_select_own ON subscriptions
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- Usage Records: Users can only see their own usage
CREATE POLICY usage_records_select_own ON usage_records
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- Invoices: Users can only see their own invoices
CREATE POLICY invoices_select_own ON invoices
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- Payment Methods: Users can only see their own payment methods
CREATE POLICY payment_methods_select_own ON payment_methods
    FOR SELECT USING (
        customer_id IN (SELECT id FROM customers WHERE user_id = auth.uid())
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pricing_plans_updated_at BEFORE UPDATE ON pricing_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: DEFAULT PRICING PLANS
-- =====================================================

INSERT INTO pricing_plans (name, display_name, description, monthly_price_cents, annual_price_cents, storage_gb, api_requests_per_month, pdf_overlays_per_month, team_members_limit, features, sort_order) VALUES
('starter', 'Starter', 'Perfect for individuals and small teams', 990, 9900, 10, 10000, 100, 3,
 '["Basic PDF Overlays", "10GB Storage", "10K API Requests/month", "Email Support", "3 Team Members"]'::jsonb, 1),

('professional', 'Professional', 'For growing businesses with advanced needs', 4900, 49000, 100, 100000, 1000, 10,
 '["Advanced PDF Overlays", "100GB Storage", "100K API Requests/month", "Priority Support", "10 Team Members", "Custom Branding", "API Access", "Webhook Integration"]'::jsonb, 2),

('enterprise', 'Enterprise', 'Custom solutions for large organizations', 29900, 299000, 1000, 1000000, 10000, 50,
 '["Unlimited PDF Overlays", "1TB Storage", "1M API Requests/month", "Dedicated Support", "50+ Team Members", "SSO/SAML", "SLA Guarantee", "Custom Integration", "White-Label", "Advanced Analytics", "Multi-Region", "Priority Processing"]'::jsonb, 3);
