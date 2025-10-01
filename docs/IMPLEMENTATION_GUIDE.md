# Payment System Implementation Guide

## Table of Contents

1. [Setup & Installation](#setup--installation)
2. [Stripe Configuration](#stripe-configuration)
3. [Supabase Setup](#supabase-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Migration](#database-migration)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Production Deployment](#production-deployment)
9. [Monitoring & Analytics](#monitoring--analytics)

---

## Setup & Installation

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+ (via Supabase)
- Redis (for job queues)
- Stripe account
- Supabase project

### Install Dependencies

```bash
npm install
```

---

## Stripe Configuration

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Enable your preferred payment methods

### 2. Configure Products and Prices

Create products and prices in Stripe Dashboard:

```bash
# Use Stripe CLI or Dashboard

# Starter Plan
stripe products create \
  --name="Starter" \
  --description="Perfect for individuals and small teams"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=990 \
  --currency=usd \
  --recurring[interval]=month

stripe prices create \
  --product=prod_xxx \
  --unit-amount=9900 \
  --currency=usd \
  --recurring[interval]=year
```

### 3. Update Database with Stripe IDs

After creating products in Stripe, update the `pricing_plans` table:

```sql
UPDATE pricing_plans
SET
  stripe_product_id = 'prod_xxx',
  stripe_monthly_price_id = 'price_xxx',
  stripe_annual_price_id = 'price_xxx'
WHERE name = 'starter';
```

### 4. Configure Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/billing/webhooks/stripe`
3. Select events or choose "Select all events"
4. Copy webhook signing secret

### 5. Test Mode vs Live Mode

- **Test Mode**: Use `sk_test_...` keys for development
- **Live Mode**: Use `sk_live_...` keys for production

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and keys

### 2. Run Database Migrations

Execute the schema SQL file:

```bash
# Using Supabase CLI
supabase db push

# Or manually in Supabase SQL Editor
# Copy and paste content from database/schemas/billing_schema.sql
```

### 3. Configure Row Level Security (RLS)

The schema includes RLS policies. Verify they're active:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('customers', 'subscriptions', 'invoices');
```

### 4. Set Up Database Functions

Create helper functions for analytics:

```sql
-- Aggregated usage function
CREATE OR REPLACE FUNCTION get_aggregated_usage(
  p_subscription_id UUID,
  p_usage_type TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_group_by TEXT
)
RETURNS TABLE (period TEXT, quantity NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p_group_by = 'day' THEN DATE_TRUNC('day', recorded_at)::TEXT
      WHEN p_group_by = 'week' THEN DATE_TRUNC('week', recorded_at)::TEXT
      WHEN p_group_by = 'month' THEN DATE_TRUNC('month', recorded_at)::TEXT
    END as period,
    SUM(quantity) as quantity
  FROM usage_records
  WHERE
    subscription_id = p_subscription_id
    AND (p_usage_type IS NULL OR usage_type = p_usage_type)
    AND recorded_at BETWEEN p_start_date AND p_end_date
  GROUP BY period
  ORDER BY period;
END;
$$ LANGUAGE plpgsql;
```

---

## Environment Configuration

### 1. Copy Environment Template

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your actual values:

```env
# Application
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Redis
REDIS_URL=redis://localhost:6379

# Usage Limits
STARTER_STORAGE_GB=10
STARTER_API_REQUESTS=10000
STARTER_PDF_OVERLAYS=100

PROFESSIONAL_STORAGE_GB=100
PROFESSIONAL_API_REQUESTS=100000
PROFESSIONAL_PDF_OVERLAYS=1000

ENTERPRISE_STORAGE_GB=1000
ENTERPRISE_API_REQUESTS=1000000
ENTERPRISE_PDF_OVERLAYS=10000

# Trial Period
TRIAL_DURATION_DAYS=14
```

### 3. Secure Secrets

**Never commit `.env` to version control!**

For production, use secure secret management:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Vault by HashiCorp
- Environment variables in hosting platform

---

## Database Migration

### Initial Migration

```bash
# Using Supabase CLI
supabase migration new initial_schema
# Copy billing_schema.sql content to the migration file
supabase db push

# Or use custom migration script
npm run migrate
```

### Create Migration Script

Create `database/migrate.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

async function migrate() {
  const schemaSQL = readFileSync(
    join(__dirname, 'schemas/billing_schema.sql'),
    'utf-8'
  );

  const { error } = await supabase.rpc('exec_sql', { sql: schemaSQL });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  console.log('Migration completed successfully');
}

migrate();
```

---

## Running the Application

### Development Mode

```bash
# Start development server with hot reload
npm run dev
```

### Production Mode

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### With Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t payment-system .
docker run -p 3000:3000 --env-file .env payment-system
```

---

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

Create test file `tests/integration/billing.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/index';

describe('Billing API', () => {
  it('should get pricing plans', async () => {
    const response = await request(app)
      .get('/api/billing/plans')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('should require auth for checkout', async () => {
    const response = await request(app)
      .post('/api/billing/checkout')
      .send({
        pricing_plan_id: 'test-id',
        billing_cycle: 'monthly',
      })
      .expect(401);

    expect(response.body.success).toBe(false);
  });
});
```

### Test Stripe Webhooks

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Stripe products and prices created
- [ ] Webhook endpoints configured
- [ ] SSL certificate installed
- [ ] Rate limiting configured
- [ ] Monitoring set up
- [ ] Backup strategy in place

### Deployment Platforms

#### Vercel

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### AWS (EC2/ECS)

```bash
# Install dependencies
npm ci --only=production

# Build application
npm run build

# Start with PM2
pm2 start dist/index.js --name payment-system

# Or use systemd service
sudo systemctl enable payment-system
sudo systemctl start payment-system
```

#### Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/payment-system', '.']
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/payment-system']
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'payment-system'
      - '--image'
      - 'gcr.io/$PROJECT_ID/payment-system'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
```

### Environment-Specific Configuration

```typescript
// src/config/environment.ts
export const config = {
  development: {
    logLevel: 'debug',
    rateLimitMax: 1000,
  },
  production: {
    logLevel: 'info',
    rateLimitMax: 100,
  },
};

export default config[process.env.NODE_ENV || 'development'];
```

---

## Monitoring & Analytics

### Application Monitoring

```typescript
// Integrate Sentry
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### Metrics to Track

1. **Revenue Metrics**
   - MRR (Monthly Recurring Revenue)
   - ARR (Annual Recurring Revenue)
   - ARPU (Average Revenue Per User)
   - Revenue growth rate

2. **Customer Metrics**
   - New customers
   - Active customers
   - Churned customers
   - Churn rate
   - LTV (Lifetime Value)
   - CAC (Customer Acquisition Cost)

3. **Subscription Metrics**
   - New subscriptions
   - Active subscriptions
   - Trial conversions
   - Upgrade rate
   - Downgrade rate

4. **Payment Metrics**
   - Payment success rate
   - Payment failure rate
   - Retry success rate
   - Dunning effectiveness

### Setup Analytics Dashboard

```bash
# Run analytics aggregation daily
node -e "require('./dist/services/analytics.service').analyticsService.aggregateAnalytics('daily', new Date(), new Date())"

# Use cron job
0 2 * * * cd /app && npm run analytics:aggregate
```

### Logging Best Practices

```typescript
// Structured logging
logger.info('Subscription created', {
  subscriptionId: 'sub_xxx',
  customerId: 'cus_xxx',
  plan: 'professional',
  amount: 4900,
});

// Error logging with context
logger.error('Payment failed', {
  error: error.message,
  stack: error.stack,
  invoiceId: 'inv_xxx',
  customerId: 'cus_xxx',
});
```

---

## Troubleshooting

### Common Issues

**1. Webhook Signature Verification Failed**
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Use raw body parser for webhook endpoint
- Check Stripe CLI logs for signature details

**2. Database Connection Issues**
- Verify Supabase credentials
- Check firewall rules
- Ensure RLS policies allow operations

**3. Payment Failures**
- Check Stripe Dashboard for error details
- Verify payment method is valid
- Review customer invoice settings

**4. Usage Tracking Not Working**
- Ensure subscription has `metered_billing_enabled`
- Check Stripe subscription item ID
- Verify usage reports are within billing period

### Debug Mode

```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev

# Test specific service
node -e "require('./dist/services/stripe.service').stripeService.getOrCreateCustomer('user-id')"
```

---

## Best Practices

### Security

1. **Never expose secret keys**
2. **Use HTTPS in production**
3. **Implement rate limiting**
4. **Validate all user input**
5. **Use RLS policies in Supabase**
6. **Sanitize error messages**

### Performance

1. **Cache frequently accessed data**
2. **Use database indexes**
3. **Batch webhook processing**
4. **Implement connection pooling**
5. **Monitor query performance**

### Reliability

1. **Implement retry logic**
2. **Handle webhook idempotency**
3. **Use job queues for async tasks**
4. **Set up health checks**
5. **Monitor error rates**

---

## Support

For questions or issues:
- GitHub Issues: [link]
- Documentation: [link]
- Email: support@example.com
