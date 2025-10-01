# Comprehensive Project Plan: PDF Overlay Management SaaS
## Modern Web Portal & Mobile Apps (Supabase + Vercel Architecture)

**Version:** 2.0
**Date:** January 2025
**Target Launch:** Q2 2025 (16-20 weeks)

---

## 🎯 Executive Summary

Building a complete **multi-tenant SaaS platform** for PDF overlay management with:
- **Web Portal**: Modern React app on Vercel
- **Mobile Apps**: React Native (iOS + Android) with offline sync
- **Backend**: Supabase (PostgreSQL + PostGIS, Edge Functions, Auth, Storage, Realtime)
- **Regions**: EU, US, Canada, Australia with data residency
- **Features**: PDF georeferencing, map overlays, real-time sync, payment processing

---

## 📊 Technology Stack (Supabase + Vercel)

### Infrastructure Stack

| Component | Technology | Purpose | Region Support |
|-----------|------------|---------|----------------|
| **Frontend Hosting** | Vercel | React SPA, Edge Network | Global |
| **Backend Platform** | Supabase | Complete backend services | Multi-region |
| **Database** | Supabase PostgreSQL + PostGIS | Spatial database | US, EU, APAC |
| **Authentication** | Supabase Auth | User management | Global |
| **Storage** | Supabase Storage | PDF/image storage | Regional buckets |
| **Realtime** | Supabase Realtime | Live sync | Global |
| **Functions** | Supabase Edge Functions (Deno) | API endpoints | Global edge |
| **CDN** | Vercel Edge Network | Static assets | Global |
| **Cache** | Upstash Redis | Application caching | Multi-region |
| **Payments** | Stripe | Billing & subscriptions | Global |

### Application Stack

**Web Portal (Vercel):**
- React 18 + TypeScript
- Vite build system
- Shadcn/ui + Radix + Tailwind CSS
- MapLibre GL JS for maps
- Supabase JS client
- Redux Toolkit for state

**Mobile Apps:**
- React Native + Expo
- MapLibre Native
- WatermelonDB (offline storage)
- Supabase JS client
- Background sync

**Backend (Supabase):**
- PostgreSQL 15 + PostGIS 3.4
- Supabase Edge Functions (Deno/TypeScript)
- Row Level Security (RLS)
- Database Functions (PL/pgSQL)
- Realtime subscriptions

---

## 🏗️ System Architecture (Supabase + Vercel)

```
┌─────────────────────────────────────────────────────────────┐
│                      GLOBAL USERS                            │
│                    (EU, US, CA, AU)                          │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
      ┌────────────────┐        ┌────────────────┐
      │  Web Portal    │        │  Mobile Apps   │
      │   (Vercel)     │        │ (iOS/Android)  │
      │                │        │                │
      │ - React + TS   │        │ - React Native │
      │ - MapLibre GL  │        │ - MapLibre     │
      │ - Realtime     │        │ - WatermelonDB │
      └────────┬───────┘        └────────┬───────┘
               │                         │
               └─────────┬───────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Vercel Edge CDN    │
              │  (Static Assets)     │
              └──────────┬───────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │      SUPABASE PLATFORM            │
         │  (Multi-Region Deployment)        │
         ├───────────────────────────────────┤
         │                                   │
         │  ┌─────────────────────────────┐ │
         │  │   Supabase Edge Functions   │ │
         │  │   (Deno Runtime - Global)   │ │
         │  │                             │ │
         │  │ - PDF processing            │ │
         │  │ - Georeferencing            │ │
         │  │ - Tile generation           │ │
         │  │ - Payment webhooks          │ │
         │  └──────────┬──────────────────┘ │
         │             │                     │
         │  ┌──────────▼──────────────────┐ │
         │  │   Supabase Auth             │ │
         │  │   (Multi-factor, OAuth)     │ │
         │  └──────────┬──────────────────┘ │
         │             │                     │
         │  ┌──────────▼──────────────────┐ │
         │  │   PostgreSQL + PostGIS      │ │
         │  │   (Regional Deployment)     │ │
         │  │                             │ │
         │  │  US-WEST-1: US customers    │ │
         │  │  EU-CENTRAL-1: EU customers │ │
         │  │  AP-SOUTHEAST-1: APAC       │ │
         │  │  + Row Level Security       │ │
         │  └──────────┬──────────────────┘ │
         │             │                     │
         │  ┌──────────▼──────────────────┐ │
         │  │   Supabase Storage          │ │
         │  │   (Regional Buckets)        │ │
         │  │                             │ │
         │  │  - PDF files                │ │
         │  │  - Georeferenced images     │ │
         │  │  - Map tiles                │ │
         │  └──────────┬──────────────────┘ │
         │             │                     │
         │  ┌──────────▼──────────────────┐ │
         │  │   Supabase Realtime         │ │
         │  │   (WebSocket Global)        │ │
         │  │                             │ │
         │  │  - Live overlay updates     │ │
         │  │  - Collaboration features   │ │
         │  └─────────────────────────────┘ │
         └───────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Upstash Redis      │
              │  (Multi-region)      │
              │  - Session cache     │
              │  - Rate limiting     │
              └──────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Stripe             │
              │  (Payment Processing)│
              │  - Subscriptions     │
              │  - Usage billing     │
              └──────────────────────┘
```

---

## 🗄️ Supabase Database Architecture

### Multi-Tenant Schema with RLS

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Organizations (tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    region TEXT NOT NULL CHECK (region IN ('us', 'eu', 'ca', 'au')),
    subscription_tier TEXT NOT NULL DEFAULT 'starter',
    subscription_status TEXT NOT NULL DEFAULT 'trialing',
    storage_limit_gb INTEGER NOT NULL DEFAULT 10,
    api_limit_monthly INTEGER NOT NULL DEFAULT 10000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users (linked to Supabase Auth)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT,
    avatar_url TEXT,
    default_organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Organization members (multi-tenant access)
CREATE TABLE organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- PDF Overlays (core feature)
CREATE TABLE pdf_overlays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),

    -- Metadata
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,

    -- Georeferencing
    bounds_north DOUBLE PRECISION NOT NULL,
    bounds_south DOUBLE PRECISION NOT NULL,
    bounds_east DOUBLE PRECISION NOT NULL,
    bounds_west DOUBLE PRECISION NOT NULL,
    bounds_geom GEOMETRY(POLYGON, 4326) GENERATED ALWAYS AS (
        ST_MakeEnvelope(bounds_west, bounds_south, bounds_east, bounds_north, 4326)
    ) STORED,

    -- Transformation parameters
    transform_params JSONB NOT NULL,
    reference_points JSONB NOT NULL,

    -- Tiling
    min_zoom INTEGER NOT NULL DEFAULT 0,
    max_zoom INTEGER NOT NULL DEFAULT 18,
    tile_format TEXT NOT NULL DEFAULT 'png' CHECK (tile_format IN ('png', 'jpg', 'webp')),

    -- Processing status
    processing_status TEXT NOT NULL DEFAULT 'pending',
    processing_error TEXT,
    processed_at TIMESTAMPTZ,

    -- Visibility
    is_public BOOLEAN DEFAULT FALSE,
    opacity DOUBLE PRECISION DEFAULT 0.8,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pdf_overlays ENABLE ROW LEVEL SECURITY;

-- Spatial index for geographic queries
CREATE INDEX idx_pdf_overlays_bounds_geom ON pdf_overlays USING GIST(bounds_geom);
CREATE INDEX idx_pdf_overlays_org_id ON pdf_overlays(organization_id);

-- Map tiles (cached)
CREATE TABLE map_tiles (
    overlay_id UUID NOT NULL REFERENCES pdf_overlays(id) ON DELETE CASCADE,
    z INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    tile_data BYTEA NOT NULL,
    etag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (overlay_id, z, x, y)
);

ALTER TABLE map_tiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_map_tiles_zxy ON map_tiles(z, x, y);

-- Usage tracking (for billing)
CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),

    event_type TEXT NOT NULL CHECK (event_type IN ('storage_used', 'api_request', 'tile_served', 'pdf_processed')),
    event_data JSONB DEFAULT '{}',
    quantity NUMERIC NOT NULL DEFAULT 1,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_usage_events_org_date ON usage_events(organization_id, created_at DESC);

-- Stripe subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    stripe_customer_id TEXT NOT NULL,
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_price_id TEXT NOT NULL,

    status TEXT NOT NULL,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can only see orgs they're members of
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

-- PDF Overlays: Tenant isolation
CREATE POLICY "Users can view overlays in their organizations"
    ON pdf_overlays FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = pdf_overlays.organization_id
            AND organization_members.user_id = auth.uid()
        )
        OR is_public = TRUE
    );

CREATE POLICY "Users can insert overlays in their organizations"
    ON pdf_overlays FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = pdf_overlays.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can update overlays they created"
    ON pdf_overlays FOR UPDATE
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Map Tiles: Same access as overlays
CREATE POLICY "Users can view tiles for accessible overlays"
    ON map_tiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM pdf_overlays
            JOIN organization_members ON organization_members.organization_id = pdf_overlays.organization_id
            WHERE pdf_overlays.id = map_tiles.overlay_id
            AND organization_members.user_id = auth.uid()
        )
    );

-- Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_overlays;
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
```

---

## ⚡ Supabase Edge Functions Architecture

### Key Edge Functions

**1. Process PDF (`process-pdf`)**
```typescript
// supabase/functions/process-pdf/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { overlayId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 1. Download PDF from Storage
  const { data: overlay } = await supabase
    .from('pdf_overlays')
    .select('*')
    .eq('id', overlayId)
    .single()

  const { data: pdfBlob } = await supabase.storage
    .from('pdfs')
    .download(overlay.file_path)

  // 2. Generate tiles using pdf-lib + sharp
  // (Implement PDF → Image → Tiles pipeline)

  // 3. Upload tiles to Storage
  // 4. Update overlay status

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
```

**2. Generate Tiles (`generate-tiles`)**
- Tile pyramid generation
- WebP/PNG optimization
- Upload to Supabase Storage

**3. Stripe Webhook (`stripe-webhook`)**
- Handle subscription events
- Update organization subscription status
- Track usage events

**4. Calculate Usage (`calculate-usage`)**
- Aggregate usage metrics
- Check limits
- Report to Stripe for metered billing

---

## 🌍 Multi-Region Deployment Strategy

### Supabase Regions

| Region | Location | Purpose | Data Residency |
|--------|----------|---------|----------------|
| **US West** | Oregon | Primary US | US/Canada customers |
| **EU Central** | Frankfurt | Primary EU | EU/UK customers |
| **AP Southeast** | Singapore | Primary APAC | Australia/APAC customers |

### Region Selection Logic

**Database Routing:**
```typescript
// Supabase client with region selection
const getSupabaseClient = (userRegion: 'us' | 'eu' | 'au') => {
  const urls = {
    us: 'https://your-project-us.supabase.co',
    eu: 'https://your-project-eu.supabase.co',
    au: 'https://your-project-au.supabase.co'
  }

  return createClient(urls[userRegion], anonKey)
}
```

**Vercel Edge Config:**
```json
{
  "regions": ["iad1", "fra1", "syd1"],
  "framework": "vite"
}
```

---

## 📱 Mobile App Architecture (React Native)

### Tech Stack
- **Framework**: React Native 0.73 + Expo SDK 50
- **Maps**: MapLibre Native (iOS/Android)
- **Offline DB**: WatermelonDB
- **Sync**: Supabase Realtime + Background Sync
- **Auth**: Supabase Auth with biometric

### Sync Architecture

```typescript
// WatermelonDB Model
@model('pdf_overlays')
class PDFOverlay extends Model {
  @field('name') name
  @field('bounds_north') boundsNorth
  @field('bounds_south') boundsSouth
  @field('bounds_east') boundsEast
  @field('bounds_west') boundsWest
  @field('file_path') filePath
  @field('is_synced') isSynced
  @field('last_synced_at') lastSyncedAt
}

// Bidirectional sync engine
class SyncEngine {
  async syncToServer() {
    const unsyncedOverlays = await database
      .get('pdf_overlays')
      .query(Q.where('is_synced', false))
      .fetch()

    for (const overlay of unsyncedOverlays) {
      await supabase.from('pdf_overlays').upsert({
        id: overlay.id,
        name: overlay.name,
        // ... other fields
      })

      await overlay.update(o => {
        o.isSynced = true
        o.lastSyncedAt = new Date()
      })
    }
  }

  async syncFromServer() {
    const { data: serverOverlays } = await supabase
      .from('pdf_overlays')
      .select('*')
      .gt('updated_at', lastSyncTimestamp)

    await database.write(async () => {
      for (const serverOverlay of serverOverlays) {
        await database.get('pdf_overlays').create(overlay => {
          overlay._raw.id = serverOverlay.id
          overlay.name = serverOverlay.name
          // ... map fields
        })
      }
    })
  }
}
```

### Offline Map Tiles

**PMTiles Format** (single-file tile archive):
```typescript
import { PMTiles } from 'pmtiles'
import MapLibreGL from '@maplibre/maplibre-react-native'

// Download PMTiles archive
const downloadOfflineMap = async (overlayId: string) => {
  const { data } = await supabase.storage
    .from('tiles')
    .download(`${overlayId}/tiles.pmtiles`)

  await FileSystem.writeAsStringAsync(
    `${FileSystem.documentDirectory}/${overlayId}.pmtiles`,
    data
  )
}

// Use offline tiles
<MapLibreGL.MapView>
  <MapLibreGL.RasterSource
    id={`overlay-${overlayId}`}
    tileUrlTemplates={[`pmtiles://${localPath}`]}
    tileSize={256}
  />
</MapLibreGL.MapView>
```

---

## 💳 Payment & Subscription System (Stripe + Supabase)

### Pricing Tiers

| Tier | Price/Month | Storage | API Requests | PDF Overlays | Team Members |
|------|-------------|---------|--------------|--------------|--------------|
| **Starter** | $9.90 | 10 GB | 10,000 | 100 | 3 |
| **Professional** | $49 | 100 GB | 100,000 | 1,000 | 10 |
| **Enterprise** | $299 | 1 TB | 1,000,000 | 10,000 | Unlimited |

### Stripe Integration with Supabase

**Edge Function: Stripe Webhook**
```typescript
// supabase/functions/stripe-webhook/index.ts
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')!
  const body = await req.text()

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  )

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object

      await supabase.from('subscriptions').upsert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      })

      // Update organization subscription_status
      await supabase.from('organizations')
        .update({ subscription_status: subscription.status })
        .eq('stripe_customer_id', subscription.customer)
      break

    case 'customer.subscription.deleted':
      // Handle cancellation
      break
  }

  return new Response(JSON.stringify({ received: true }))
})
```

---

## 🔒 Security & Compliance Framework

### Supabase Auth Configuration

**Multi-Factor Authentication:**
```typescript
// Enable MFA for user
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})

// Verify MFA
await supabase.auth.mfa.verify({
  factorId: data.id,
  code: userCode
})
```

**OAuth Providers:**
- Google
- Microsoft Azure AD (Enterprise SSO)
- GitHub

### Data Encryption

**At Rest:**
- Supabase PostgreSQL: AES-256 encryption (default)
- Supabase Storage: Encrypted at rest
- Sensitive columns: Additional PGP encryption

```sql
-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE user_profiles ADD COLUMN encrypted_ssn BYTEA;

-- Encrypt on insert
INSERT INTO user_profiles (id, encrypted_ssn)
VALUES (
  auth.uid(),
  pgp_sym_encrypt('123-45-6789', current_setting('app.encryption_key'))
);

-- Decrypt on select
SELECT pgp_sym_decrypt(encrypted_ssn, current_setting('app.encryption_key'))
FROM user_profiles;
```

**In Transit:**
- TLS 1.3 for all connections
- Certificate pinning in mobile apps

### GDPR Compliance

**Edge Function: Export User Data**
```typescript
// supabase/functions/gdpr-export/index.ts
serve(async (req) => {
  const userId = req.headers.get('user-id')!

  const supabase = createClient(...)

  // Gather all user data
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: overlays } = await supabase
    .from('pdf_overlays')
    .select('*')
    .eq('created_by', userId)

  // ... gather from all tables

  const exportData = {
    profile,
    overlays,
    usage_events,
    // ... all personal data
  }

  return new Response(JSON.stringify(exportData), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="user-data.json"'
    }
  })
})
```

**Edge Function: Delete User Data (Right to Erasure)**
```typescript
// supabase/functions/gdpr-delete/index.ts
serve(async (req) => {
  const userId = req.headers.get('user-id')!

  // Anonymize or delete personal data
  await supabase.from('user_profiles')
    .update({
      full_name: 'DELETED USER',
      email: `deleted-${userId}@example.com`,
      avatar_url: null
    })
    .eq('id', userId)

  // Delete PDFs from storage
  // Archive organization data if last member
  // ...

  return new Response(JSON.stringify({ deleted: true }))
})
```

---

## 📈 Implementation Timeline (16-20 Weeks)

### Phase 1: Foundation (Weeks 1-4)

**Week 1: Supabase Setup**
- Create Supabase projects (US, EU, AU regions)
- Run database migrations
- Configure RLS policies
- Setup Storage buckets
- Configure Auth providers

**Week 2: Web Portal Foundation**
- Setup Vercel project
- Install dependencies (React, Vite, Supabase, MapLibre)
- Configure routing
- Implement authentication flow
- Setup state management

**Week 3: Core Features - PDF Upload**
- File upload to Supabase Storage
- PDF metadata extraction
- Organization-specific storage paths
- Progress indicators
- Error handling

**Week 4: Core Features - Map Viewer**
- MapLibre GL integration
- Basemap configuration
- Layer management
- Basic overlay rendering
- Map controls (zoom, pan, rotate)

### Phase 2: Georeferencing & Processing (Weeks 5-8)

**Week 5: Georeferencing UI**
- Split-screen PDF/map view
- Control point placement
- Reference point management
- Coordinate transformation preview
- Save georeferencing data

**Week 6: Edge Function - PDF Processing**
- Deploy `process-pdf` Edge Function
- PDF → Image conversion (pdf-lib)
- Image transformation (sharp)
- Coordinate calculations
- Error handling & retries

**Week 7: Edge Function - Tile Generation**
- Deploy `generate-tiles` Edge Function
- Tile pyramid generation (z0-z18)
- Multiple formats (PNG, WebP)
- Upload to Storage
- Tile manifest creation

**Week 8: Overlay Management**
- Overlay list/gallery view
- Overlay metadata editing
- Visibility controls
- Opacity adjustment
- Delete/archive functionality

### Phase 3: Multi-Tenancy & Billing (Weeks 9-12)

**Week 9: Organization Management**
- Create organization flow
- Invite team members
- Role management (owner, admin, member, viewer)
- Organization settings
- Team dashboard

**Week 10: Stripe Integration**
- Setup Stripe products/prices
- Deploy `stripe-webhook` Edge Function
- Subscription creation flow
- Billing portal integration
- Payment method management

**Week 11: Usage Tracking**
- Deploy `calculate-usage` Edge Function
- Track storage usage
- Track API requests
- Track PDF processing
- Usage dashboard for users

**Week 12: Subscription Management**
- Plan upgrade/downgrade
- Proration handling
- Trial period (14 days)
- Usage limit enforcement
- Subscription cancellation

### Phase 4: Mobile Apps (Weeks 13-16)

**Week 13: React Native Setup**
- Initialize Expo project
- Install dependencies (MapLibre Native, WatermelonDB)
- Configure Supabase client
- Setup authentication
- Navigation structure

**Week 14: Mobile UI & Features**
- Overlay list view
- Map viewer with overlays
- PDF upload from camera/files
- Offline mode indicators
- Settings screen

**Week 15: Offline Sync**
- WatermelonDB schema
- Implement sync engine
- Conflict resolution
- Background sync (iOS/Android)
- PMTiles offline maps

**Week 16: Mobile Polish**
- iOS TestFlight build
- Android internal testing
- Performance optimization
- Bug fixes
- App Store preparation

### Phase 5: Production & Launch (Weeks 17-20)

**Week 17: Regional Deployment**
- Deploy to EU Supabase region
- Deploy to AU Supabase region
- Setup geo-routing
- Test cross-region functionality
- Load testing

**Week 18: Security Audit**
- Penetration testing
- RLS policy review
- GDPR compliance check
- SOC 2 preparation
- Vulnerability scanning

**Week 19: Performance Optimization**
- Frontend bundle optimization
- Database query optimization
- CDN caching configuration
- Edge Function optimization
- Mobile app size reduction

**Week 20: Launch Preparation**
- Production deployment checklist
- Monitoring setup (Sentry, LogRocket)
- Customer support setup
- Documentation completion
- Marketing site launch

---

## 💰 Cost Estimation (Supabase + Vercel)

### Monthly Costs by Scale

**Small SaaS (100 tenants, 500 PDFs/month):**
- Supabase Pro (3 regions): $75/month ($25 × 3)
- Vercel Pro: $20/month
- Upstash Redis: $10/month
- Stripe: $50/month (transaction fees)
- **Total: ~$155/month**

**Medium SaaS (1,000 tenants, 5,000 PDFs/month):**
- Supabase Team (3 regions): $75/month ($25 × 3)
- Additional compute: $100/month
- Additional storage: $50/month
- Vercel Pro: $20/month
- Upstash Redis: $30/month
- Stripe: $500/month
- **Total: ~$775/month**

**Large SaaS (10,000 tenants, 50,000 PDFs/month):**
- Supabase Enterprise (custom): $500/month
- Vercel Enterprise: $150/month
- Upstash Redis Pro: $80/month
- Stripe: $5,000/month
- Monitoring (Datadog): $100/month
- **Total: ~$5,830/month**

### Cost Optimization Strategies

1. **Efficient tile caching** (CDN + Redis)
2. **Storage lifecycle policies** (delete old tiles)
3. **Batch Edge Function processing**
4. **Lazy loading and code splitting**
5. **PMTiles for mobile** (reduce tile requests)

---

## 📊 Success Metrics & KPIs

### Performance KPIs
- **LCP**: < 2.5s (90% of page loads)
- **FID**: < 100ms (95% of interactions)
- **API Response Time**: < 500ms p95
- **PDF Processing**: < 30s for 100MB files
- **Tile Generation**: < 60s for full pyramid

### Business KPIs
- **User Signup Conversion**: > 10%
- **Trial → Paid Conversion**: > 15%
- **Monthly Churn Rate**: < 5%
- **Customer LTV**: > 12 months
- **Net Promoter Score**: > 50

### Technical KPIs
- **Uptime**: 99.9% (Supabase SLA)
- **Error Rate**: < 0.1%
- **Mobile Crash Rate**: < 0.5%
- **Sync Conflicts**: < 1% of sync operations

---

## 🚀 Post-Launch Roadmap

### Q3 2025 - Feature Expansion
- Collaborative editing
- Version control for overlays
- Advanced georeferencing (auto-detection)
- Bulk PDF import
- API for third-party integrations

### Q4 2025 - Enterprise Features
- SSO (SAML 2.0)
- Custom branding
- Dedicated infrastructure
- SLA guarantees
- Priority support

### 2026 - Scale & Innovation
- AI-powered georeferencing
- Automatic feature extraction
- 3D terrain support
- Desktop applications (Electron)
- Marketplace for public overlays

---

## 📁 Project Structure

```
OverlayApp/
├── web/                          # Vercel web portal
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── pages/                # Route pages
│   │   ├── lib/
│   │   │   ├── supabase.ts       # Supabase client
│   │   │   ├── auth.ts           # Auth helpers
│   │   │   └── stripe.ts         # Stripe integration
│   │   ├── hooks/                # Custom React hooks
│   │   ├── store/                # Redux store
│   │   └── styles/               # Tailwind CSS
│   ├── public/                   # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── mobile/                       # React Native app
│   ├── src/
│   │   ├── screens/              # App screens
│   │   ├── components/           # Shared components
│   │   ├── db/                   # WatermelonDB
│   │   ├── sync/                 # Sync engine
│   │   └── lib/
│   │       ├── supabase.ts
│   │       └── maplibre.ts
│   ├── ios/                      # iOS native
│   ├── android/                  # Android native
│   ├── app.json                  # Expo config
│   └── package.json
│
├── supabase/                     # Supabase backend
│   ├── migrations/               # Database migrations
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_functions.sql
│   ├── functions/                # Edge Functions
│   │   ├── process-pdf/
│   │   ├── generate-tiles/
│   │   ├── stripe-webhook/
│   │   ├── calculate-usage/
│   │   ├── gdpr-export/
│   │   └── gdpr-delete/
│   └── storage/                  # Storage buckets
│       ├── pdfs/
│       ├── tiles/
│       └── images/
│
├── docs/                         # Documentation
│   ├── API_DOCUMENTATION.md
│   ├── ARCHITECTURE.md
│   ├── SECURITY_FRAMEWORK.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── USER_GUIDE.md
│
└── README.md
```

---

## ✅ Next Steps

1. **Create Supabase Projects** (3 regions: US, EU, AU)
2. **Run Database Migrations** (multi-tenant schema with RLS)
3. **Setup Vercel Project** (deploy React app)
4. **Configure Stripe** (products, prices, webhook)
5. **Deploy Edge Functions** (PDF processing, tiles, webhooks)
6. **Implement Web Portal** (auth, upload, georeferencing, map)
7. **Build Mobile App** (React Native, offline sync)
8. **Launch Beta** (invite early users)
9. **Production Deployment** (multi-region)
10. **Go-to-Market** (marketing, sales)

---

**This comprehensive plan leverages Supabase + Vercel for a modern, scalable, multi-tenant SaaS platform with global reach, strong security, and excellent developer experience.**

**Estimated Total Development Cost**: $120k-$180k
**Time to Market**: 16-20 weeks
**Monthly Operating Cost**: $155-$5,830 (scales with usage)
**Target Annual Revenue**: $500k-$2M (1,000-10,000 customers)
