# System Architecture - OverlayApp

**Stack**: Next.js 14 + Supabase + Vercel

**Last Updated**: 2025-10-01

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Multi-Region Deployment](#multi-region-deployment)
6. [Security Architecture](#security-architecture)
7. [Scalability Considerations](#scalability-considerations)

---

## Technology Stack

### Frontend Layer
- **Framework**: Next.js 14 (App Router)
- **Runtime**: React 18+
- **Language**: TypeScript
- **UI Components**: TailwindCSS + Shadcn/UI
- **State Management**: React Query + Zustand
- **Real-time**: Supabase Realtime Subscriptions

### Backend Layer
- **API Routes**: Next.js API Routes (Node.js)
- **Serverless Functions**: Supabase Edge Functions (Deno)
- **Runtime**: Vercel Edge Runtime + Deno

### Database & Storage Layer
- **Primary Database**: Supabase PostgreSQL
- **Geospatial**: PostGIS Extension
- **File Storage**: Supabase Storage
- **Cache Layer**: Vercel KV (Redis)
- **Vector Store**: pgvector (for AI features)

### Authentication & Security
- **Auth Provider**: Supabase Auth
- **Session Management**: Supabase Auth + Next.js Middleware
- **API Security**: Row Level Security (RLS) + JWT Validation

### Hosting & Deployment
- **Frontend Hosting**: Vercel
- **Edge Network**: Vercel Edge Network
- **Backend**: Supabase Cloud
- **CDN**: Vercel CDN

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Next.js 14 App (React + TypeScript)              │   │
│  │                                                            │   │
│  │  ├── App Router (Server Components)                       │   │
│  │  ├── Client Components (Interactive UI)                   │   │
│  │  ├── TailwindCSS + Shadcn/UI                             │   │
│  │  └── React Query (Data Fetching & Caching)               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Next.js Middleware                       │   │
│  │  ├── Authentication Validation                            │   │
│  │  ├── Request Routing                                      │   │
│  │  ├── Rate Limiting                                        │   │
│  │  └── Response Caching                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Vercel KV (Redis)                        │   │
│  │  ├── Session Cache                                        │   │
│  │  ├── API Response Cache                                   │   │
│  │  └── Rate Limit Counters                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│                                                                  │
│  ┌─────────────────────┐        ┌─────────────────────────┐    │
│  │  Next.js API Routes │        │ Supabase Edge Functions │    │
│  │    (Node.js)        │        │       (Deno)            │    │
│  │                     │        │                         │    │
│  │ ├── REST Endpoints  │        │ ├── Webhooks            │    │
│  │ ├── Business Logic  │        │ ├── Background Jobs     │    │
│  │ ├── Data Validation │        │ ├── AI Processing       │    │
│  │ └── Response Format │        │ └── Real-time Triggers  │    │
│  └─────────────────────┘        └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE PLATFORM                          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Supabase Auth                           │   │
│  │  ├── JWT Token Management                               │   │
│  │  ├── OAuth Providers (Google, GitHub, etc.)             │   │
│  │  ├── Magic Links                                         │   │
│  │  └── Session Management                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database + PostGIS               │   │
│  │                                                           │   │
│  │  ├── Tables (with Row Level Security)                    │   │
│  │  ├── PostGIS (Geospatial Data)                          │   │
│  │  ├── pgvector (Vector Embeddings)                        │   │
│  │  ├── Database Functions                                  │   │
│  │  ├── Triggers                                            │   │
│  │  └── Real-time Subscriptions                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Supabase Storage                         │   │
│  │  ├── User Uploads                                        │   │
│  │  ├── Media Files                                         │   │
│  │  ├── Document Storage                                     │   │
│  │  └── CDN Integration                                     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Supabase Realtime                        │   │
│  │  ├── WebSocket Connections                               │   │
│  │  ├── Presence Tracking                                   │   │
│  │  ├── Broadcast Channels                                  │   │
│  │  └── Database Change Events                              │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 14 App Structure                  │
│                                                              │
│  /app                                                        │
│  ├── (auth)                  # Auth Routes                  │
│  │   ├── login/              # Login page                   │
│  │   ├── register/           # Registration                 │
│  │   └── reset-password/     # Password reset               │
│  │                                                           │
│  ├── (dashboard)             # Protected Routes             │
│  │   ├── layout.tsx          # Dashboard layout             │
│  │   ├── page.tsx            # Dashboard home               │
│  │   ├── profile/            # User profile                 │
│  │   ├── settings/           # User settings                │
│  │   └── [feature]/          # Feature modules              │
│  │                                                           │
│  ├── api/                    # API Routes                   │
│  │   ├── webhooks/           # Webhook handlers             │
│  │   ├── [resource]/         # CRUD endpoints               │
│  │   └── integrations/       # External APIs                │
│  │                                                           │
│  ├── layout.tsx              # Root layout                  │
│  ├── page.tsx                # Landing page                 │
│  └── middleware.ts           # Edge middleware              │
│                                                              │
│  /components                                                 │
│  ├── ui/                     # Shadcn/UI components         │
│  ├── features/               # Feature components           │
│  ├── layouts/                # Layout components            │
│  └── shared/                 # Shared components            │
│                                                              │
│  /lib                                                        │
│  ├── supabase/               # Supabase clients             │
│  │   ├── client.ts           # Client-side client           │
│  │   ├── server.ts           # Server-side client           │
│  │   └── middleware.ts       # Middleware client            │
│  ├── api/                    # API utilities                │
│  ├── hooks/                  # React hooks                  │
│  ├── utils/                  # Utility functions            │
│  └── types/                  # TypeScript types             │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Backend Services Architecture                │
│                                                              │
│  ┌────────────────────┐         ┌─────────────────────┐    │
│  │ Next.js API Routes │         │ Supabase Edge Funcs │    │
│  │   (Vercel)         │         │     (Deno)          │    │
│  ├────────────────────┤         ├─────────────────────┤    │
│  │                    │         │                     │    │
│  │ • User Management  │         │ • Webhooks          │    │
│  │ • Data CRUD        │◄───────►│ • Background Tasks  │    │
│  │ • File Upload      │         │ • Scheduled Jobs    │    │
│  │ • Search/Filter    │         │ • AI Processing     │    │
│  │ • Analytics        │         │ • Email Service     │    │
│  │ • Integrations     │         │ • Notifications     │    │
│  │                    │         │                     │    │
│  └────────────────────┘         └─────────────────────┘    │
│           │                              │                  │
│           └──────────────┬───────────────┘                  │
│                          ▼                                  │
│           ┌──────────────────────────────┐                 │
│           │    Supabase PostgreSQL       │                 │
│           │                               │                 │
│           │  • Row Level Security (RLS)   │                 │
│           │  • Database Functions         │                 │
│           │  • Triggers & Webhooks        │                 │
│           │  • Real-time Subscriptions    │                 │
│           └──────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Architecture

### Request Flow (Client → Server → Database)

```
┌────────┐                                                    ┌──────────┐
│        │  1. User Action (Click/Submit)                    │          │
│ Client ├──────────────────────────────────────────────────►│  Next.js │
│  App   │                                                    │   App    │
│        │                                                    │          │
└────────┘                                                    └─────┬────┘
                                                                    │
                                                                    │ 2. Middleware
                                                                    │    Check Auth
                                                                    ▼
                                                           ┌────────────────┐
                                                           │   Middleware   │
                                                           │                │
                                                           │ • Verify JWT   │
                                                           │ • Rate Limit   │
                                                           │ • Cache Check  │
                                                           └────────┬───────┘
                                                                    │
                                                    ┌───────────────┴────────────┐
                                                    │                            │
                                                    ▼                            ▼
                                          ┌─────────────────┐         ┌──────────────────┐
                                          │  Vercel KV      │         │  API Route or    │
                                          │  (Cache Hit?)   │         │  Edge Function   │
                                          │                 │         │                  │
                                          │ • Session Data  │         │ • Business Logic │
                                          │ • API Response  │         │ • Validation     │
                                          └─────────────────┘         └────────┬─────────┘
                                                    │                           │
                                                    │                           │ 3. Query DB
                                                    │                           ▼
                                                    │                  ┌────────────────────┐
                                                    │                  │  Supabase Client   │
                                                    │                  │                    │
                                                    │                  │ • Build Query      │
                                                    │                  │ • Apply RLS        │
                                                    │                  └────────┬───────────┘
                                                    │                           │
                                                    │                           │ 4. Execute
                                                    │                           ▼
                                                    │                  ┌────────────────────┐
                                                    │                  │    PostgreSQL      │
                                                    │                  │                    │
                                                    │                  │ • Apply RLS Policy │
                                                    │                  │ • Execute Query    │
                                                    │                  │ • Return Results   │
                                                    │                  └────────┬───────────┘
                                                    │                           │
                                                    │                           │ 5. Response
                                                    │                           ▼
                                                    │                  ┌────────────────────┐
                                                    │                  │   Format Response  │
                                                    │◄─────────────────┤   & Update Cache   │
                                                    │                  └────────────────────┘
                                                    │
                                                    │ 6. Return to Client
                                                    ▼
┌────────┐                                 ┌─────────────────┐
│        │  7. Update UI                   │                 │
│ Client │◄────────────────────────────────┤  JSON Response  │
│  App   │                                 │                 │
└────────┘                                 └─────────────────┘
```

### Real-time Data Flow

```
┌─────────────┐                                          ┌──────────────────┐
│   Client A  │                                          │    PostgreSQL    │
│             │  1. Subscribe to channel                 │                  │
│             ├─────────────────────────────────────────►│ • Enable Realtime│
│             │                                          │ • Create Channel │
└─────────────┘                                          └────────┬─────────┘
                                                                  │
┌─────────────┐                                                  │
│   Client B  │                                                  │
│             │  2. Subscribed to same channel                   │
│             ├─────────────────────────────────────────────────►│
└─────────────┘                                                  │
                                                                  │
┌─────────────┐                                                  │
│   Client C  │  3. Insert/Update/Delete data                   │
│             ├─────────────────────────────────────────────────►│
└─────────────┘                                                  │
                                                                  │
                                                                  │ 4. Trigger fires
                                                                  ▼
                                                         ┌─────────────────┐
                                                         │ Supabase        │
                                                         │ Realtime        │
                                                         │                 │
                                                         │ • Detect Change │
                                                         │ • Apply RLS     │
                                                         │ • Broadcast     │
                                                         └────────┬────────┘
                                                                  │
                    5. Push updates to subscribed clients        │
                    ┌─────────────────────────────────────────────┘
                    │                        │
                    ▼                        ▼
          ┌─────────────────┐      ┌─────────────────┐
          │    Client A     │      │    Client B     │
          │                 │      │                 │
          │ • Receive Event │      │ • Receive Event │
          │ • Update UI     │      │ • Update UI     │
          └─────────────────┘      └─────────────────┘
```

### File Upload Flow

```
┌────────┐                                                    ┌──────────────┐
│        │  1. Select File                                   │              │
│ Client ├──────────────────────────────────────────────────►│  Next.js App │
│        │                                                    │              │
└────────┘                                                    └──────┬───────┘
                                                                     │
                                                                     │ 2. Get Upload URL
                                                                     ▼
                                                            ┌────────────────┐
                                                            │  API Route     │
                                                            │                │
                                                            │ • Validate     │
                                                            │ • Auth Check   │
                                                            └────────┬───────┘
                                                                     │
                                                                     │ 3. Request Signed URL
                                                                     ▼
                                                            ┌────────────────┐
                                                            │ Supabase       │
                                                            │ Storage        │
                                                            │                │
                                                            │ • Generate URL │
                                                            │ • Set Policy   │
                                                            └────────┬───────┘
                                                                     │
                                                                     │ 4. Return Signed URL
┌────────┐                                                          │
│        │  5. Upload File Directly                                │
│ Client │◄─────────────────────────────────────────────────────────┘
│        ├─────────────────────────────────────────────────────────┐
└────────┘                                                          │
                                                                     ▼
                                                            ┌────────────────┐
                                                            │ Supabase       │
                                                            │ Storage Bucket │
                                                            │                │
                                                            │ • Store File   │
                                                            │ • Return URL   │
                                                            └────────┬───────┘
                                                                     │
                                                                     │ 6. Save Metadata
                                                                     ▼
                                                            ┌────────────────┐
                                                            │  PostgreSQL    │
                                                            │                │
                                                            │ • File Record  │
                                                            │ • User Link    │
                                                            └────────────────┘
```

---

## Multi-Region Deployment Architecture

### Global Distribution Strategy

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         GLOBAL EDGE NETWORK                                │
│                                                                            │
│                          Vercel Edge Network                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐              │
│  │   US-EAST      │  │    EUROPE      │  │   ASIA-PAC     │              │
│  │   (Primary)    │  │   (Secondary)  │  │  (Secondary)   │              │
│  │                │  │                │  │                │              │
│  │ • Next.js App  │  │ • Next.js App  │  │ • Next.js App  │              │
│  │ • Middleware   │  │ • Middleware   │  │ • Middleware   │              │
│  │ • Static Files │  │ • Static Files │  │ • Static Files │              │
│  │ • Edge Cache   │  │ • Edge Cache   │  │ • Edge Cache   │              │
│  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘              │
│           │                   │                    │                       │
└───────────┼───────────────────┼────────────────────┼───────────────────────┘
            │                   │                    │
            │                   │                    │
            └───────────────────┼────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Vercel KV (Redis)   │
                    │                       │
                    │   • Global Cache      │
                    │   • Session Store     │
                    │   • Rate Limiting     │
                    └───────────┬───────────┘
                                │
                                ▼
            ┌───────────────────────────────────────┐
            │         Supabase Platform             │
            │                                       │
            │  ┌─────────────────────────────────┐ │
            │  │   Primary Region: US-EAST       │ │
            │  │                                 │ │
            │  │  • PostgreSQL (Primary)         │ │
            │  │  • Storage Buckets              │ │
            │  │  • Auth Service                 │ │
            │  │  • Realtime Service             │ │
            │  │  • Edge Functions               │ │
            │  └─────────────────────────────────┘ │
            │                                       │
            │  ┌─────────────────────────────────┐ │
            │  │   Read Replicas (Optional)      │ │
            │  │                                 │ │
            │  │  • Europe Region                │ │
            │  │  • Asia-Pacific Region          │ │
            │  │  • Read-only traffic            │ │
            │  └─────────────────────────────────┘ │
            └───────────────────────────────────────┘
```

### Request Routing by Region

```
┌─────────────────────────────────────────────────────────────┐
│                      Global Request Flow                     │
│                                                              │
│  User (Europe)                                              │
│       │                                                      │
│       │ 1. DNS Resolution                                   │
│       ▼                                                      │
│  ┌─────────────┐                                            │
│  │ Vercel Edge │ ──► Nearest Edge: Europe                  │
│  │   Network   │                                            │
│  └──────┬──────┘                                            │
│         │                                                    │
│         │ 2. Edge Processing                                │
│         ▼                                                    │
│  ┌─────────────────┐                                        │
│  │  Edge Compute   │                                        │
│  │  (EU Region)    │                                        │
│  │                 │                                        │
│  │ • Middleware    │                                        │
│  │ • Auth Check    │                                        │
│  │ • Cache Lookup  │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           │ 3a. Cache Hit? → Return                         │
│           │ 3b. Cache Miss? → Continue                      │
│           ▼                                                  │
│  ┌─────────────────┐                                        │
│  │  API Route/     │                                        │
│  │  Server Comp    │                                        │
│  │                 │                                        │
│  │ • Business Logic│                                        │
│  │ • Data Fetch    │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           │ 4. Database Query                               │
│           ▼                                                  │
│  ┌──────────────────────┐                                   │
│  │  Supabase (US-EAST)  │ ◄─── Primary DB                  │
│  │        OR            │                                   │
│  │  Read Replica (EU)   │ ◄─── Read-only query             │
│  └──────────────────────┘                                   │
│           │                                                  │
│           │ 5. Response + Cache                             │
│           ▼                                                  │
│       User receives response                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Disaster Recovery & Failover

```
┌─────────────────────────────────────────────────────────────┐
│                  Disaster Recovery Strategy                  │
│                                                              │
│  Primary Region: US-EAST                                    │
│  ┌────────────────────────────────────────────┐            │
│  │  Supabase Instance (Primary)               │            │
│  │  • PostgreSQL (Read/Write)                 │            │
│  │  • Continuous Backup (Point-in-time)       │            │
│  │  • Transaction Log Streaming               │            │
│  └────────────────┬───────────────────────────┘            │
│                   │                                         │
│                   │ Real-time Replication                   │
│                   ▼                                         │
│  ┌────────────────────────────────────────────┐            │
│  │  Backup Region: EU-WEST                    │            │
│  │  • Standby PostgreSQL (Read Replica)       │            │
│  │  • Can be promoted to Primary              │            │
│  │  • Lag: < 1 second                         │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Recovery Time Objective (RTO): < 5 minutes                 │
│  Recovery Point Objective (RPO): < 30 seconds               │
│                                                              │
│  Failover Process:                                          │
│  1. Health check detects primary failure                    │
│  2. DNS automatically routes to backup region               │
│  3. Standby promoted to primary (automated)                 │
│  4. Applications reconnect automatically                    │
│  5. Alert sent to operations team                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Flow                       │
│                                                              │
│  1. User Login                                              │
│  ┌──────┐                                                   │
│  │ User │ ──► Enter credentials                             │
│  └───┬──┘                                                   │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────┐                                        │
│  │  Next.js App    │                                        │
│  │  (Login Page)   │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           │ 2. POST /auth/login                             │
│           ▼                                                  │
│  ┌─────────────────────────┐                               │
│  │  Supabase Auth API      │                               │
│  │                         │                               │
│  │ • Validate Credentials  │                               │
│  │ • Generate JWT          │                               │
│  │ • Create Session        │                               │
│  └──────────┬──────────────┘                               │
│             │                                                │
│             │ 3. Return JWT + Refresh Token                 │
│             ▼                                                │
│  ┌──────────────────────┐                                   │
│  │  Client Storage      │                                   │
│  │                      │                                   │
│  │ • Access Token (JWT) │                                   │
│  │ • Refresh Token      │                                   │
│  │ • Expires: 1 hour    │                                   │
│  └──────────────────────┘                                   │
│                                                              │
│  4. Subsequent Requests                                     │
│  ┌──────┐                                                   │
│  │ User │ ──► API Request + JWT in Header                  │
│  └───┬──┘                                                   │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────┐                                        │
│  │  Middleware     │                                        │
│  │                 │                                        │
│  │ • Verify JWT    │                                        │
│  │ • Check Expiry  │                                        │
│  │ • Validate User │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           ├─► Valid? ──► Continue to API/Page              │
│           └─► Invalid? ──► Redirect to Login               │
└─────────────────────────────────────────────────────────────┘
```

### Row-Level Security (RLS)

```
┌─────────────────────────────────────────────────────────────┐
│              Row-Level Security Architecture                 │
│                                                              │
│  Database Layer Security (PostgreSQL + RLS)                 │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Table: users                                  │        │
│  │                                                │        │
│  │  RLS Policy: "Users can only view own data"   │        │
│  │  ────────────────────────────────────────────  │        │
│  │  CREATE POLICY user_select_own                │        │
│  │    ON users FOR SELECT                         │        │
│  │    USING (auth.uid() = id);                    │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  ┌────────────────────────────────────────────────┐        │
│  │  Table: posts                                  │        │
│  │                                                │        │
│  │  RLS Policies:                                 │        │
│  │  ────────────────────────────────────────────  │        │
│  │  1. "Anyone can view published posts"          │        │
│  │     CREATE POLICY posts_select_published       │        │
│  │       ON posts FOR SELECT                      │        │
│  │       USING (status = 'published');            │        │
│  │                                                │        │
│  │  2. "Users can edit own posts"                 │        │
│  │     CREATE POLICY posts_update_own             │        │
│  │       ON posts FOR UPDATE                      │        │
│  │       USING (auth.uid() = author_id);          │        │
│  │                                                │        │
│  │  3. "Users can delete own posts"               │        │
│  │     CREATE POLICY posts_delete_own             │        │
│  │       ON posts FOR DELETE                      │        │
│  │       USING (auth.uid() = author_id);          │        │
│  └────────────────────────────────────────────────┘        │
│                                                              │
│  Security Flow:                                             │
│  ───────────────                                            │
│  1. User makes request with JWT                             │
│  2. JWT decoded → auth.uid() set in DB session             │
│  3. Query executed with RLS policies applied                │
│  4. Only authorized rows returned/modified                  │
└─────────────────────────────────────────────────────────────┘
```

### API Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
│                                                              │
│  Layer 1: Edge Protection (Vercel Edge)                     │
│  ┌────────────────────────────────────────────┐            │
│  │  • DDoS Protection                         │            │
│  │  • Rate Limiting (100 req/min/IP)          │            │
│  │  • Geo-blocking (if needed)                │            │
│  │  • Bot Detection                           │            │
│  └────────────────────────────────────────────┘            │
│                       │                                      │
│                       ▼                                      │
│  Layer 2: Application Security (Middleware)                 │
│  ┌────────────────────────────────────────────┐            │
│  │  • JWT Validation                          │            │
│  │  • CORS Policy Enforcement                 │            │
│  │  • CSRF Protection                         │            │
│  │  • Content Security Policy (CSP)           │            │
│  │  • Request Sanitization                    │            │
│  └────────────────────────────────────────────┘            │
│                       │                                      │
│                       ▼                                      │
│  Layer 3: Business Logic (API Routes)                       │
│  ┌────────────────────────────────────────────┐            │
│  │  • Input Validation (Zod schemas)          │            │
│  │  • Authorization Checks                    │            │
│  │  • Data Sanitization                       │            │
│  │  • Audit Logging                           │            │
│  └────────────────────────────────────────────┘            │
│                       │                                      │
│                       ▼                                      │
│  Layer 4: Data Access (Supabase)                           │
│  ┌────────────────────────────────────────────┐            │
│  │  • Row-Level Security (RLS)                │            │
│  │  • Encrypted at Rest                       │            │
│  │  • SSL/TLS in Transit                      │            │
│  │  • Database Audit Logs                     │            │
│  │  • Backup Encryption                       │            │
│  └────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  Horizontal Scaling Model                    │
│                                                              │
│  Frontend Scaling (Automatic via Vercel)                    │
│  ┌──────────────────────────────────────────────┐          │
│  │  Edge Functions: Auto-scale globally         │          │
│  │  • Serverless architecture                   │          │
│  │  • Pay-per-execution                         │          │
│  │  • No cold starts (warm pool)                │          │
│  │  • Scale to millions of requests             │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Backend Scaling                                            │
│  ┌──────────────────────────────────────────────┐          │
│  │  Supabase Edge Functions                     │          │
│  │  • Auto-scale per function                   │          │
│  │  • Deno runtime (fast startup)               │          │
│  │  • Concurrent execution                      │          │
│  │  • Global deployment                         │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Database Scaling (Supabase)                                │
│  ┌──────────────────────────────────────────────┐          │
│  │  Vertical Scaling:                           │          │
│  │  • Small: 2 vCPU, 4GB RAM                    │          │
│  │  • Medium: 4 vCPU, 8GB RAM                   │          │
│  │  • Large: 8 vCPU, 16GB RAM                   │          │
│  │  • XL: 16 vCPU, 32GB RAM                     │          │
│  │                                              │          │
│  │  Read Scaling:                               │          │
│  │  • Read replicas in multiple regions         │          │
│  │  • Connection pooling (PgBouncer)            │          │
│  │  • Query caching                             │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  Caching Strategy (Vercel KV)                               │
│  ┌──────────────────────────────────────────────┐          │
│  │  • Session data (15min TTL)                  │          │
│  │  • API responses (varies by endpoint)        │          │
│  │  • Static content (CDN cache)                │          │
│  │  • Database query results (5min TTL)         │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│               Performance Optimization Strategy              │
│                                                              │
│  1. Frontend Optimizations                                  │
│  ┌────────────────────────────────────────────┐            │
│  │  • Server Components (reduce JS bundle)    │            │
│  │  • Image Optimization (Next.js Image)      │            │
│  │  • Code Splitting (dynamic imports)        │            │
│  │  • Lazy Loading (below fold content)       │            │
│  │  • Font Optimization (next/font)           │            │
│  │  • Static Generation (where possible)      │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  2. API Optimizations                                       │
│  ┌────────────────────────────────────────────┐            │
│  │  • Response Caching (Vercel KV)            │            │
│  │  • GraphQL batching (if using)             │            │
│  │  • Compression (gzip/brotli)               │            │
│  │  • CDN for static assets                   │            │
│  │  • Edge functions for low latency          │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  3. Database Optimizations                                  │
│  ┌────────────────────────────────────────────┐            │
│  │  • Indexes on frequently queried columns   │            │
│  │  • Materialized views for complex queries  │            │
│  │  • Connection pooling (PgBouncer)          │            │
│  │  • Query optimization (EXPLAIN ANALYZE)    │            │
│  │  • Partitioning for large tables           │            │
│  │  • Archiving old data                      │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  4. Real-time Optimizations                                 │
│  ┌────────────────────────────────────────────┐            │
│  │  • Channel-based subscriptions             │            │
│  │  • Debounce updates (client-side)          │            │
│  │  • Efficient payload size                  │            │
│  │  • Unsubscribe on unmount                  │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Performance Targets                                        │
│  ────────────────────                                       │
│  • First Contentful Paint: < 1.5s                          │
│  • Time to Interactive: < 3s                               │
│  • API Response Time: < 200ms (p95)                        │
│  • Database Query Time: < 100ms (p95)                      │
│  • Core Web Vitals: Green across all metrics               │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Decision Rationale

### Why This Stack?

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | Next.js 14 | • Best-in-class React framework<br>• Server components for performance<br>• Built-in optimization<br>• Excellent DX |
| **Backend** | Supabase Edge Functions + Next.js API | • Serverless scalability<br>• Deno runtime (secure)<br>• TypeScript support<br>• Global deployment |
| **Database** | Supabase PostgreSQL | • Robust relational DB<br>• PostGIS for geospatial<br>• Built-in RLS<br>• Real-time capabilities |
| **Auth** | Supabase Auth | • JWT-based<br>• Multiple providers<br>• Row-level security integration<br>• Session management |
| **Storage** | Supabase Storage | • Integrated with auth<br>• CDN delivery<br>• Policy-based access<br>• Direct uploads |
| **Hosting** | Vercel | • Zero-config deployment<br>• Global edge network<br>• Automatic HTTPS<br>• Preview deployments |
| **Cache** | Vercel KV | • Global Redis<br>• Low latency<br>• Serverless pricing<br>• Simple API |

### Architecture Principles

1. **Serverless-First**: All compute resources scale automatically
2. **Security by Default**: RLS, JWT, HTTPS everywhere
3. **Performance Optimized**: Edge computing, caching, CDN
4. **Developer Experience**: Type-safe, hot reload, preview deployments
5. **Cost Efficient**: Pay-per-use, no idle resources
6. **Observable**: Built-in logging, metrics, tracing

---

## Monitoring & Observability

### Monitoring Stack

```
┌─────────────────────────────────────────────────────────────┐
│                   Monitoring Architecture                    │
│                                                              │
│  Application Monitoring                                     │
│  ┌────────────────────────────────────────────┐            │
│  │  Vercel Analytics                          │            │
│  │  • Core Web Vitals                         │            │
│  │  • Real User Monitoring (RUM)              │            │
│  │  • Performance insights                    │            │
│  │  • Error tracking                          │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Backend Monitoring                                         │
│  ┌────────────────────────────────────────────┐            │
│  │  Supabase Dashboard                        │            │
│  │  • Database performance                    │            │
│  │  • Query analytics                         │            │
│  │  • Connection pool stats                   │            │
│  │  • Storage metrics                         │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Error Tracking (Optional: Sentry)                         │
│  ┌────────────────────────────────────────────┐            │
│  │  • Client-side errors                      │            │
│  │  • Server-side errors                      │            │
│  │  • Performance monitoring                  │            │
│  │  • User session replay                     │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
│  Logging                                                    │
│  ┌────────────────────────────────────────────┐            │
│  │  • Vercel Logs (API routes)                │            │
│  │  • Supabase Logs (database, functions)     │            │
│  │  • Structured logging (JSON)               │            │
│  │  • Log retention (30 days)                 │            │
│  └────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    CI/CD Pipeline                            │
│                                                              │
│  1. Code Commit (Git Push)                                  │
│  ┌──────┐                                                   │
│  │  Git │ ──► Push to GitHub                                │
│  └───┬──┘                                                   │
│      │                                                       │
│      ▼                                                       │
│  ┌─────────────────┐                                        │
│  │  GitHub Actions │                                        │
│  │                 │                                        │
│  │ • Run Tests     │                                        │
│  │ • Lint Code     │                                        │
│  │ • Type Check    │                                        │
│  │ • Build         │                                        │
│  └────────┬────────┘                                        │
│           │                                                  │
│           │ Tests Pass?                                     │
│           ▼                                                  │
│  ┌─────────────────────┐                                   │
│  │  Vercel Deployment  │                                   │
│  │                     │                                   │
│  │ • Preview (PR)      │ ◄─── Pull Request                │
│  │ • Production (main) │ ◄─── Main Branch                 │
│  └─────────────────────┘                                   │
│           │                                                  │
│           │ Deploy Success?                                 │
│           ▼                                                  │
│  ┌──────────────────────────┐                              │
│  │  Post-Deploy Validation  │                              │
│  │                          │                              │
│  │ • Health Checks          │                              │
│  │ • Smoke Tests            │                              │
│  │ • Performance Tests      │                              │
│  └──────────────────────────┘                              │
│                                                              │
│  Database Migrations (Supabase)                             │
│  ┌────────────────────────────────┐                        │
│  │  • Run migrations automatically │                        │
│  │  • Rollback on failure          │                        │
│  │  • Audit trail                  │                        │
│  └────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Cost Optimization

### Pricing Tiers & Optimization

| Service | Free Tier | Production Cost | Optimization Strategy |
|---------|-----------|-----------------|----------------------|
| **Vercel** | 100GB bandwidth | ~$20/month Pro | • Use CDN for static assets<br>• Optimize images<br>• Edge caching |
| **Supabase** | 500MB database<br>1GB storage | ~$25/month Pro | • Archive old data<br>• Optimize queries<br>• Use read replicas |
| **Vercel KV** | 30,000 commands | ~$10/month | • Set appropriate TTLs<br>• Cache strategically<br>• Use stale-while-revalidate |

**Total Estimated Cost**: ~$55-100/month for production (depending on scale)

---

## Next Steps & Recommendations

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Supabase project
- [ ] Configure authentication
- [ ] Set up database schema with RLS
- [ ] Deploy basic Next.js app to Vercel
- [ ] Configure Vercel KV

### Phase 2: Core Features (Week 3-4)
- [ ] Implement main application features
- [ ] Set up real-time subscriptions
- [ ] Configure file storage
- [ ] Add caching layer
- [ ] Implement error tracking

### Phase 3: Optimization (Week 5-6)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Add monitoring
- [ ] Set up CI/CD pipeline
- [ ] Load testing

### Phase 4: Scale (Week 7+)
- [ ] Add read replicas
- [ ] Multi-region deployment
- [ ] Advanced caching strategies
- [ ] Cost optimization
- [ ] Disaster recovery testing

---

## Appendix

### Key Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Vercel KV (Redis)
KV_URL=[auto-provided-by-vercel]
KV_REST_API_URL=[auto-provided-by-vercel]
KV_REST_API_TOKEN=[auto-provided-by-vercel]

# Application
NEXT_PUBLIC_APP_URL=https://yourapp.com
NODE_ENV=production
```

### Database Schema Example

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy search

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### API Route Example

```typescript
// app/api/users/[id]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createRouteHandlerClient({ cookies });

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

---

**Document Version**: 1.0
**Author**: System Architect
**Stack**: Next.js 14 + Supabase + Vercel
**Last Review**: 2025-10-01
