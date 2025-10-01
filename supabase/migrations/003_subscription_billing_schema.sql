-- Migration: Subscription and Billing Schema
-- Version: 003
-- Description: Stripe integration, subscription management, usage tracking, and billing

-- ============================================================================
-- SUBSCRIPTION PLANS
-- ============================================================================

-- Subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Plan details
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Stripe integration
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,

  -- Pricing
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd' CHECK (currency IN ('usd', 'eur', 'gbp', 'aud')),
  billing_interval TEXT NOT NULL DEFAULT 'month' CHECK (
    billing_interval IN ('day', 'week', 'month', 'year')
  ),
  billing_interval_count INTEGER DEFAULT 1,

  -- Tier
  tier TEXT NOT NULL CHECK (tier IN ('free', 'standard', 'enterprise', 'regulated')),

  -- Limits
  max_pdf_uploads_per_month INTEGER NOT NULL,
  max_storage_gb INTEGER NOT NULL,
  max_tile_generations_per_month INTEGER NOT NULL,
  max_api_calls_per_month INTEGER NOT NULL,
  max_users INTEGER NOT NULL,
  max_organizations INTEGER DEFAULT 1,

  -- Features
  features JSONB DEFAULT '[]'::JSONB,
  has_sso BOOLEAN DEFAULT FALSE,
  has_advanced_security BOOLEAN DEFAULT FALSE,
  has_audit_logs BOOLEAN DEFAULT FALSE,
  has_api_access BOOLEAN DEFAULT FALSE,
  has_custom_branding BOOLEAN DEFAULT FALSE,
  has_priority_support BOOLEAN DEFAULT FALSE,

  -- Status
  active BOOLEAN DEFAULT TRUE,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (
  name, slug, stripe_product_id, stripe_price_id,
  price_cents, tier,
  max_pdf_uploads_per_month, max_storage_gb, max_tile_generations_per_month,
  max_api_calls_per_month, max_users, features
) VALUES
  (
    'Free',
    'free',
    'prod_free_placeholder',
    'price_free_placeholder',
    0,
    'free',
    10,
    1,
    100,
    1000,
    3,
    '["Basic PDF overlay", "10 PDF uploads/month", "1GB storage", "Community support"]'::JSONB
  ),
  (
    'Standard',
    'standard',
    'prod_standard_placeholder',
    'price_standard_placeholder',
    2900,
    'standard',
    100,
    50,
    10000,
    50000,
    25,
    '["Unlimited PDF overlays", "100 uploads/month", "50GB storage", "Priority email support", "API access", "Advanced features"]'::JSONB
  ),
  (
    'Enterprise',
    'enterprise',
    'prod_enterprise_placeholder',
    'price_enterprise_placeholder',
    9900,
    'enterprise',
    -1,
    500,
    -1,
    -1,
    -1,
    '["Unlimited everything", "500GB storage", "SSO integration", "Advanced security", "24/7 support", "Custom branding", "SLA guarantee"]'::JSONB
  );

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================

-- Active subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),

  -- Stripe integration
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')
  ),

  -- Billing cycle
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Trial
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Dates
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

CREATE INDEX idx_subscriptions_organization ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status, current_period_end);

-- Subscription history (for auditing)
CREATE TABLE subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Event
  event_type TEXT NOT NULL CHECK (
    event_type IN ('created', 'upgraded', 'downgraded', 'canceled', 'reactivated', 'payment_failed')
  ),

  -- Old and new values
  old_plan_id UUID REFERENCES subscription_plans(id),
  new_plan_id UUID REFERENCES subscription_plans(id),
  old_status TEXT,
  new_status TEXT,

  -- Context
  reason TEXT,
  changed_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_organization ON subscription_history(organization_id, created_at DESC);

-- ============================================================================
-- PAYMENTS AND INVOICES
-- ============================================================================

-- Payment methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Stripe integration
  stripe_payment_method_id TEXT UNIQUE NOT NULL,

  -- Card details (partial for display)
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,

  -- Status
  is_default BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_organization ON payment_methods(organization_id);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Stripe integration
  stripe_invoice_id TEXT UNIQUE NOT NULL,

  -- Invoice details
  invoice_number TEXT,
  amount_due_cents INTEGER NOT NULL,
  amount_paid_cents INTEGER DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'usd',

  -- Status
  status TEXT NOT NULL CHECK (
    status IN ('draft', 'open', 'paid', 'uncollectible', 'void')
  ),

  -- Dates
  invoice_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  -- URLs
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_organization ON invoices(organization_id, invoice_date DESC);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
CREATE INDEX idx_invoices_status ON invoices(status, due_date);

-- ============================================================================
-- USAGE TRACKING
-- ============================================================================

-- Usage records (for metered billing)
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,

  -- Usage type
  usage_type TEXT NOT NULL CHECK (
    usage_type IN ('pdf_upload', 'storage', 'tile_generation', 'api_call', 'user_seat')
  ),

  -- Quantity
  quantity INTEGER NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,  -- 'count', 'bytes', 'gb', 'requests'

  -- Context
  resource_id UUID,
  user_id UUID REFERENCES users(id),

  -- Timestamp
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- Billing period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX idx_usage_records_organization ON usage_records(organization_id, recorded_at DESC);
CREATE INDEX idx_usage_records_type ON usage_records(usage_type, recorded_at DESC);
CREATE INDEX idx_usage_records_billing_period ON usage_records(billing_period_start, billing_period_end);

-- Usage summary (aggregated daily)
CREATE TABLE usage_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Date
  summary_date DATE NOT NULL,

  -- Usage totals
  pdf_uploads INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  tile_generations INTEGER DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,

  -- Billing period
  billing_period_start TIMESTAMPTZ NOT NULL,
  billing_period_end TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, summary_date)
);

CREATE INDEX idx_usage_summary_organization ON usage_summary(organization_id, summary_date DESC);
CREATE INDEX idx_usage_summary_billing_period ON usage_summary(billing_period_start, billing_period_end);

-- ============================================================================
-- BILLING ALERTS
-- ============================================================================

-- Usage alerts
CREATE TABLE usage_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Alert configuration
  usage_type TEXT NOT NULL CHECK (
    usage_type IN ('pdf_upload', 'storage', 'tile_generation', 'api_call', 'user_seat')
  ),
  threshold_type TEXT NOT NULL CHECK (threshold_type IN ('percentage', 'absolute')),
  threshold_value NUMERIC NOT NULL,

  -- Status
  enabled BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,

  -- Notification
  notification_channels TEXT[] DEFAULT ARRAY['email'],
  notification_recipients UUID[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_alerts_organization ON usage_alerts(organization_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update triggers
CREATE TRIGGER subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER usage_alerts_updated_at BEFORE UPDATE ON usage_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Track usage function
CREATE OR REPLACE FUNCTION track_usage(
  p_organization_id UUID,
  p_usage_type TEXT,
  p_quantity INTEGER DEFAULT 1,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_usage_id UUID;
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Get current subscription
  SELECT * INTO v_subscription
  FROM subscriptions
  WHERE organization_id = p_organization_id
    AND status = 'active'
  LIMIT 1;

  -- Record usage
  INSERT INTO usage_records (
    organization_id,
    subscription_id,
    usage_type,
    quantity,
    unit,
    resource_id,
    user_id,
    billing_period_start,
    billing_period_end,
    metadata
  ) VALUES (
    p_organization_id,
    v_subscription.id,
    p_usage_type,
    p_quantity,
    CASE p_usage_type
      WHEN 'storage' THEN 'bytes'
      ELSE 'count'
    END,
    p_resource_id,
    auth.uid(),
    v_subscription.current_period_start,
    v_subscription.current_period_end,
    p_metadata
  ) RETURNING id INTO v_usage_id;

  RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check usage limit function
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_organization_id UUID,
  p_usage_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan subscription_plans%ROWTYPE;
  v_current_usage BIGINT;
  v_limit INTEGER;
BEGIN
  -- Get plan limits
  SELECT sp.* INTO v_plan
  FROM subscription_plans sp
  JOIN subscriptions s ON s.subscription_plan_id = sp.id
  WHERE s.organization_id = p_organization_id
    AND s.status = 'active';

  -- Get limit for usage type
  v_limit := CASE p_usage_type
    WHEN 'pdf_upload' THEN v_plan.max_pdf_uploads_per_month
    WHEN 'tile_generation' THEN v_plan.max_tile_generations_per_month
    WHEN 'api_call' THEN v_plan.max_api_calls_per_month
    WHEN 'user_seat' THEN v_plan.max_users
    ELSE NULL
  END;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- Get current usage for this billing period
  SELECT COALESCE(SUM(quantity), 0) INTO v_current_usage
  FROM usage_records
  WHERE organization_id = p_organization_id
    AND usage_type = p_usage_type
    AND recorded_at >= (
      SELECT current_period_start FROM subscriptions
      WHERE organization_id = p_organization_id AND status = 'active'
    );

  RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_alerts ENABLE ROW LEVEL SECURITY;

-- Plans are public (read-only)
CREATE POLICY subscription_plans_public ON subscription_plans
  FOR SELECT
  USING (active = TRUE);

-- Subscriptions isolation
CREATE POLICY subscriptions_isolation ON subscriptions
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Subscription history isolation
CREATE POLICY subscription_history_isolation ON subscription_history
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Payment methods isolation
CREATE POLICY payment_methods_isolation ON payment_methods
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Invoices isolation
CREATE POLICY invoices_isolation ON invoices
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Usage records isolation
CREATE POLICY usage_records_isolation ON usage_records
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Usage summary isolation
CREATE POLICY usage_summary_isolation ON usage_summary
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Usage alerts isolation
CREATE POLICY usage_alerts_isolation ON usage_alerts
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE subscription_plans IS 'Available subscription tiers with pricing and limits';
COMMENT ON TABLE subscriptions IS 'Active organization subscriptions with Stripe integration';
COMMENT ON TABLE subscription_history IS 'Audit trail of subscription changes';
COMMENT ON TABLE payment_methods IS 'Stored payment methods for recurring billing';
COMMENT ON TABLE invoices IS 'Invoice records from Stripe';
COMMENT ON TABLE usage_records IS 'Detailed usage tracking for metered billing';
COMMENT ON TABLE usage_summary IS 'Daily aggregated usage statistics';
COMMENT ON TABLE usage_alerts IS 'Configurable alerts for usage thresholds';

COMMENT ON FUNCTION track_usage IS 'Record usage event for billing and tracking';
COMMENT ON FUNCTION check_usage_limit IS 'Check if organization is within usage limits';
