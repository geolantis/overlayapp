# Supabase Deployment Checklist

Complete checklist for deploying the OverlayApp Supabase backend to production.

## Pre-Deployment

### 1. Environment Setup
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project created (US/EU/AU regions)
- [ ] Project credentials saved securely
- [ ] `.env` files configured for each environment

### 2. Local Testing
- [ ] All migrations tested locally (`supabase db reset`)
- [ ] Edge Functions tested locally (`supabase functions serve`)
- [ ] RLS policies verified with test users
- [ ] Storage policies tested with file uploads
- [ ] Webhook handling tested with Stripe CLI

### 3. Security Review
- [ ] All RLS policies reviewed by security team
- [ ] Encryption keys configured
- [ ] API keys secured (not in code)
- [ ] Service role key never exposed to client
- [ ] CORS settings configured correctly

## Database Deployment

### Step 1: Link to Production Project
```bash
# Link to US project
supabase link --project-ref YOUR_US_PROJECT_REF

# Verify connection
supabase db remote
```

- [ ] Successfully linked to US project
- [ ] Database connection verified

### Step 2: Push Migrations
```bash
# Review pending migrations
supabase migration list

# Push all migrations
supabase db push

# Verify migration status
supabase migration list
```

- [ ] Migration 001 (security_schema) applied
- [ ] Migration 002 (pdf_overlay_schema) applied
- [ ] Migration 003 (subscription_billing_schema) applied
- [ ] Migration 004 (storage_buckets) applied

### Step 3: Verify Database Schema
```sql
-- Check tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Check PostGIS extension
SELECT PostGIS_Version();
```

- [ ] All 30+ tables created
- [ ] RLS enabled on all tables
- [ ] 30+ policies created
- [ ] PostGIS extension active

### Step 4: Create Audit Log Partitions
```sql
-- Create current month partition
CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Create next month partition
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

- [ ] Current month partition created
- [ ] Next month partition created
- [ ] Future partition schedule established

## Storage Deployment

### Step 1: Verify Buckets Created
```bash
# Via Supabase Dashboard: Storage section
# Or via SQL:
SELECT * FROM storage.buckets;
```

- [ ] pdf-documents bucket created (100MB, private)
- [ ] pdf-pages bucket created (10MB, private)
- [ ] map-tiles bucket created (2MB, public)
- [ ] avatars bucket created (2MB, public)
- [ ] exports bucket created (100MB, private)
- [ ] organization-assets bucket created (10MB, private)

### Step 2: Test Storage Policies
```bash
# Test file upload
supabase storage ls pdf-documents

# Test with authenticated user
# Upload test PDF
# Verify access restrictions
```

- [ ] Upload to pdf-documents works for org members
- [ ] Cross-org access blocked
- [ ] Public buckets accessible without auth
- [ ] Private buckets require auth

### Step 3: Configure CORS
```bash
# In Supabase Dashboard: Settings > API > CORS
# Add allowed origins:
# - https://yourdomain.com
# - https://your-app.vercel.app
```

- [ ] Production domain added to CORS
- [ ] Staging domain added to CORS
- [ ] Local development allowed (if needed)

## Edge Functions Deployment

### Step 1: Deploy Functions
```bash
# Deploy all functions
supabase functions deploy process-pdf
supabase functions deploy generate-tiles
supabase functions deploy stripe-webhook
supabase functions deploy georeferencing

# Or deploy all at once
supabase functions deploy
```

- [ ] process-pdf deployed successfully
- [ ] generate-tiles deployed successfully
- [ ] stripe-webhook deployed successfully
- [ ] georeferencing deployed successfully

### Step 2: Set Function Secrets
```bash
# Set secrets for each function
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_... \
  SUPABASE_URL=https://your-project.supabase.co \
  SUPABASE_ANON_KEY=eyJ... \
  SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Verify secrets set
supabase secrets list
```

- [ ] STRIPE_SECRET_KEY set
- [ ] STRIPE_WEBHOOK_SECRET set
- [ ] SUPABASE_URL set
- [ ] SUPABASE_ANON_KEY set
- [ ] SUPABASE_SERVICE_ROLE_KEY set

### Step 3: Test Edge Functions
```bash
# Test process-pdf
curl -i --location --request POST \
  'https://your-project.functions.supabase.co/process-pdf' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"documentId":"test","organizationId":"test"}'

# Test generate-tiles
curl -i --location --request POST \
  'https://your-project.functions.supabase.co/generate-tiles' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"overlayId":"test","organizationId":"test"}'
```

- [ ] process-pdf responds (200 or auth error)
- [ ] generate-tiles responds
- [ ] stripe-webhook responds
- [ ] georeferencing responds
- [ ] All functions accessible via HTTPS

### Step 4: Monitor Function Logs
```bash
# View real-time logs
supabase functions logs process-pdf --tail
supabase functions logs generate-tiles --tail
supabase functions logs stripe-webhook --tail
supabase functions logs georeferencing --tail
```

- [ ] Logs accessible and readable
- [ ] No unexpected errors
- [ ] Performance acceptable

## Stripe Integration

### Step 1: Configure Webhook Endpoint
```bash
# In Stripe Dashboard: Developers > Webhooks
# Add endpoint: https://your-project.functions.supabase.co/stripe-webhook
```

- [ ] Webhook endpoint added in Stripe
- [ ] Webhook signing secret saved
- [ ] Events selected: subscription.*, invoice.*, customer.*, payment_method.*

### Step 2: Test Webhook
```bash
# Using Stripe CLI
stripe listen --forward-to https://your-project.functions.supabase.co/stripe-webhook

# Trigger test event
stripe trigger customer.subscription.created
```

- [ ] Webhook receives events
- [ ] Signature verification works
- [ ] Database updates correctly
- [ ] Subscription records created

### Step 3: Verify Subscription Plans
```sql
-- Check plans inserted
SELECT * FROM subscription_plans;

-- Update with real Stripe IDs
UPDATE subscription_plans
SET
  stripe_product_id = 'prod_XXXXX',
  stripe_price_id = 'price_XXXXX'
WHERE slug = 'standard';
```

- [ ] All subscription plans exist
- [ ] Real Stripe product IDs configured
- [ ] Real Stripe price IDs configured
- [ ] Features array populated

## Multi-Region Deployment (if applicable)

### EU Region
```bash
# Link to EU project
supabase link --project-ref YOUR_EU_PROJECT_REF

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy

# Set secrets
supabase secrets set ...
```

- [ ] EU project linked
- [ ] EU migrations deployed
- [ ] EU functions deployed
- [ ] EU secrets configured

### AU Region
```bash
# Link to AU project
supabase link --project-ref YOUR_AU_PROJECT_REF

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy

# Set secrets
supabase secrets set ...
```

- [ ] AU project linked
- [ ] AU migrations deployed
- [ ] AU functions deployed
- [ ] AU secrets configured

## Post-Deployment Verification

### Database Health Check
```sql
-- Check connection pool
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verify RLS working
SELECT * FROM organizations; -- Should only see user's orgs
```

- [ ] Connection pool healthy
- [ ] Table sizes reasonable
- [ ] RLS enforcing isolation
- [ ] Queries performing well

### Storage Health Check
```bash
# Check bucket sizes
SELECT * FROM get_organization_storage_usage('org-uuid'::uuid);

# Test upload
# Upload test file via client
# Verify in storage bucket
```

- [ ] Storage usage tracking works
- [ ] File uploads succeed
- [ ] Download URLs working
- [ ] CDN caching active (for public buckets)

### Edge Function Health Check
```bash
# Monitor function logs
supabase functions logs process-pdf --tail

# Check function status
curl https://your-project.functions.supabase.co/
```

- [ ] All functions responding
- [ ] No memory leaks
- [ ] Response times acceptable (<2s)
- [ ] Error rate acceptable (<1%)

### Authentication Check
- [ ] User signup works
- [ ] User login works
- [ ] MFA enrollment works (if enabled)
- [ ] Session persistence works
- [ ] Password reset works

## Monitoring Setup

### Supabase Dashboard
- [ ] Database metrics monitored
- [ ] Storage usage tracked
- [ ] Edge Function metrics visible
- [ ] Auth metrics tracked

### External Monitoring
- [ ] Uptime monitoring configured
- [ ] Error alerting configured
- [ ] Performance monitoring active
- [ ] Usage alerts configured

### Logging
- [ ] Application logs centralized
- [ ] Audit logs accessible
- [ ] Security events monitored
- [ ] Compliance logs retained

## Security Hardening

### API Keys
- [ ] Anon key rotated from default
- [ ] Service role key secured (never in client)
- [ ] API rate limiting configured
- [ ] JWT expiration configured

### Database
- [ ] All RLS policies active
- [ ] Super admin access logged
- [ ] Encryption keys rotated
- [ ] Backup retention configured

### Network
- [ ] IP whitelisting configured (if needed)
- [ ] SSL/TLS enforced
- [ ] CORS properly configured
- [ ] DDoS protection enabled

## Backup & Recovery

### Automated Backups
- [ ] Daily backups enabled
- [ ] Point-in-time recovery enabled
- [ ] Backup retention policy set (7-30 days)
- [ ] Backup restoration tested

### Disaster Recovery
- [ ] Recovery procedures documented
- [ ] Recovery time objective (RTO) defined
- [ ] Recovery point objective (RPO) defined
- [ ] DR testing scheduled

## Compliance

### GDPR/CCPA
- [ ] Data subject request workflow tested
- [ ] Consent management active
- [ ] Data retention policies enforced
- [ ] Deletion procedures tested

### SOC 2
- [ ] Audit logging comprehensive
- [ ] Access controls documented
- [ ] Encryption verified
- [ ] Security monitoring active

## Performance Optimization

### Database
- [ ] Indexes created on common queries
- [ ] Slow query log monitored
- [ ] Connection pooling optimized
- [ ] Partition maintenance scheduled

### Storage
- [ ] CDN caching configured
- [ ] Old tiles cleanup scheduled
- [ ] Storage limits enforced
- [ ] Compression enabled

### Edge Functions
- [ ] Cold start times acceptable
- [ ] Memory usage optimized
- [ ] Timeouts configured
- [ ] Retry logic implemented

## Documentation

- [ ] API documentation complete
- [ ] Deployment guide updated
- [ ] Troubleshooting guide created
- [ ] Team trained on operations

## Final Approval

- [ ] Development team approval
- [ ] Security team approval
- [ ] Operations team approval
- [ ] Product owner approval

## Go-Live

- [ ] DNS records updated (if needed)
- [ ] Environment variables updated in app
- [ ] Client apps redeployed with new endpoints
- [ ] Monitoring confirmed active
- [ ] Team notified of go-live
- [ ] Rollback plan prepared

## Post-Launch Monitoring (First 24 Hours)

- [ ] Monitor error rates every hour
- [ ] Check database performance metrics
- [ ] Verify storage uploads working
- [ ] Monitor Edge Function execution
- [ ] Check Stripe webhook delivery
- [ ] Review audit logs for anomalies
- [ ] Verify RLS isolation working
- [ ] Check user authentication flows

## Post-Launch Tasks (First Week)

- [ ] Optimize slow queries
- [ ] Adjust rate limits if needed
- [ ] Fine-tune RLS policies
- [ ] Review usage patterns
- [ ] Gather user feedback
- [ ] Plan next optimizations

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Sign-off**: _______________

## Rollback Procedure

If issues are encountered:

1. **Immediate**: Revert to previous Vercel deployment
2. **Database**: Restore from latest backup if migrations failed
3. **Functions**: Rollback function deployment: `supabase functions delete [name]`
4. **Storage**: No rollback needed (buckets persist)
5. **Communication**: Notify team and users of rollback

## Support Contacts

- **Supabase Support**: support@supabase.io
- **Stripe Support**: support@stripe.com
- **Internal Team**: [Your team contact]
- **On-Call**: [On-call phone/pager]
