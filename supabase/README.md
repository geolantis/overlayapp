# Supabase Backend - OverlayApp

Complete Supabase backend implementation for PDF overlay and georeferencing application with multi-tenant security, subscription billing, and map tile generation.

## Architecture Overview

### Database Schema (PostgreSQL + PostGIS)

#### Core Tables (001_security_schema.sql)
- **organizations** - Multi-tenant organization management with compliance settings
- **users** - Extended user profiles with encrypted PII and security preferences
- **user_organizations** - RBAC with role-based permissions
- **documents** - Secure document storage with encryption and retention
- **document_shares** - Fine-grained document sharing with expiration
- **api_keys** - API key management with rate limiting and scoping
- **audit_logs** - Comprehensive audit trail (partitioned by month)
- **security_events** - Security incident tracking
- **consent_records** - GDPR/CCPA consent management
- **data_subject_requests** - DSR workflow management

#### PDF & Map Tables (002_pdf_overlay_schema.sql)
- **pdf_documents** - PDF processing metadata and status
- **pdf_pages** - Extracted pages with OCR text
- **overlays** - Georeferenced map overlays with transformation data
- **overlay_tiles** - Generated map tiles for rendering
- **ground_control_points** - Georeferencing control points
- **transformation_history** - Coordinate transformation audit trail
- **map_features** - Custom annotations and map markers
- **processing_jobs** - Background job queue with progress tracking

#### Subscription Tables (003_subscription_billing_schema.sql)
- **subscription_plans** - Available tiers (Free, Standard, Enterprise)
- **subscriptions** - Active Stripe subscriptions
- **subscription_history** - Subscription change audit trail
- **payment_methods** - Stored payment methods
- **invoices** - Invoice records from Stripe
- **usage_records** - Detailed metered usage tracking
- **usage_summary** - Daily aggregated statistics
- **usage_alerts** - Configurable usage threshold alerts

### Storage Buckets (004_storage_buckets.sql)

#### Configured Buckets
- **pdf-documents** (100MB, private) - Original PDF files
- **pdf-pages** (10MB, private) - Extracted page images
- **map-tiles** (2MB, public) - Generated map tiles with CDN caching
- **avatars** (2MB, public) - User profile avatars
- **exports** (100MB, private) - Generated export files
- **organization-assets** (10MB, private) - Organization branding assets

### Edge Functions (Deno Deploy)

#### process-pdf
**Purpose**: PDF upload and processing orchestration
**Features**:
- PDF metadata extraction
- Page-by-page extraction
- OCR text recognition
- Thumbnail generation
- Usage tracking and limits
- Background job creation

**Endpoint**: `https://[project].functions.supabase.co/process-pdf`

#### generate-tiles
**Purpose**: Map tile generation for georeferenced overlays
**Features**:
- Multi-zoom level tile generation
- Coordinate transformation
- Tile caching strategy
- Progress tracking
- Usage metering

**Endpoint**: `https://[project].functions.supabase.co/generate-tiles`

#### stripe-webhook
**Purpose**: Stripe webhook event handling
**Events Handled**:
- `customer.subscription.created/updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_method.attached`

**Features**:
- Signature verification
- Subscription lifecycle management
- Invoice tracking
- Payment method storage
- Automatic status updates

**Endpoint**: `https://[project].functions.supabase.co/stripe-webhook`

#### georeferencing
**Purpose**: Coordinate transformation and georeferencing
**Features**:
- Ground Control Point (GCP) storage
- Affine transformation calculation
- Bounds calculation
- RMSE error estimation
- Transformation history tracking

**Endpoint**: `https://[project].functions.supabase.co/georeferencing`

## Security Features

### Row Level Security (RLS)
All tables have RLS policies enforcing:
- Multi-tenant data isolation
- Role-based access control
- Encrypted PII storage
- Audit logging for all operations

### Authentication
- Supabase Auth integration
- MFA support (TOTP, SMS, hardware)
- Session management
- Failed login tracking
- Account lockout protection

### Encryption
- PII field encryption (pgcrypto)
- Document encryption at rest
- Encrypted storage paths
- Key rotation support

## Deployment

### Prerequisites
```bash
npm install -g supabase
supabase --version
```

### Local Development
```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db reset

# Test Edge Functions locally
supabase functions serve
```

### Production Deployment

#### Step 1: Link to Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### Step 2: Push Migrations
```bash
supabase db push
```

#### Step 3: Deploy Edge Functions
```bash
supabase functions deploy process-pdf
supabase functions deploy generate-tiles
supabase functions deploy stripe-webhook
supabase functions deploy georeferencing
```

#### Step 4: Set Secrets
```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_live_... \
  STRIPE_WEBHOOK_SECRET=whsec_...
```

## API Usage Examples

### Process PDF
```typescript
const response = await supabase.functions.invoke('process-pdf', {
  body: {
    documentId: 'uuid',
    organizationId: 'uuid',
    performOCR: true,
    extractPages: true,
  },
});
```

### Generate Tiles
```typescript
const response = await supabase.functions.invoke('generate-tiles', {
  body: {
    overlayId: 'uuid',
    organizationId: 'uuid',
    zoomLevels: [0, 1, 2, 3, 4, 5],
  },
});
```

### Georeference Overlay
```typescript
const response = await supabase.functions.invoke('georeferencing', {
  body: {
    overlayId: 'uuid',
    organizationId: 'uuid',
    gcps: [
      { pixelX: 100, pixelY: 200, latitude: 40.7128, longitude: -74.0060 },
      { pixelX: 500, pixelY: 300, latitude: 40.7580, longitude: -73.9855 },
      // ... more control points
    ],
    transformationType: 'affine',
  },
});
```

## Database Functions

### Usage Tracking
```sql
-- Track PDF upload
SELECT track_usage(
  'org-uuid'::uuid,
  'pdf_upload',
  1,
  'document-uuid'::uuid
);

-- Check usage limit
SELECT check_usage_limit(
  'org-uuid'::uuid,
  'pdf_upload'
);
```

### Storage Monitoring
```sql
-- Get organization storage usage
SELECT * FROM get_organization_storage_usage('org-uuid'::uuid);
```

## Monitoring & Maintenance

### Audit Log Partitioning
New partitions must be created monthly:
```sql
CREATE TABLE audit_logs_2025_11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

### Cleanup Tasks
```sql
-- Clean up old cached tiles (30+ days)
SELECT cleanup_old_tiles(30);

-- Execute hard deletes (soft-deleted records)
SELECT execute_hard_deletes();
```

### Health Checks
- Monitor Edge Function logs: `supabase functions logs [function-name]`
- Check database connections: `supabase db pooler status`
- Review security events: Query `security_events` table
- Monitor usage: Query `usage_summary` table

## Testing

### RLS Policy Testing
```sql
-- Test as specific user
SELECT set_config('request.jwt.claims',
  '{"sub":"user-uuid","role":"authenticated"}',
  true);

-- Verify isolation
SELECT COUNT(*) FROM documents; -- Should only see org documents
```

### Edge Function Testing
```bash
# Local testing
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/process-pdf' \
  --header 'Authorization: Bearer ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"documentId":"uuid","organizationId":"uuid"}'
```

## Performance Optimization

### Indexes
All critical query paths are indexed:
- Organization relationships
- Document access patterns
- Audit log queries
- Geographic data (PostGIS)

### Caching Strategy
- Map tiles served from CDN (public bucket)
- Frequent queries use materialized views
- Session data cached client-side

## Compliance

### GDPR/CCPA
- Data subject request workflow
- Consent management
- Right to erasure (soft delete + hard delete)
- Data portability support

### SOC 2
- Comprehensive audit logging
- Encryption at rest and in transit
- Role-based access control
- Security event monitoring

## Subscription Tiers

### Free Tier
- 10 PDF uploads/month
- 1GB storage
- 100 tile generations/month
- 1,000 API calls/month
- 3 users

### Standard Tier ($29/month)
- 100 PDF uploads/month
- 50GB storage
- 10,000 tile generations/month
- 50,000 API calls/month
- 25 users
- Priority support

### Enterprise Tier ($99/month)
- Unlimited uploads
- 500GB storage
- Unlimited tile generation
- Unlimited API calls
- Unlimited users
- SSO integration
- Custom branding
- 24/7 support

## Support

For issues or questions:
- Database: Check `docs/SUPABASE_SETUP_GUIDE.md`
- Edge Functions: Review function logs
- Storage: Verify bucket policies
- Billing: Check Stripe webhook logs

## File Structure

```
supabase/
├── migrations/
│   ├── 001_security_schema.sql          # Security & multi-tenant foundation
│   ├── 002_pdf_overlay_schema.sql       # PDF & map overlay tables
│   ├── 003_subscription_billing_schema.sql  # Stripe billing integration
│   └── 004_storage_buckets.sql          # Storage buckets & policies
├── functions/
│   ├── process-pdf/
│   │   └── index.ts                     # PDF processing handler
│   ├── generate-tiles/
│   │   └── index.ts                     # Map tile generation
│   ├── stripe-webhook/
│   │   └── index.ts                     # Stripe webhook handler
│   └── georeferencing/
│       └── index.ts                     # Coordinate transformation
├── policies/
│   └── rls_examples.sql                 # Additional RLS examples
└── README.md                            # This file
```

## Next Steps

1. **Deploy to Production**: Follow deployment guide in `docs/SUPABASE_SETUP_GUIDE.md`
2. **Configure Stripe**: Set up webhook endpoints and test payment flows
3. **Setup Monitoring**: Configure alerts for usage thresholds
4. **Load Test**: Verify performance under expected load
5. **Security Review**: Coordinate with security-reviewer agent for RLS validation

---

**Backend Agent**: Task completed successfully ✅
**Files Created**: 8 (4 migrations + 4 Edge Functions)
**RLS Policies**: 30+ policies across all tables
**Storage Buckets**: 6 configured with access policies
