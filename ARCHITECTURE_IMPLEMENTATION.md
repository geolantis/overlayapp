# Architecture Implementation Guide

## Project Structure Created

### Core Configuration Files
- `package.json` - Next.js 14 with all required dependencies (Supabase, Stripe, MapLibre, Radix UI)
- `tsconfig.json` - Strict TypeScript configuration with path aliases
- `tailwind.config.ts` - Complete design system with Shadcn/UI variables
- `next.config.js` - Optimized Next.js configuration with security headers
- `.env.example` - Comprehensive environment variables template
- `.eslintrc.json` - TypeScript ESLint configuration
- `.prettierrc` - Code formatting rules
- `postcss.config.js` - PostCSS with Tailwind and Autoprefixer

### Directory Structure

```
/Users/michael/Development/OverlayApp/
├── app/                              # Next.js 14 App Router
│   ├── (auth)/                       # Auth route group (no dashboard layout)
│   │   ├── login/                    # Login page
│   │   ├── signup/                   # Registration page
│   │   └── reset-password/           # Password reset
│   ├── (dashboard)/                  # Protected routes with dashboard layout
│   │   ├── dashboard/                # Main dashboard
│   │   ├── overlays/                 # PDF overlay management
│   │   ├── map/                      # Map viewer
│   │   ├── organization/             # Organization settings
│   │   │   ├── members/              # Team management
│   │   │   └── billing/              # Subscription & billing
│   │   ├── profile/                  # User profile
│   │   └── settings/                 # User settings
│   ├── api/                          # API routes
│   │   ├── auth/callback/            # Supabase auth callback
│   │   ├── webhooks/stripe/          # Stripe webhooks
│   │   ├── tiles/                    # Map tile server
│   │   └── overlays/                 # Overlay processing endpoints
│   ├── actions/                      # Server Actions
│   ├── layout.tsx                    # Root layout (to be created)
│   ├── page.tsx                      # Landing page (to be created)
│   └── globals.css                   # Global styles (to be created)
│
├── components/                       # React components
│   ├── ui/                          # Shadcn/UI components
│   ├── map/                         # Map-related components
│   ├── pdf/                         # PDF handling components
│   ├── dashboard/                   # Dashboard components
│   └── providers/                   # Context providers
│
├── lib/                             # Utility libraries
│   ├── supabase/                    # Supabase clients
│   │   ├── client.ts                # Browser client (to be created)
│   │   ├── server.ts                # Server client (to be created)
│   │   └── middleware.ts            # Auth middleware (to be created)
│   ├── stripe/                      # Stripe integration
│   ├── db/                          # Database queries
│   └── utils/                       # Utility functions
│
├── types/                           # TypeScript type definitions
├── styles/                          # Additional styles
├── public/                          # Static assets
│   ├── images/
│   └── fonts/
│
├── supabase/                        # Supabase configuration
│   ├── migrations/                  # Database migrations
│   └── functions/                   # Edge Functions
│
└── docs/                            # Documentation
    └── ARCHITECTURE_SUPABASE.md     # System architecture

```

## Next Steps for Implementation

### Phase 1: Core Setup (Priority: HIGH)

1. **Create Root Layout and Pages**
   ```bash
   app/layout.tsx              # Root layout with providers
   app/page.tsx                # Landing page
   app/globals.css             # Global styles with Tailwind
   app/middleware.ts           # Auth middleware
   ```

2. **Setup Supabase Clients**
   ```bash
   lib/supabase/client.ts      # Browser client
   lib/supabase/server.ts      # Server client
   lib/supabase/middleware.ts  # Middleware helper
   ```

3. **Create Core UI Components**
   ```bash
   components/ui/button.tsx    # Button component
   components/ui/input.tsx     # Input component
   components/ui/card.tsx      # Card component
   # ... other Shadcn/UI components as needed
   ```

4. **Setup Authentication Pages**
   ```bash
   app/(auth)/login/page.tsx
   app/(auth)/signup/page.tsx
   app/(auth)/reset-password/page.tsx
   app/(auth)/layout.tsx
   ```

### Phase 2: Dashboard Implementation

5. **Create Dashboard Layout**
   ```bash
   app/(dashboard)/layout.tsx           # Dashboard layout with nav/sidebar
   components/dashboard/Navbar.tsx      # Top navigation
   components/dashboard/Sidebar.tsx     # Side navigation
   ```

6. **Implement Dashboard Pages**
   ```bash
   app/(dashboard)/dashboard/page.tsx   # Main dashboard
   components/dashboard/StatsCards.tsx  # Statistics cards
   ```

### Phase 3: PDF & Map Features

7. **PDF Management**
   ```bash
   app/(dashboard)/overlays/page.tsx
   components/pdf/PdfUploader.tsx
   components/pdf/GeoreferencingTool.tsx
   ```

8. **Map Viewer**
   ```bash
   app/(dashboard)/map/page.tsx
   components/map/MapViewer.tsx
   components/map/LayerPanel.tsx
   ```

### Phase 4: API Implementation

9. **Server Actions**
   ```bash
   app/actions/overlays.ts              # Overlay CRUD
   app/actions/organizations.ts         # Organization management
   app/actions/billing.ts               # Subscription actions
   app/actions/auth.ts                  # Auth actions
   ```

10. **API Routes**
    ```bash
    app/api/auth/callback/route.ts      # Auth callback
    app/api/webhooks/stripe/route.ts    # Stripe webhooks
    app/api/tiles/[...params]/route.ts  # Tile server
    ```

### Phase 5: Stripe Integration

11. **Billing & Subscriptions**
    ```bash
    lib/stripe/client.ts                # Stripe client
    lib/stripe/webhooks.ts              # Webhook handlers
    app/(dashboard)/organization/billing/page.tsx
    ```

## Architectural Decisions Stored

### Technology Stack
- **Framework**: Next.js 14 with App Router
- **Backend**: Supabase (PostgreSQL + PostGIS, Auth, Storage, Realtime)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/UI (Radix UI + Tailwind)
- **Maps**: MapLibre GL JS
- **Payments**: Stripe
- **Hosting**: Vercel
- **Cache**: Vercel KV (Redis)

### Design Patterns
- **Server Components**: Default for data fetching and static content
- **Client Components**: Only for interactive elements and real-time features
- **Server Actions**: For mutations and form submissions
- **Route Groups**: Separate layouts for auth and dashboard
- **API Routes**: Edge runtime for performance-critical endpoints
- **Middleware**: Edge middleware for authentication

### Security Architecture
- **Row Level Security (RLS)**: All database tables protected
- **JWT Authentication**: Supabase Auth with automatic token refresh
- **HTTPS Only**: Strict transport security headers
- **CORS**: Controlled cross-origin access
- **CSP**: Content Security Policy headers
- **Rate Limiting**: API route protection

### Performance Optimizations
- **Edge Runtime**: API routes run on Vercel Edge Network
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Code Splitting**: Automatic with Next.js App Router
- **Static Generation**: Where possible for SEO
- **Caching Strategy**: Vercel KV for session and API responses
- **Database Indexing**: PostGIS spatial indexes

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start Supabase locally (optional)
npm run supabase:start

# Start development server
npm run dev
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Building
```bash
npm run build
```

## Environment Setup Required

1. **Supabase Project**
   - Create project at https://app.supabase.com
   - Run database migrations
   - Configure RLS policies
   - Set up Storage buckets

2. **Stripe Account**
   - Create account at https://dashboard.stripe.com
   - Create products and prices
   - Configure webhook endpoint

3. **Vercel Deployment**
   - Connect GitHub repository
   - Add environment variables
   - Enable Vercel KV (Redis)

## Database Schema

The database schema is defined in:
- `/database/migrations/` - SQL migration files
- All tables use Row Level Security (RLS)
- PostGIS extension enabled for spatial data

Key tables:
- `organizations` - Multi-tenant organizations
- `user_profiles` - Extended user data
- `organization_members` - Team membership
- `pdf_overlays` - PDF overlay metadata
- `map_tiles` - Cached map tiles
- `subscriptions` - Stripe subscription data
- `usage_events` - Usage tracking

## API Endpoints

### Authentication
- `POST /api/auth/callback` - OAuth callback handler

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook events

### Tiles
- `GET /api/tiles/:overlayId/:z/:x/:y` - Map tile server

### Overlays
- `POST /api/overlays/upload` - Upload PDF
- `POST /api/overlays/:id/process` - Trigger processing

## Real-time Features

Using Supabase Realtime for:
- Live overlay processing status
- Collaborative editing presence
- Organization updates
- Team member activity

## Testing Strategy

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API route testing
- **E2E Tests**: Critical user flows
- **Performance Tests**: Load testing for tile server

## Deployment Strategy

### Vercel Configuration
```json
{
  "regions": ["iad1", "fra1", "syd1"],
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

### Multi-Region Supabase
- US: Primary database
- EU: Read replica
- AU: Read replica

## Monitoring & Observability

- **Vercel Analytics**: Core Web Vitals and RUM
- **Supabase Dashboard**: Database performance
- **Stripe Dashboard**: Payment metrics
- **Error Tracking**: Optional Sentry integration

## Cost Estimation

### Development (First Month)
- Supabase: Free tier
- Vercel: Free tier
- Stripe: No monthly fee

### Production (Estimated)
- Supabase Pro: $25/month
- Vercel Pro: $20/month
- Vercel KV: $10/month
- Stripe: Transaction fees only
- **Total: ~$55/month** (excluding transaction fees)

## Security Checklist

- [ ] Environment variables secured
- [ ] RLS policies enabled on all tables
- [ ] API routes require authentication
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Supabase client)
- [ ] XSS protection (React's built-in escaping)
- [ ] CSRF protection (Next.js middleware)

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **API Response**: < 200ms (p95)
- **Database Query**: < 100ms (p95)
- **Tile Loading**: < 500ms

---

**Status**: Architecture implementation in progress
**Last Updated**: 2025-10-01
**Next Action**: Create root layout and Supabase clients
