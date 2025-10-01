# Database Schema Documentation

**Database**: PostgreSQL (Supabase)
**Version**: 15.0+
**Extensions**: uuid-ossp, pgcrypto, PostGIS
**Last Updated**: 2025-10-01

## Table of Contents

- [Overview](#overview)
- [Schema Diagram](#schema-diagram)
- [Tables](#tables)
- [Row Level Security](#row-level-security)
- [Functions & Triggers](#functions--triggers)
- [Indexes](#indexes)
- [Data Types](#data-types)

---

## Overview

The OverlayApp database consists of two main schemas:

1. **Billing Schema**: Manages subscriptions, payments, and usage tracking
2. **Security Schema**: Handles authentication, authorization, and audit logging

### Key Features

- **Row-Level Security (RLS)**: All tables protected with RLS policies
- **Audit Logging**: Comprehensive audit trail for compliance
- **Multi-Tenant**: Organization-based data isolation
- **Encrypted PII**: Personal data encrypted at rest
- **Soft Deletes**: 30-day grace period before permanent deletion

---

## Schema Diagram

### Billing Schema ERD

```
┌─────────────────┐
│  pricing_plans  │
│─────────────────│
│ id (PK)         │
│ name            │
│ monthly_price   │◄───┐
│ annual_price    │    │
│ storage_gb      │    │
│ features[]      │    │
└─────────────────┘    │
                       │
┌─────────────────┐    │       ┌──────────────────┐
│    customers    │    │       │  subscriptions   │
│─────────────────│    │       │──────────────────│
│ id (PK)         │◄───┼───────│ id (PK)          │
│ user_id (FK)    │    │       │ customer_id (FK) │
│ stripe_cust_id  │    └───────│ plan_id (FK)     │
│ billing_email   │            │ status           │
│ payment_method  │            │ billing_cycle    │
└─────────────────┘            │ amount_cents     │
         │                     │ period_start     │
         │                     │ period_end       │
         │                     └──────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌──────────────────┐         ┌────────────────────┐
│ usage_records    │         │    invoices        │
│──────────────────│         │────────────────────│
│ id (PK)          │         │ id (PK)            │
│ subscription_id  │         │ customer_id (FK)   │
│ usage_type       │         │ subscription_id    │
│ quantity         │         │ total_cents        │
│ period_start     │         │ status             │
│ period_end       │         │ invoice_date       │
└──────────────────┘         │ paid_at            │
                             └────────────────────┘
```

### Security Schema ERD

```
┌──────────────────┐
│  organizations   │
│──────────────────│
│ id (PK)          │◄────┐
│ name             │     │
│ tier             │     │
│ mfa_required     │     │
│ ip_whitelist[]   │     │
└──────────────────┘     │
         │               │
         │               │
         ▼               │
┌──────────────────┐     │       ┌──────────────────┐
│      users       │     │       │ user_organizations│
│──────────────────│     │       │──────────────────│
│ id (PK/FK)       │─────┼──────►│ user_id (FK)     │
│ first_name       │     │       │ org_id (FK)      │
│ mfa_enabled      │     └───────│ role             │
│ mfa_secret_enc   │             │ status           │
│ last_login_at    │             └──────────────────┘
│ failed_attempts  │
└──────────────────┘
         │
         │
         ▼
┌──────────────────┐         ┌────────────────────┐
│   documents      │         │   audit_logs       │
│──────────────────│         │────────────────────│
│ id (PK)          │         │ id (PK)            │
│ organization_id  │         │ event_type         │
│ name             │         │ user_id            │
│ encrypted        │         │ operation          │
│ storage_path     │         │ resource           │
│ sensitivity      │         │ result             │
└──────────────────┘         │ timestamp          │
                             └────────────────────┘
```

---

## Tables

### 1. Billing Tables

#### pricing_plans

Defines available subscription tiers and pricing.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | VARCHAR(50) | NO | - | Plan identifier (starter, professional, enterprise) |
| display_name | VARCHAR(100) | NO | - | Human-readable name |
| description | TEXT | YES | - | Plan description |
| monthly_price_cents | INTEGER | NO | - | Monthly price in cents |
| annual_price_cents | INTEGER | NO | - | Annual price in cents |
| currency | VARCHAR(3) | NO | 'USD' | Currency code (ISO 4217) |
| stripe_monthly_price_id | VARCHAR(100) | YES | - | Stripe price ID for monthly |
| stripe_annual_price_id | VARCHAR(100) | YES | - | Stripe price ID for annual |
| stripe_product_id | VARCHAR(100) | YES | - | Stripe product ID |
| storage_gb | INTEGER | NO | - | Storage limit in GB |
| api_requests_per_month | INTEGER | NO | - | Monthly API request limit |
| pdf_overlays_per_month | INTEGER | NO | - | Monthly PDF overlay limit |
| team_members_limit | INTEGER | NO | - | Maximum team members |
| features | JSONB | YES | '[]' | Array of feature strings |
| is_active | BOOLEAN | NO | true | Plan is active |
| is_visible | BOOLEAN | NO | true | Plan visible in UI |
| sort_order | INTEGER | NO | 0 | Display order |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

**Constraints**:
- `UNIQUE(name)`
- `CHECK(monthly_price_cents >= 0 AND annual_price_cents >= 0)`
- `CHECK(storage_gb > 0 AND api_requests_per_month > 0)`

**Indexes**:
- Primary key on `id`
- Unique index on `name`

---

#### customers

Stores customer billing information.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| user_id | UUID | NO | - | Reference to auth.users |
| stripe_customer_id | VARCHAR(100) | YES | - | Stripe customer ID |
| company_name | VARCHAR(200) | YES | - | Company name |
| billing_email | VARCHAR(255) | NO | - | Billing email address |
| tax_id | VARCHAR(100) | YES | - | Tax identification number |
| billing_address | JSONB | YES | - | Billing address object |
| default_payment_method_id | VARCHAR(100) | YES | - | Stripe payment method ID |
| payment_method_type | VARCHAR(50) | YES | - | Type: card, sepa_debit, etc. |
| currency | VARCHAR(3) | NO | 'USD' | Preferred currency |
| locale | VARCHAR(10) | NO | 'en' | Locale for communications |
| metadata | JSONB | YES | '{}' | Additional metadata |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

**Constraints**:
- `FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `UNIQUE(user_id)`
- `UNIQUE(stripe_customer_id)`

**Indexes**:
- `idx_customers_stripe_id` on `stripe_customer_id`
- `idx_customers_user_id` on `user_id`

**RLS Policies**:
```sql
-- Users can only see their own customer data
CREATE POLICY customers_select_own ON customers
  FOR SELECT USING (auth.uid() = user_id);
```

---

#### subscriptions

Manages active and historical subscriptions.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| customer_id | UUID | NO | - | Reference to customers |
| pricing_plan_id | UUID | NO | - | Reference to pricing_plans |
| stripe_subscription_id | VARCHAR(100) | YES | - | Stripe subscription ID |
| stripe_subscription_item_id | VARCHAR(100) | YES | - | Stripe subscription item ID |
| status | VARCHAR(50) | NO | - | Subscription status |
| billing_cycle | VARCHAR(20) | NO | - | monthly or annual |
| trial_start | TIMESTAMPTZ | YES | - | Trial period start |
| trial_end | TIMESTAMPTZ | YES | - | Trial period end |
| current_period_start | TIMESTAMPTZ | NO | - | Current billing period start |
| current_period_end | TIMESTAMPTZ | NO | - | Current billing period end |
| cancel_at_period_end | BOOLEAN | NO | false | Cancel at end of period |
| canceled_at | TIMESTAMPTZ | YES | - | Cancellation timestamp |
| ended_at | TIMESTAMPTZ | YES | - | End timestamp |
| amount_cents | INTEGER | NO | - | Subscription amount |
| currency | VARCHAR(3) | NO | 'USD' | Currency code |
| metered_billing_enabled | BOOLEAN | NO | true | Metered billing flag |
| metadata | JSONB | YES | '{}' | Additional metadata |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

**Constraints**:
- `FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE`
- `FOREIGN KEY(pricing_plan_id) REFERENCES pricing_plans(id)`
- `UNIQUE(stripe_subscription_id)`
- `CHECK(status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'))`
- `CHECK(billing_cycle IN ('monthly', 'annual'))`

**Indexes**:
- `idx_subscriptions_customer` on `customer_id`
- `idx_subscriptions_status` on `status`
- `idx_subscriptions_stripe_id` on `stripe_subscription_id`
- `idx_subscriptions_period_end` on `current_period_end`
- `idx_subscriptions_active` on `(customer_id, status) WHERE status = 'active'`

---

#### usage_records

Tracks resource usage for billing and limits.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| subscription_id | UUID | NO | - | Reference to subscriptions |
| customer_id | UUID | NO | - | Reference to customers |
| usage_type | VARCHAR(50) | NO | - | Type: storage, api_requests, pdf_overlays |
| quantity | DECIMAL(15,6) | NO | - | Usage quantity |
| unit | VARCHAR(20) | NO | - | Unit: gb, requests, overlays |
| period_start | TIMESTAMPTZ | NO | - | Usage period start |
| period_end | TIMESTAMPTZ | NO | - | Usage period end |
| is_billable | BOOLEAN | NO | true | Billable usage flag |
| billed_at | TIMESTAMPTZ | YES | - | Billing timestamp |
| invoice_id | UUID | YES | - | Associated invoice |
| metadata | JSONB | YES | '{}' | Additional metadata |
| recorded_at | TIMESTAMPTZ | NO | NOW() | Record timestamp |

**Constraints**:
- `FOREIGN KEY(subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE`
- `FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE`
- `CHECK(quantity >= 0)`

**Indexes**:
- `idx_usage_records_subscription_period` on `(subscription_id, period_start, period_end)`
- `idx_usage_records_customer_type` on `(customer_id, usage_type)`
- `idx_usage_records_unbilled` on `(is_billable, billed_at) WHERE billed_at IS NULL`

---

### 2. Security Tables

#### organizations

Multi-tenant organization entities.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | TEXT | NO | - | Organization name |
| slug | TEXT | NO | - | URL-friendly identifier |
| tier | TEXT | NO | 'standard' | Tier: standard, enterprise, regulated |
| status | TEXT | NO | 'active' | Status: active, suspended, cancelled |
| stripe_customer_id | TEXT | YES | - | Stripe customer ID |
| settings | JSONB | YES | '{}' | Organization settings |
| sso_enabled | BOOLEAN | NO | false | SSO enabled flag |
| sso_config | JSONB | YES | - | SSO configuration |
| mfa_required | BOOLEAN | NO | false | MFA requirement flag |
| ip_whitelist | TEXT[] | YES | - | Allowed IP addresses |
| data_region | TEXT | NO | 'us-east-1' | Data residency region |
| compliance_requirements | TEXT[] | YES | '{}' | Compliance standards |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |
| hard_delete_at | TIMESTAMPTZ | YES | - | Scheduled deletion |

**Constraints**:
- `UNIQUE(slug)`
- `UNIQUE(stripe_customer_id)`
- `CHECK(tier IN ('standard', 'enterprise', 'regulated'))`
- `CHECK(status IN ('active', 'suspended', 'cancelled'))`

---

#### users

Extended user profiles with security features.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | - | Primary key (references auth.users) |
| first_name | TEXT | YES | - | First name |
| last_name | TEXT | YES | - | Last name |
| avatar_url | TEXT | YES | - | Avatar image URL |
| phone_encrypted | BYTEA | YES | - | Encrypted phone number |
| address_encrypted | BYTEA | YES | - | Encrypted address |
| encryption_key_id | TEXT | YES | - | Encryption key identifier |
| mfa_enabled | BOOLEAN | NO | false | MFA enabled flag |
| mfa_method | TEXT | YES | - | MFA method: totp, sms, hardware |
| mfa_secret_encrypted | BYTEA | YES | - | Encrypted MFA secret |
| backup_codes_encrypted | BYTEA | YES | - | Encrypted backup codes |
| last_login_at | TIMESTAMPTZ | YES | - | Last login timestamp |
| last_login_ip | INET | YES | - | Last login IP address |
| last_login_user_agent | TEXT | YES | - | Last login user agent |
| failed_login_attempts | INTEGER | NO | 0 | Failed login counter |
| locked_until | TIMESTAMPTZ | YES | - | Account lock expiration |
| password_changed_at | TIMESTAMPTZ | NO | NOW() | Last password change |
| consent_version | TEXT | YES | - | Accepted consent version |
| consent_given_at | TIMESTAMPTZ | YES | - | Consent timestamp |
| marketing_consent | BOOLEAN | NO | false | Marketing consent flag |
| analytics_consent | BOOLEAN | NO | true | Analytics consent flag |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | NOW() | Last update timestamp |
| deleted_at | TIMESTAMPTZ | YES | - | Soft delete timestamp |
| hard_delete_at | TIMESTAMPTZ | YES | - | Scheduled deletion |

**Constraints**:
- `FOREIGN KEY(id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `CHECK(mfa_method IN ('totp', 'sms', 'hardware'))`

---

#### audit_logs (Partitioned)

Comprehensive audit trail for compliance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| timestamp | TIMESTAMPTZ | NO | NOW() | Event timestamp |
| event_type | TEXT | NO | - | Event type identifier |
| severity | TEXT | NO | - | Severity: info, warning, error, critical |
| user_id | UUID | YES | - | User who performed action |
| organization_id | UUID | YES | - | Associated organization |
| api_key_id | UUID | YES | - | API key used |
| ip_address | INET | NO | - | Client IP address |
| user_agent | TEXT | YES | - | Client user agent |
| session_id | UUID | YES | - | Session identifier |
| resource | TEXT | NO | - | Resource type |
| resource_id | TEXT | YES | - | Resource identifier |
| operation | TEXT | NO | - | Operation performed |
| method | TEXT | YES | - | HTTP method |
| endpoint | TEXT | YES | - | API endpoint |
| context | JSONB | YES | '{}' | Additional context |
| result | JSONB | NO | - | Operation result |
| data_subject_id | UUID | YES | - | GDPR data subject |
| legal_basis | TEXT | YES | - | GDPR legal basis |
| retention_days | INTEGER | NO | 2555 | Retention period (7 years) |
| created_at | TIMESTAMPTZ | NO | NOW() | Creation timestamp |

**Partitioning**: Range partitioned by `timestamp` (monthly partitions)

**Constraints**:
- `CHECK(severity IN ('info', 'warning', 'error', 'critical'))`
- PRIMARY KEY (id, timestamp)

**Indexes**:
- `idx_audit_logs_user_id` on `(user_id, timestamp DESC)`
- `idx_audit_logs_org_id` on `(organization_id, timestamp DESC)`
- `idx_audit_logs_event_type` on `(event_type, timestamp DESC)`
- `idx_audit_logs_severity` on `(severity, timestamp DESC) WHERE severity IN ('error', 'critical')`
- `idx_audit_logs_resource` on `(resource, resource_id, timestamp DESC)`
- `idx_audit_logs_context` GIN index on `context`

---

## Row Level Security

### RLS Policies

All tables have RLS enabled with comprehensive policies:

#### Customer Data Isolation
```sql
-- Customers table
CREATE POLICY customers_select_own ON customers
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions table
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Usage records table
CREATE POLICY usage_records_select_own ON usage_records
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );

-- Invoices table
CREATE POLICY invoices_select_own ON invoices
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE user_id = auth.uid()
    )
  );
```

#### Organization Isolation
```sql
-- Organizations table
CREATE POLICY organization_isolation ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Documents table
CREATE POLICY document_isolation ON documents
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

#### Permission-Based Access
```sql
-- User management (requires permission)
CREATE POLICY user_org_manage ON user_organizations
  FOR ALL USING (
    has_permission('users.manage', organization_id)
  );

-- Document deletion (requires permission)
CREATE POLICY document_delete_permission ON documents
  FOR DELETE USING (
    has_permission('documents.delete', organization_id)
  );
```

---

## Functions & Triggers

### Utility Functions

#### update_updated_at()
Automatically updates `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Applied to tables:
- pricing_plans
- customers
- subscriptions
- invoices
- organizations
- users
- documents
- api_keys

#### schedule_hard_delete()
Schedules permanent deletion 30 days after soft delete.

```sql
CREATE OR REPLACE FUNCTION schedule_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  NEW.hard_delete_at = NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### execute_hard_deletes()
Permanently deletes records past their hard_delete_at date.

```sql
CREATE OR REPLACE FUNCTION execute_hard_deletes()
RETURNS void AS $$
BEGIN
  DELETE FROM users WHERE hard_delete_at < NOW();
  DELETE FROM documents WHERE hard_delete_at < NOW();
  DELETE FROM organizations WHERE hard_delete_at < NOW();

  -- Log deletions
  INSERT INTO deletion_audit_log (table_name, deleted_count, deletion_method)
  SELECT 'users', COUNT(*), 'automatic' FROM users WHERE hard_delete_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Security Functions

#### has_permission()
Checks if user has specific permission.

```sql
CREATE OR REPLACE FUNCTION has_permission(
  required_permission TEXT,
  target_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_organizations
  WHERE user_id = auth.uid()
    AND organization_id = COALESCE(target_org_id,
      (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = user_role
      AND permission = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### encrypt_field() / decrypt_field()
PII encryption helpers.

```sql
CREATE OR REPLACE FUNCTION encrypt_field(data TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(data, key);
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_field(data BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(data, key);
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Indexes

### Performance Indexes

#### Billing Tables
```sql
-- Customers
CREATE INDEX idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX idx_customers_user_id ON customers(user_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_customer ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_subscriptions_active ON subscriptions(customer_id, status)
  WHERE status = 'active';

-- Usage Records
CREATE INDEX idx_usage_records_subscription_period
  ON usage_records(subscription_id, period_start, period_end);
CREATE INDEX idx_usage_records_customer_type
  ON usage_records(customer_id, usage_type);
CREATE INDEX idx_usage_records_unbilled
  ON usage_records(is_billable, billed_at) WHERE billed_at IS NULL;

-- Invoices
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date) WHERE status = 'open';
```

#### Security Tables
```sql
-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity, timestamp DESC)
  WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_logs_context ON audit_logs USING GIN(context);
```

---

## Data Types

### Custom Types

#### Enums (Check Constraints)

**Subscription Status**:
- `trialing`: In trial period
- `active`: Active subscription
- `past_due`: Payment failed, retrying
- `canceled`: Subscription canceled
- `unpaid`: Payment failed after retries
- `incomplete`: Initial payment incomplete

**Billing Cycle**:
- `monthly`: Monthly billing
- `annual`: Annual billing

**Invoice Status**:
- `draft`: Not finalized
- `open`: Awaiting payment
- `paid`: Successfully paid
- `void`: Canceled invoice
- `uncollectible`: Marked uncollectible

**Organization Tier**:
- `standard`: Standard tier
- `enterprise`: Enterprise tier
- `regulated`: Highly regulated industries

**User Role**:
- `SUPER_ADMIN`: Full system access
- `ORG_ADMIN`: Organization administrator
- `ORG_MANAGER`: Organization manager
- `ORG_MEMBER`: Regular member
- `ORG_VIEWER`: Read-only access
- `EXTERNAL_AUDITOR`: Audit access only

### JSONB Structures

#### Features Array
```json
[
  "Basic PDF Overlays",
  "10GB Storage",
  "Email Support"
]
```

#### Billing Address
```json
{
  "line1": "123 Main St",
  "line2": "Suite 100",
  "city": "San Francisco",
  "state": "CA",
  "postal_code": "94105",
  "country": "US"
}
```

#### Volume Discount Rules
```json
[
  {
    "threshold": 1000,
    "discount_percent": 10,
    "applies_to": "pdf_overlays"
  },
  {
    "threshold": 5000,
    "discount_percent": 15,
    "applies_to": "pdf_overlays"
  }
]
```

---

## Maintenance & Operations

### Backup Strategy

- **Continuous Backup**: Point-in-time recovery (PITR) enabled
- **Daily Snapshots**: Automated daily backups retained for 30 days
- **Manual Snapshots**: Retained indefinitely until manually deleted

### Data Retention

- **Audit Logs**: 7 years (2555 days)
- **Soft Deleted Records**: 30 days
- **Invoices**: Indefinite
- **Usage Records**: 2 years

### Scheduled Jobs

Required cron jobs:

```sql
-- Run daily at 2 AM UTC
SELECT execute_hard_deletes();

-- Create monthly audit log partition (run monthly)
CREATE TABLE audit_logs_YYYY_MM PARTITION OF audit_logs
  FOR VALUES FROM ('YYYY-MM-01') TO ('YYYY-MM+1-01');
```

---

**Last Updated**: 2025-10-01
**Schema Version**: 1.0
**Database**: PostgreSQL 15+ (Supabase)
