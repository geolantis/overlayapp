# Comprehensive Project Plan: PDF Overlay Management SaaS
## Modern Web Portal & Mobile Apps (Next.js 14 + Supabase + Vercel)

**Version:** 3.0 - Next.js Edition
**Date:** January 2025
**Target Launch:** Q2 2025 (16-20 weeks)

---

## 🎯 Executive Summary

Building a complete **multi-tenant SaaS platform** for PDF overlay management with:
- **Web Portal**: Next.js 14 App Router on Vercel with Server Components
- **Mobile Apps**: React Native (iOS + Android) with offline sync
- **Backend**: Supabase (PostgreSQL + PostGIS, Edge Functions, Auth, Storage, Realtime)
- **API**: Next.js API Routes + Server Actions + Supabase Edge Functions
- **Regions**: EU, US, Canada, Australia with data residency
- **Features**: PDF georeferencing, map overlays, real-time sync, payment processing

---

## 📊 Technology Stack (Next.js + Supabase + Vercel)

### Core Infrastructure

| Component | Technology | Purpose | Region Support |
|-----------|------------|---------|----------------|
| **Frontend Framework** | **Next.js 14 (App Router)** | React framework with SSR/SSG | Global |
| **Frontend Hosting** | **Vercel** | Edge Network, automatic deployments | Global |
| **Backend Platform** | **Supabase** | Complete backend services | Multi-region |
| **Database** | Supabase PostgreSQL + PostGIS | Spatial database | US, EU, APAC |
| **Authentication** | Supabase Auth + Next.js middleware | User management | Global |
| **Storage** | Supabase Storage | PDF/image storage | Regional buckets |
| **Realtime** | Supabase Realtime | Live sync | Global |
| **Serverless Functions** | Supabase Edge Functions (Deno) | Heavy processing | Global edge |
| **API Layer** | Next.js API Routes + Server Actions | Application API | Edge runtime |
| **CDN** | Vercel Edge Network | Static assets + ISR | Global |
| **Cache** | Vercel KV (Redis) | Application caching | Multi-region |
| **Payments** | Stripe | Billing & subscriptions | Global |

### Application Stack

**Web Portal (Next.js 14 + Vercel):**
- **Next.js 14.1+** with App Router
- **TypeScript** (strict mode)
- **Server Components** (default)
- **Client Components** (interactive UI)
- **Server Actions** (mutations)
- **Shadcn/ui + Radix + Tailwind CSS**
- **MapLibre GL JS** for maps
- **Supabase JS Client** (v2)
- **Zustand** for client state (lightweight)
- **React Hook Form** + Zod validation
- **Vercel Analytics** + Speed Insights

**Mobile Apps:**
- React Native 0.73 + Expo SDK 50
- MapLibre Native (iOS/Android)
- WatermelonDB (offline storage)
- Supabase JS client
- Background sync

**Backend (Supabase):**
- PostgreSQL 15 + PostGIS 3.4
- Supabase Edge Functions (Deno/TypeScript)
- Row Level Security (RLS)
- Database Functions (PL/pgSQL)
- Realtime subscriptions
- Storage buckets with CDN

---

## 🏗️ Next.js 14 Architecture

### App Router Structure

```
app/
├── (auth)/                          # Auth layout group
│   ├── login/
│   │   └── page.tsx                 # Login page
│   ├── signup/
│   │   └── page.tsx                 # Signup page
│   └── layout.tsx                   # Auth layout (no nav)
│
├── (dashboard)/                     # Authenticated layout group
│   ├── dashboard/
│   │   └── page.tsx                 # Dashboard (Server Component)
│   ├── overlays/
│   │   ├── page.tsx                 # Overlay list (Server Component)
│   │   ├── [id]/
│   │   │   ├── page.tsx             # Overlay detail
│   │   │   └── edit/
│   │   │       └── page.tsx         # Georeferencing interface
│   │   └── new/
│   │       └── page.tsx             # Upload new PDF
│   ├── map/
│   │   └── page.tsx                 # Map viewer (Client Component)
│   ├── organization/
│   │   ├── page.tsx                 # Organization settings
│   │   ├── members/
│   │   │   └── page.tsx             # Team management
│   │   └── billing/
│   │       └── page.tsx             # Subscription & billing
│   └── layout.tsx                   # Dashboard layout (nav + sidebar)
│
├── api/                             # API Routes (Edge Runtime)
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts             # Supabase auth callback
│   ├── webhooks/
│   │   └── stripe/
│   │       └── route.ts             # Stripe webhook handler
│   ├── tiles/
│   │   └── [overlayId]/
│   │       └── [z]/
│   │           └── [x]/
│   │               └── [y]/
│   │                   └── route.ts # Tile server (cached)
│   └── overlays/
│       └── [id]/
│           └── process/
│               └── route.ts         # Trigger processing
│
├── actions/                         # Server Actions
│   ├── overlays.ts                  # Overlay CRUD actions
│   ├── organizations.ts             # Org management actions
│   ├── billing.ts                   # Subscription actions
│   └── auth.ts                      # Auth actions
│
├── components/
│   ├── ui/                          # Shadcn/ui components
│   ├── map/
│   │   ├── MapViewer.tsx            # Client Component
│   │   ├── LayerPanel.tsx
│   │   └── OverlayLayer.tsx
│   ├── pdf/
│   │   ├── PdfUploader.tsx          # Client Component
│   │   ├── GeoreferencingTool.tsx   # Client Component
│   │   └── PdfPreview.tsx
│   ├── dashboard/
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   └── StatsCards.tsx           # Server Component
│   └── providers/
│       ├── SupabaseProvider.tsx     # Client provider
│       └── QueryProvider.tsx        # React Query
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                # Browser client
│   │   ├── server.ts                # Server client
│   │   └── middleware.ts            # Auth middleware
│   ├── stripe/
│   │   ├── client.ts                # Stripe client
│   │   └── webhooks.ts              # Webhook handlers
│   ├── db/
│   │   └── queries.ts               # Database queries
│   └── utils/
│       ├── geo.ts                   # Geospatial utilities
│       └── tiles.ts                 # Tile generation
│
├── middleware.ts                    # Next.js middleware (auth)
├── layout.tsx                       # Root layout
├── page.tsx                         # Landing page
└── globals.css                      # Tailwind CSS
```

### Server Components vs Client Components

**Server Components (Default):**
```tsx
// app/(dashboard)/overlays/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { OverlayCard } from '@/components/overlays/OverlayCard'

export default async function OverlaysPage() {
  const supabase = createServerClient()

  // Fetch data on the server
  const { data: overlays } = await supabase
    .from('pdf_overlays')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {overlays?.map((overlay) => (
        <OverlayCard key={overlay.id} overlay={overlay} />
      ))}
    </div>
  )
}
```

**Client Components (Interactive):**
```tsx
// components/map/MapViewer.tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useOverlays } from '@/hooks/useOverlays'

export function MapViewer({ initialOverlays }) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { overlays } = useOverlays(initialOverlays) // Realtime updates

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 0],
      zoom: 2
    })

    return () => map.current?.remove()
  }, [])

  // Add overlays to map...

  return <div ref={mapContainer} className="w-full h-screen" />
}
```

### Server Actions (Mutations)

```tsx
// app/actions/overlays.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createOverlaySchema = z.object({
  name: z.string().min(1),
  file: z.instanceof(File),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number()
  })
})

export async function createOverlay(formData: FormData) {
  const supabase = createServerClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Validate input
  const validated = createOverlaySchema.parse({
    name: formData.get('name'),
    file: formData.get('file'),
    bounds: JSON.parse(formData.get('bounds') as string)
  })

  // Upload PDF to Supabase Storage
  const filePath = `${user.id}/${Date.now()}_${validated.file.name}`
  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(filePath, validated.file)

  if (uploadError) throw uploadError

  // Create overlay record
  const { data: overlay, error } = await supabase
    .from('pdf_overlays')
    .insert({
      organization_id: user.user_metadata.organization_id,
      created_by: user.id,
      name: validated.name,
      file_path: filePath,
      file_size_bytes: validated.file.size,
      bounds_north: validated.bounds.north,
      bounds_south: validated.bounds.south,
      bounds_east: validated.bounds.east,
      bounds_west: validated.bounds.west,
      processing_status: 'pending'
    })
    .select()
    .single()

  if (error) throw error

  // Trigger processing (call Supabase Edge Function)
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ overlayId: overlay.id })
  })

  // Revalidate pages
  revalidatePath('/overlays')
  revalidatePath('/dashboard')

  return { success: true, overlay }
}
```

### Next.js Middleware (Authentication)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if ((request.nextUrl.pathname.startsWith('/login') ||
       request.nextUrl.pathname.startsWith('/signup')) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### API Routes (Edge Runtime)

```typescript
// app/api/tiles/[overlayId]/[z]/[x]/[y]/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge' // Run on Vercel Edge Network

export async function GET(
  request: NextRequest,
  { params }: { params: { overlayId: string, z: string, x: string, y: string } }
) {
  const supabase = createServerClient()

  // Verify user has access to this overlay
  const { data: overlay } = await supabase
    .from('pdf_overlays')
    .select('organization_id')
    .eq('id', params.overlayId)
    .single()

  if (!overlay) {
    return new NextResponse('Overlay not found', { status: 404 })
  }

  // Try to get tile from database cache
  const { data: tile } = await supabase
    .from('map_tiles')
    .select('tile_data, etag')
    .eq('overlay_id', params.overlayId)
    .eq('z', parseInt(params.z))
    .eq('x', parseInt(params.x))
    .eq('y', parseInt(params.y))
    .single()

  if (tile) {
    return new NextResponse(tile.tile_data, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'ETag': tile.etag
      }
    })
  }

  // If not cached, fetch from Supabase Storage
  const tilePath = `${params.overlayId}/${params.z}/${params.x}/${params.y}.png`
  const { data: tileFile, error } = await supabase.storage
    .from('tiles')
    .download(tilePath)

  if (error || !tileFile) {
    return new NextResponse('Tile not found', { status: 404 })
  }

  const buffer = await tileFile.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
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

    -- Stripe
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    default_organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Organization members
CREATE TABLE organization_members (
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- PDF Overlays
CREATE TABLE pdf_overlays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),

    -- Metadata
    name TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL, -- Supabase Storage path
    file_size_bytes BIGINT NOT NULL,

    -- Georeferencing
    bounds_north DOUBLE PRECISION NOT NULL,
    bounds_south DOUBLE PRECISION NOT NULL,
    bounds_east DOUBLE PRECISION NOT NULL,
    bounds_west DOUBLE PRECISION NOT NULL,
    bounds_geom GEOMETRY(POLYGON, 4326) GENERATED ALWAYS AS (
        ST_MakeEnvelope(bounds_west, bounds_south, bounds_east, bounds_north, 4326)
    ) STORED,

    -- Transformation
    transform_params JSONB NOT NULL,
    reference_points JSONB NOT NULL,

    -- Tiling
    min_zoom INTEGER NOT NULL DEFAULT 0,
    max_zoom INTEGER NOT NULL DEFAULT 18,
    tile_format TEXT NOT NULL DEFAULT 'png',

    -- Processing
    processing_status TEXT NOT NULL DEFAULT 'pending',
    processing_error TEXT,
    processed_at TIMESTAMPTZ,

    -- Display
    is_public BOOLEAN DEFAULT FALSE,
    opacity DOUBLE PRECISION DEFAULT 0.8,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pdf_overlays ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pdf_overlays_bounds_geom ON pdf_overlays USING GIST(bounds_geom);
CREATE INDEX idx_pdf_overlays_org_id ON pdf_overlays(organization_id);
CREATE INDEX idx_pdf_overlays_status ON pdf_overlays(processing_status);

-- Map tiles (cache)
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

-- Usage tracking
CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    quantity NUMERIC NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_usage_events_org_date ON usage_events(organization_id, created_at DESC);

-- Subscriptions
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

-- Organizations
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = organizations.id
            AND organization_members.user_id = auth.uid()
        )
    );

-- PDF Overlays
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

CREATE POLICY "Users can insert overlays"
    ON pdf_overlays FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_members.organization_id = pdf_overlays.organization_id
            AND organization_members.user_id = auth.uid()
            AND organization_members.role IN ('owner', 'admin', 'member')
        )
    );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_overlays;
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
```

---

## ⚡ Supabase Edge Functions + Next.js API Integration

### Architecture Pattern

```
User Action (Next.js)
    ↓
Server Action / API Route
    ↓
Supabase Database (metadata)
    ↓
Trigger Edge Function (heavy processing)
    ↓
Edge Function processes PDF
    ↓
Stores tiles in Supabase Storage
    ↓
Updates database status
    ↓
Realtime notification to Next.js client
```

### Next.js API Route Example

```typescript
// app/api/overlays/[id]/process/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  // Verify access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get overlay
  const { data: overlay } = await supabase
    .from('pdf_overlays')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!overlay) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Update status to processing
  await supabase
    .from('pdf_overlays')
    .update({ processing_status: 'processing' })
    .eq('id', params.id)

  // Trigger Supabase Edge Function
  const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-pdf`

  await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      overlayId: params.id,
      userId: user.id
    })
  })

  return NextResponse.json({ success: true, status: 'processing' })
}
```

### Supabase Edge Function

```typescript
// supabase/functions/process-pdf/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { overlayId, userId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  try {
    // 1. Get overlay metadata
    const { data: overlay } = await supabase
      .from('pdf_overlays')
      .select('*')
      .eq('id', overlayId)
      .single()

    // 2. Download PDF from Storage
    const { data: pdfBlob, error: downloadError } = await supabase.storage
      .from('pdfs')
      .download(overlay.file_path)

    if (downloadError) throw downloadError

    // 3. Process PDF → Generate tiles
    // (Use pdf-lib + sharp for PDF processing)
    // Generate tile pyramid (z0 - z18)

    // 4. Upload tiles to Storage
    for (const tile of generatedTiles) {
      const tilePath = `${overlayId}/${tile.z}/${tile.x}/${tile.y}.png`
      await supabase.storage
        .from('tiles')
        .upload(tilePath, tile.buffer, {
          contentType: 'image/png',
          cacheControl: '31536000' // 1 year
        })

      // Cache in database
      await supabase.from('map_tiles').insert({
        overlay_id: overlayId,
        z: tile.z,
        x: tile.x,
        y: tile.y,
        tile_data: tile.buffer,
        etag: tile.etag
      })
    }

    // 5. Update overlay status
    await supabase
      .from('pdf_overlays')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', overlayId)

    // 6. Track usage event
    await supabase.from('usage_events').insert({
      organization_id: overlay.organization_id,
      user_id: userId,
      event_type: 'pdf_processed',
      event_data: { overlay_id: overlayId }
    })

    return new Response(
      JSON.stringify({ success: true, overlay_id: overlayId }),
      { headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    // Update error status
    await supabase
      .from('pdf_overlays')
      .update({
        processing_status: 'failed',
        processing_error: error.message
      })
      .eq('id', overlayId)

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
```

---

## 📱 Mobile App Integration with Next.js Backend

### API Communication

```typescript
// mobile/src/lib/api.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

// Fetch overlays via Supabase (not Next.js API)
export async function fetchOverlays() {
  const { data, error } = await supabase
    .from('pdf_overlays')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Upload PDF via Next.js API for processing
export async function uploadPDF(file: File, metadata: any) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('metadata', JSON.stringify(metadata))

  const { data: { session } } = await supabase.auth.getSession()

  const response = await fetch(`${NEXTJS_API_URL}/api/overlays/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    },
    body: formData
  })

  return response.json()
}

// Subscribe to realtime changes
export function subscribeToOverlays(callback: (overlay: any) => void) {
  return supabase
    .channel('pdf_overlays_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pdf_overlays'
      },
      (payload) => callback(payload.new)
    )
    .subscribe()
}
```

---

## 🌍 Multi-Region Deployment (Vercel + Supabase)

### Vercel Edge Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['*.supabase.co'],
  },

  // Deploy to multiple regions
  experimental: {
    runtime: 'experimental-edge',
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/tiles/:overlayId/:z/:x/:y',
        destination: '/api/tiles/:overlayId/:z/:x/:y',
      },
    ]
  },
}

module.exports = nextConfig
```

### Vercel Regions

```json
// vercel.json
{
  "regions": ["iad1", "fra1", "syd1"],
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "crons": [
    {
      "path": "/api/cron/usage",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Supabase Multi-Region Setup

**Three separate Supabase projects:**
- **US Project**: `us-project.supabase.co`
- **EU Project**: `eu-project.supabase.co`
- **AU Project**: `au-project.supabase.co`

**Region Selection in Next.js:**

```typescript
// lib/supabase/region-router.ts
export function getSupabaseUrl(userRegion?: 'us' | 'eu' | 'au') {
  const urls = {
    us: process.env.NEXT_PUBLIC_SUPABASE_URL_US!,
    eu: process.env.NEXT_PUBLIC_SUPABASE_URL_EU!,
    au: process.env.NEXT_PUBLIC_SUPABASE_URL_AU!
  }

  // Determine region from user or geo-IP
  const region = userRegion || detectRegionFromIP()

  return urls[region] || urls.us
}

export function createRegionalClient(region?: string) {
  const url = getSupabaseUrl(region as any)
  const key = getSupabaseAnonKey(region as any)

  return createBrowserClient(url, key)
}
```

---

## 💳 Payment Integration (Stripe + Next.js)

### Stripe Checkout with Server Actions

```typescript
// app/actions/billing.ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(priceId: string) {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get or create customer
  const { data: org } = await supabase
    .from('organizations')
    .select('stripe_customer_id')
    .eq('id', user.user_metadata.organization_id)
    .single()

  let customerId = org?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        organization_id: user.user_metadata.organization_id
      }
    })

    customerId = customer.id

    await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.user_metadata.organization_id)
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?canceled=true`,
    subscription_data: {
      trial_period_days: 14
    }
  })

  redirect(session.url!)
}
```

### Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object

      await supabase.from('subscriptions').upsert({
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        cancel_at_period_end: subscription.cancel_at_period_end
      })

      // Update organization
      await supabase
        .from('organizations')
        .update({
          subscription_status: subscription.status,
          stripe_subscription_id: subscription.id
        })
        .eq('stripe_customer_id', subscription.customer)

      break

    case 'customer.subscription.deleted':
      // Handle cancellation
      await supabase
        .from('organizations')
        .update({ subscription_status: 'canceled' })
        .eq('stripe_subscription_id', event.data.object.id)
      break
  }

  return NextResponse.json({ received: true })
}
```

---

## 📈 Implementation Timeline (16-20 Weeks)

### Phase 1: Next.js Foundation (Weeks 1-4)

**Week 1: Setup & Configuration**
- Initialize Next.js 14 project with App Router
- Setup Supabase (3 regional projects)
- Configure Vercel deployment
- Install dependencies (Shadcn/ui, MapLibre, Stripe)
- Setup TypeScript strict mode

**Week 2: Authentication & Layout**
- Implement Supabase Auth integration
- Create auth pages (login, signup)
- Setup Next.js middleware for auth
- Build dashboard layout (nav, sidebar)
- Implement user profile management

**Week 3: Database & RLS**
- Run Supabase migrations
- Configure Row Level Security policies
- Test multi-tenant isolation
- Setup Supabase Storage buckets
- Create database helper functions

**Week 4: Core Components**
- Build Shadcn/ui component library
- Create reusable UI components
- Setup MapLibre GL integration
- Implement responsive layouts
- Add dark mode support

### Phase 2: PDF Features (Weeks 5-8)

**Week 5: PDF Upload**
- Server Action for file upload
- Progress indicators
- Supabase Storage integration
- File validation (size, type)
- Organization-specific paths

**Week 6: Georeferencing UI**
- Split-screen PDF/map viewer
- Control point placement
- Reference point management
- Coordinate transformation
- Save georeferencing data

**Week 7: PDF Processing**
- Deploy Supabase Edge Function
- PDF → Image conversion
- Tile generation pipeline
- Upload to Storage
- Database caching

**Week 8: Map Viewer**
- MapLibre GL map component
- Overlay rendering
- Layer management
- Opacity controls
- Zoom to extent

### Phase 3: Multi-Tenancy & Billing (Weeks 9-12)

**Week 9: Organization Management**
- Create organization flow
- Team invitation system
- Role-based permissions
- Organization settings
- Member management UI

**Week 10: Stripe Integration**
- Setup Stripe products
- Checkout flow (Server Actions)
- Webhook handler
- Billing portal integration
- Subscription management

**Week 11: Usage Tracking**
- Track storage usage
- Track API requests
- Track PDF processing
- Usage dashboard
- Limit enforcement

**Week 12: Admin Features**
- Analytics dashboard
- Revenue metrics
- Usage reports
- Customer management
- System health monitoring

### Phase 4: Mobile Apps (Weeks 13-16)

**Week 13-16**: Same as previous plan

### Phase 5: Production (Weeks 17-20)

**Week 17-20**: Same as previous plan

---

## 💰 Cost Estimation (Next.js + Supabase + Vercel)

### Monthly Costs

**Small SaaS (100 tenants, 500 PDFs/month):**
- **Vercel Pro**: $20/month
- **Supabase Pro** (3 regions): $75/month
- **Vercel KV** (Redis): $10/month
- **Stripe fees**: $50/month
- **Total: ~$155/month**

**Medium SaaS (1,000 tenants, 5,000 PDFs/month):**
- **Vercel Pro**: $20/month
- **Supabase Team** (3 regions): $75/month
- **Additional compute**: $100/month
- **Additional storage**: $50/month
- **Vercel KV Pro**: $30/month
- **Stripe fees**: $500/month
- **Total: ~$775/month**

**Large SaaS (10,000 tenants, 50,000 PDFs/month):**
- **Vercel Enterprise**: $150/month
- **Supabase Enterprise**: $500/month
- **Vercel KV**: $80/month
- **Stripe fees**: $5,000/month
- **Monitoring**: $100/month
- **Total: ~$5,830/month**

---

## 🚀 Next.js-Specific Advantages

### Performance Benefits

1. **Server Components**: Zero JavaScript for static content
2. **Incremental Static Regeneration**: Cached pages with on-demand revalidation
3. **Edge Runtime**: API routes run on Vercel's global edge network
4. **Image Optimization**: Automatic WebP/AVIF conversion
5. **Route Prefetching**: Instant navigation with Link component

### Developer Experience

1. **File-based Routing**: Intuitive app/ directory structure
2. **TypeScript**: Full type safety with autocomplete
3. **Server Actions**: Mutations without API routes
4. **Middleware**: Global auth enforcement
5. **Hot Reload**: Instant feedback during development

### SEO & Marketing

1. **SSR**: Search engines can crawl all pages
2. **Metadata API**: Dynamic meta tags per page
3. **Open Graph**: Social media previews
4. **Analytics**: Built-in Vercel Analytics
5. **A/B Testing**: Vercel Edge Middleware

---

## ✅ Final Deliverables

### Web Portal (Next.js + Vercel)
- Modern, responsive UI with Shadcn/ui
- Server-side rendering for SEO
- Edge runtime for global performance
- Real-time updates via Supabase Realtime
- Stripe payment integration
- Multi-tenant with RLS

### Mobile Apps (React Native)
- iOS and Android native apps
- Offline-first architecture
- Background sync
- MapLibre Native for maps
- Supabase integration

### Backend (Supabase)
- PostgreSQL + PostGIS database
- Row Level Security
- Edge Functions for processing
- Regional deployment (US, EU, AU)
- Storage with CDN

### Infrastructure
- Vercel Edge Network (global CDN)
- Supabase multi-region
- Stripe payment processing
- Vercel KV (Redis cache)
- Monitoring & analytics

---

**This comprehensive Next.js 14 + Supabase + Vercel plan provides a modern, scalable, performant SaaS platform with excellent developer experience and user experience.**

**Total Development Cost**: $120k-$180k
**Time to Market**: 16-20 weeks
**Monthly Operating Cost**: $155-$5,830 (scales with usage)
**Tech Stack**: Next.js 14 + Supabase + Vercel + React Native
