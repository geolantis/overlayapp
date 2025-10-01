# Supabase Multi-Region Setup Guide

Complete guide for setting up Supabase with US, EU, and AU regions for the OverlayApp payment system.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Database Migrations](#database-migrations)
4. [Row Level Security Configuration](#row-level-security-configuration)
5. [Storage Buckets Setup](#storage-buckets-setup)
6. [Edge Functions Deployment](#edge-functions-deployment)
7. [Environment Configuration](#environment-configuration)
8. [Multi-Region Configuration](#multi-region-configuration)
9. [Testing Procedures](#testing-procedures)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Install Supabase CLI
npm install -g supabase

# Verify installation
supabase --version

# Install dependencies
npm install @supabase/supabase-js
```

### Required Accounts

- Supabase account (https://supabase.com)
- Vercel account (for deployment)
- Stripe account (for payments)

---

## Project Setup

### Step 1: Create Supabase Projects

Create three separate Supabase projects for different regions:

#### 1. US Region Project

```bash
# Login to Supabase CLI
supabase login

# Link to US project
supabase link --project-ref YOUR_US_PROJECT_REF
```

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Configure:
   - **Name**: overlayapp-us
   - **Database Password**: (generate secure password)
   - **Region**: US East (North Virginia)
   - **Pricing Plan**: Select based on needs
4. Click "Create new project"
5. Save the following credentials:
   - Project URL
   - Project API Key (anon, public)
   - Project API Key (service_role, secret)
   - Database Password

#### 2. EU Region Project

Repeat the same process:

1. Click "New Project"
2. Configure:
   - **Name**: overlayapp-eu
   - **Database Password**: (generate secure password)
   - **Region**: Europe West (Ireland)
   - **Pricing Plan**: Select based on needs
3. Save credentials

#### 3. AU Region Project

Repeat the same process:

1. Click "New Project"
2. Configure:
   - **Name**: overlayapp-au
   - **Database Password**: (generate secure password)
   - **Region**: Asia Pacific (Sydney)
   - **Pricing Plan**: Select based on needs
3. Save credentials

### Step 2: Initialize Supabase Locally

```bash
# Initialize Supabase in your project
cd /Users/michael/Development/OverlayApp
supabase init

# This creates:
# - supabase/ directory
# - supabase/config.toml
# - supabase/seed.sql
# - supabase/migrations/ directory
```

### Step 3: Configure Local Development

```bash
# Start local Supabase (for development/testing)
supabase start

# This will start:
# - PostgreSQL database
# - API Gateway
# - Auth server
# - Storage server
# - Realtime server

# Get local connection details
supabase status
```

---

## Database Migrations

### Migration Files Structure

```
supabase/
├── migrations/
│   ├── 001_security_schema.sql
│   ├── 002_payment_schema.sql
│   ├── 003_subscription_schema.sql
│   └── 004_analytics_schema.sql
└── seed.sql
```

### Step 1: Copy Existing Migration

The security schema is already created at `/Users/michael/Development/OverlayApp/supabase/migrations/001_security_schema.sql`

### Step 2: Create Additional Migrations

Create payment schema migration:

```bash
supabase migration new payment_schema
```

This creates a new file: `supabase/migrations/TIMESTAMP_payment_schema.sql`

### Step 3: Run Migrations Locally

```bash
# Apply migrations to local database
supabase db reset

# This will:
# 1. Drop the database
# 2. Recreate it
# 3. Apply all migrations
# 4. Run seed.sql
```

### Step 4: Deploy Migrations to Production

#### US Region

```bash
# Link to US project
supabase link --project-ref YOUR_US_PROJECT_REF

# Push migrations
supabase db push

# Verify migration status
supabase migration list
```

#### EU Region

```bash
# Link to EU project
supabase link --project-ref YOUR_EU_PROJECT_REF

# Push migrations
supabase db push

# Verify
supabase migration list
```

#### AU Region

```bash
# Link to AU project
supabase link --project-ref YOUR_AU_PROJECT_REF

# Push migrations
supabase db push

# Verify
supabase migration list
```

### Step 5: Verify Migrations

Connect to each database and verify:

```sql
-- Check tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## Row Level Security Configuration

### Understanding RLS Policies

RLS policies are already defined in `001_security_schema.sql`. Here's how they work:

#### 1. Organization Isolation

```sql
-- Users can only access their organization's data
CREATE POLICY organization_isolation ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

#### 2. Document Security

```sql
-- Multi-layered document access
CREATE POLICY document_isolation ON documents
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );
```

### Testing RLS Policies

#### Create Test Script

Create `supabase/tests/test_rls.sql`:

```sql
-- Test RLS policies
-- Run as authenticated user

BEGIN;

-- Set user context
SELECT set_config('request.jwt.claims',
  '{"sub":"test-user-uuid","role":"authenticated"}',
  true);

-- Test 1: User can only see their organization
SELECT COUNT(*) FROM organizations;
-- Should only return organizations user belongs to

-- Test 2: User can't access other org's documents
SELECT COUNT(*) FROM documents
WHERE organization_id = 'other-org-uuid';
-- Should return 0

-- Test 3: User can access shared documents
SELECT COUNT(*) FROM documents d
JOIN document_shares ds ON d.id = ds.document_id
WHERE ds.shared_with_user_id = 'test-user-uuid';
-- Should return shared documents

ROLLBACK;
```

#### Run Tests

```bash
# Run locally
supabase db test

# Or connect and run manually
psql postgresql://postgres:password@localhost:54322/postgres \
  -f supabase/tests/test_rls.sql
```

### Enable RLS on All Tables

Verify RLS is enabled on all tables:

```bash
# Create verification script
cat > check_rls.sql << 'EOF'
SELECT
  schemaname,
  tablename,
  rowsecurity,
  CASE WHEN rowsecurity THEN '✓' ELSE '✗ MISSING' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
EOF

# Run on each project
supabase db execute --file check_rls.sql
```

### Adding Custom Policies

To add custom policies for your use case:

```sql
-- Example: Allow users to update their own profile
CREATE POLICY user_update_own_profile ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Example: Managers can view team documents
CREATE POLICY manager_view_team_docs ON documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
        AND organization_id = documents.organization_id
        AND role IN ('ORG_MANAGER', 'ORG_ADMIN')
    )
  );
```

Apply custom policies:

```bash
supabase migration new custom_policies
# Edit the file and add your policies
supabase db push
```

---

## Storage Buckets Setup

### Step 1: Create Storage Buckets

For each region (US, EU, AU), create the following buckets:

#### Via Supabase Dashboard

1. Go to Storage section
2. Create buckets:

**Documents Bucket**
- Name: `documents`
- Public: No
- File size limit: 50 MB
- Allowed MIME types: `application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.*`

**Avatars Bucket**
- Name: `avatars`
- Public: Yes
- File size limit: 2 MB
- Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

**Exports Bucket**
- Name: `exports`
- Public: No
- File size limit: 100 MB
- Allowed MIME types: `application/json, text/csv, application/zip`

#### Via SQL (Alternative)

```sql
-- Create documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create exports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  104857600, -- 100 MB
  ARRAY['application/json', 'text/csv', 'application/zip']
);
```

### Step 2: Configure Storage Policies

Create storage RLS policies for each bucket:

```sql
-- Documents bucket policies
-- Allow users to read documents from their organization
CREATE POLICY "Users can read own org documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Allow users to upload documents to their organization folder
CREATE POLICY "Users can upload org documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents' AND
  owner = auth.uid()
);

-- Avatars bucket policies
-- Anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Exports bucket policies
-- Users can read their own exports
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' AND
  owner = auth.uid()
);

-- System can create exports
CREATE POLICY "System can create exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);
```

### Step 3: Test Storage

Create test script:

```javascript
// test-storage.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testStorage() {
  // Test 1: Upload avatar
  const avatarFile = new File(['test'], 'test-avatar.png', { type: 'image/png' });
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/avatar.png`, avatarFile);

  console.log('Avatar upload:', uploadData ? '✓' : '✗', uploadError);

  // Test 2: Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(`${userId}/avatar.png`);

  console.log('Public URL:', urlData.publicUrl);

  // Test 3: Upload document
  const docFile = new File(['test doc'], 'test.pdf', { type: 'application/pdf' });
  const { data: docData, error: docError } = await supabase.storage
    .from('documents')
    .upload(`${orgId}/test.pdf`, docFile);

  console.log('Document upload:', docData ? '✓' : '✗', docError);

  // Test 4: List files
  const { data: listData, error: listError } = await supabase.storage
    .from('documents')
    .list(orgId);

  console.log('List files:', listData?.length || 0, 'files');
}

testStorage();
```

Run tests:

```bash
node test-storage.js
```

---

## Edge Functions Deployment

### Step 1: Create Edge Functions

```bash
# Create functions directory structure
supabase functions new stripe-webhook
supabase functions new subscription-sync
supabase functions new analytics-export
```

This creates:
```
supabase/
└── functions/
    ├── stripe-webhook/
    │   └── index.ts
    ├── subscription-sync/
    │   └── index.ts
    └── analytics-export/
        └── index.ts
```

### Step 2: Implement Edge Functions

#### Stripe Webhook Handler

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

async function handleSubscriptionChange(subscription: any) {
  // Update subscription in database
  // Implementation details...
}

async function handleSubscriptionDeleted(subscription: any) {
  // Mark subscription as cancelled
  // Implementation details...
}

async function handlePaymentSucceeded(invoice: any) {
  // Record successful payment
  // Implementation details...
}

async function handlePaymentFailed(invoice: any) {
  // Handle failed payment
  // Implementation details...
}
```

### Step 3: Deploy Edge Functions

#### Deploy to US Region

```bash
# Link to US project
supabase link --project-ref YOUR_US_PROJECT_REF

# Deploy all functions
supabase functions deploy stripe-webhook
supabase functions deploy subscription-sync
supabase functions deploy analytics-export

# Or deploy all at once
supabase functions deploy
```

#### Deploy to EU Region

```bash
# Link to EU project
supabase link --project-ref YOUR_EU_PROJECT_REF

# Deploy functions
supabase functions deploy
```

#### Deploy to AU Region

```bash
# Link to AU project
supabase link --project-ref YOUR_AU_PROJECT_REF

# Deploy functions
supabase functions deploy
```

### Step 4: Set Function Secrets

Each region needs its own secrets:

```bash
# Set secrets for US region
supabase secrets set --project-ref YOUR_US_PROJECT_REF \
  STRIPE_SECRET_KEY=sk_live_us_... \
  STRIPE_WEBHOOK_SECRET=whsec_us_... \
  DATABASE_URL=postgresql://...

# Set secrets for EU region
supabase secrets set --project-ref YOUR_EU_PROJECT_REF \
  STRIPE_SECRET_KEY=sk_live_eu_... \
  STRIPE_WEBHOOK_SECRET=whsec_eu_... \
  DATABASE_URL=postgresql://...

# Set secrets for AU region
supabase secrets set --project-ref YOUR_AU_PROJECT_REF \
  STRIPE_SECRET_KEY=sk_live_au_... \
  STRIPE_WEBHOOK_SECRET=whsec_au_... \
  DATABASE_URL=postgresql://...
```

### Step 5: Get Function URLs

```bash
# List all functions and their URLs
supabase functions list

# Example output:
# stripe-webhook: https://your-project.functions.supabase.co/stripe-webhook
# subscription-sync: https://your-project.functions.supabase.co/subscription-sync
```

---

## Environment Configuration

### Step 1: Create Environment Files

Create separate environment files for each environment:

#### Development (.env.local)

```bash
# Local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-key

# Stripe Test Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# Region
NEXT_PUBLIC_REGION=local
```

#### Production US (.env.production.us)

```bash
# US Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-us-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-us-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-us-service-key

# Stripe Live Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Region
NEXT_PUBLIC_REGION=us
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://your-us-project.functions.supabase.co
```

#### Production EU (.env.production.eu)

```bash
# EU Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-eu-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-eu-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-eu-service-key

# Stripe Live Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Region
NEXT_PUBLIC_REGION=eu
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://your-eu-project.functions.supabase.co
```

#### Production AU (.env.production.au)

```bash
# AU Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-au-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-au-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-au-service-key

# Stripe Live Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Region
NEXT_PUBLIC_REGION=au
NEXT_PUBLIC_EDGE_FUNCTION_URL=https://your-au-project.functions.supabase.co
```

### Step 2: Configure Vercel Environment Variables

#### Via Vercel Dashboard

1. Go to Project Settings > Environment Variables
2. Add variables for each environment:

**Production US:**
- Environment: Production
- Branch: main-us (or specify)
- Add all US environment variables

**Production EU:**
- Environment: Production
- Branch: main-eu (or specify)
- Add all EU environment variables

**Production AU:**
- Environment: Production
- Branch: main-au (or specify)
- Add all AU environment variables

#### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set US environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value: https://your-us-project.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Enter value: your-us-anon-key

# Repeat for all variables...

# Or use a script
cat .env.production.us | while read line; do
  if [[ $line =~ ^[A-Z] ]]; then
    key=$(echo $line | cut -d= -f1)
    value=$(echo $line | cut -d= -f2-)
    echo "Setting $key"
    echo $value | vercel env add $key production
  fi
done
```

### Step 3: Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Get environment-specific configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-region': process.env.NEXT_PUBLIC_REGION || 'us',
    },
  },
});

// Server-side client with service role
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Type-safe database types
export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          tier: 'standard' | 'enterprise' | 'regulated';
          status: 'active' | 'suspended' | 'cancelled';
          // ... other fields
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      // ... other tables
    };
  };
};
```

---

## Multi-Region Configuration

### Regional Routing Strategy

#### Option 1: DNS-Based Routing

Use Vercel's edge network with regional URLs:

```
us.overlayapp.com → US Supabase
eu.overlayapp.com → EU Supabase
au.overlayapp.com → AU Supabase
```

Configure in `vercel.json`:

```json
{
  "regions": ["iad1", "dub1", "syd1"],
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "headers": {
        "X-Region": "us"
      },
      "continue": true
    }
  ]
}
```

#### Option 2: User-Based Region Selection

Store user's region in profile:

```typescript
// lib/region-router.ts
export async function getRegionConfig(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('preferred_region')
    .eq('id', userId)
    .single();

  const region = user?.preferred_region || 'us';

  const configs = {
    us: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_US,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_US,
    },
    eu: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_EU,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_EU,
    },
    au: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL_AU,
      key: process.env.NEXT_PUBLIC_SUPABASE_KEY_AU,
    },
  };

  return configs[region];
}

export function createRegionalClient(config: RegionConfig) {
  return createClient(config.url, config.key);
}
```

### Data Residency Compliance

Ensure data stays in the correct region:

```sql
-- Add region check trigger
CREATE OR REPLACE FUNCTION check_data_residency()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure organization's region matches database region
  IF NEW.data_region != current_setting('app.region', true) THEN
    RAISE EXCEPTION 'Data residency violation: org region % does not match db region %',
      NEW.data_region,
      current_setting('app.region', true);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_data_residency
  BEFORE INSERT OR UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION check_data_residency();
```

---

## Testing Procedures

### 1. Database Connection Test

```bash
# Create test script
cat > test-connection.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { data, error } = await supabase
    .from('organizations')
    .select('count')
    .limit(1);

  if (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Connection successful');
}

testConnection();
EOF

# Test each region
SUPABASE_URL=https://us.supabase.co SUPABASE_KEY=us-key node test-connection.js
SUPABASE_URL=https://eu.supabase.co SUPABASE_KEY=eu-key node test-connection.js
SUPABASE_URL=https://au.supabase.co SUPABASE_KEY=au-key node test-connection.js
```

### 2. Authentication Test

```javascript
// test-auth.js
import { createClient } from '@supabase/supabase-js';

async function testAuth() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  // Test signup
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'test-password-123',
  });

  console.log('Sign up:', signUpData ? '✅' : '❌', signUpError?.message);

  // Test login
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test-password-123',
  });

  console.log('Sign in:', signInData ? '✅' : '❌', signInError?.message);

  // Test session
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('Session:', sessionData.session ? '✅' : '❌');

  // Test logout
  const { error: signOutError } = await supabase.auth.signOut();
  console.log('Sign out:', !signOutError ? '✅' : '❌');
}

testAuth();
```

### 3. RLS Policy Test

```javascript
// test-rls.js
async function testRLS() {
  const supabase = createClient(url, key);

  // Login as user 1
  await supabase.auth.signInWithPassword({
    email: 'user1@example.com',
    password: 'password',
  });

  // Create organization
  const { data: org } = await supabase
    .from('organizations')
    .insert({ name: 'Test Org', slug: 'test-org' })
    .select()
    .single();

  console.log('Created org:', org ? '✅' : '❌');

  // Try to access as user 2
  await supabase.auth.signInWithPassword({
    email: 'user2@example.com',
    password: 'password',
  });

  const { data: orgAccess } = await supabase
    .from('organizations')
    .select()
    .eq('id', org.id);

  console.log('RLS isolation:', orgAccess.length === 0 ? '✅' : '❌ FAILED');
}

testRLS();
```

### 4. Storage Test

```javascript
// test-storage.js
async function testStorage() {
  const supabase = createClient(url, key);
  await supabase.auth.signInWithPassword({ email, password });

  // Upload test
  const file = new File(['test content'], 'test.txt');
  const { data: upload, error: uploadError } = await supabase.storage
    .from('documents')
    .upload(`${orgId}/test.txt`, file);

  console.log('Upload:', upload ? '✅' : '❌', uploadError?.message);

  // Download test
  const { data: download, error: downloadError } = await supabase.storage
    .from('documents')
    .download(`${orgId}/test.txt`);

  console.log('Download:', download ? '✅' : '❌', downloadError?.message);

  // Delete test
  const { error: deleteError } = await supabase.storage
    .from('documents')
    .remove([`${orgId}/test.txt`]);

  console.log('Delete:', !deleteError ? '✅' : '❌', deleteError?.message);
}

testStorage();
```

### 5. Edge Function Test

```bash
# Test locally
supabase functions serve stripe-webhook

# In another terminal
curl -i --location --request POST 'http://localhost:54321/functions/v1/stripe-webhook' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'

# Test production
curl -i --location --request POST \
  'https://your-project.functions.supabase.co/stripe-webhook' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"test": true}'
```

### 6. Performance Test

```javascript
// test-performance.js
async function testPerformance() {
  const start = Date.now();

  // Test query performance
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .limit(100);

  const duration = Date.now() - start;

  console.log(`Query completed in ${duration}ms`);
  console.log(duration < 1000 ? '✅ Fast' : '⚠️ Slow');
}

testPerformance();
```

---

## Troubleshooting

### Common Issues

#### 1. Migration Failed

**Problem:** Migration fails with permission error

**Solution:**
```bash
# Check current role
supabase db execute "SELECT current_user, current_database();"

# Reset database and reapply
supabase db reset

# Or apply specific migration
supabase db execute --file supabase/migrations/001_security_schema.sql
```

#### 2. RLS Policy Blocking Access

**Problem:** User can't access their own data

**Solution:**
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'your_table';

-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy as user
SELECT * FROM your_table
WHERE auth.uid() = 'test-user-id';

-- Temporarily disable RLS for testing (NOT in production!)
ALTER TABLE your_table DISABLE ROW LEVEL SECURITY;
```

#### 3. Storage Upload Fails

**Problem:** File upload returns 403 or 404

**Solution:**
```javascript
// Check bucket exists
const { data: buckets } = await supabase.storage.listBuckets();
console.log('Buckets:', buckets);

// Check policy
const { data: policies } = await supabase
  .rpc('get_storage_policies', { bucket_name: 'documents' });

// Verify file path structure
// Correct: orgId/filename.pdf
// Wrong: /orgId/filename.pdf (no leading slash)
```

#### 4. Edge Function Not Found

**Problem:** Function returns 404

**Solution:**
```bash
# Verify deployment
supabase functions list

# Check logs
supabase functions logs stripe-webhook

# Redeploy
supabase functions deploy stripe-webhook --no-verify-jwt
```

#### 5. Auth Session Expired

**Problem:** User sessions expire too quickly

**Solution:**
```typescript
// Configure session refresh
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Manual refresh
const { data, error } = await supabase.auth.refreshSession();
```

#### 6. Connection Timeout

**Problem:** Database connections time out

**Solution:**
```bash
# Check connection pooling settings
supabase db execute "SHOW max_connections;"
supabase db execute "SELECT count(*) FROM pg_stat_activity;"

# Increase timeout in client
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    fetch: (url, init) => {
      return fetch(url, {
        ...init,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });
    },
  },
});
```

#### 7. CORS Errors

**Problem:** CORS errors in browser

**Solution:**
```bash
# Check allowed origins in Supabase dashboard:
# Settings > API > CORS

# Add your domains:
# - http://localhost:3000 (development)
# - https://your-domain.com (production)
# - https://your-domain.vercel.app (Vercel)
```

#### 8. Environment Variable Not Found

**Problem:** `process.env.VARIABLE` is undefined

**Solution:**
```bash
# Verify variables are set
vercel env ls

# Pull latest environment variables
vercel env pull .env.local

# For Next.js, prefix public variables with NEXT_PUBLIC_
# ✅ NEXT_PUBLIC_SUPABASE_URL
# ❌ SUPABASE_URL (won't be available in browser)
```

### Debug Mode

Enable debug logging:

```typescript
const supabase = createClient(url, key, {
  auth: {
    debug: true, // Enable auth debug logs
  },
});

// Or set environment variable
process.env.SUPABASE_DEBUG = 'true';
```

### Health Check Endpoint

Create health check:

```typescript
// pages/api/health.ts
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  try {
    // Check database
    const { error: dbError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);

    // Check auth
    const { data: authData, error: authError } = await supabase.auth.getSession();

    // Check storage
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: !dbError ? 'ok' : 'error',
        auth: !authError ? 'ok' : 'error',
        storage: !storageError ? 'ok' : 'error',
      },
      region: process.env.NEXT_PUBLIC_REGION,
    };

    const isHealthy = Object.values(health.checks).every(v => v === 'ok');

    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
}
```

### Support Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
- Status Page: https://status.supabase.com

---

## Next Steps

1. Complete all three regional setups (US, EU, AU)
2. Run all test suites for each region
3. Configure Vercel deployments
4. Set up monitoring and alerting
5. Create backup and disaster recovery procedures
6. Document region-specific configurations
7. Train team on multi-region architecture

---

## Security Checklist

- [ ] All RLS policies enabled on all tables
- [ ] Storage buckets have proper access policies
- [ ] Service role keys stored securely (never in client code)
- [ ] API rate limiting configured
- [ ] Webhook signatures validated
- [ ] CORS configured for production domains only
- [ ] Database backups enabled
- [ ] Audit logging active
- [ ] MFA enforced for admin accounts
- [ ] Secrets rotation schedule established

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor error rates in Supabase dashboard
- Check Edge Function logs
- Review security events

**Weekly:**
- Review audit logs
- Check storage usage
- Verify backup status

**Monthly:**
- Rotate API keys
- Review and update RLS policies
- Performance optimization
- Security audit

**Quarterly:**
- Disaster recovery test
- Update dependencies
- Review regional data distribution
- Compliance audit
