# Update Supabase Site URL

## ⚠️ IMPORTANT: Fix Localhost Email Links

Your confirmation emails are pointing to `localhost:3000` because the Supabase project's Site URL needs to be updated.

## Quick Fix (2 minutes):

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/fjjoguapljqrngqvtdvj/auth/url-configuration

2. Update **Site URL** to:
   ```
   https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app
   ```

3. Add to **Redirect URLs** (comma-separated):
   ```
   https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app/**
   https://overlayapp-payment-*.vercel.app/**
   http://localhost:3000/**
   ```

4. Click **Save**

5. Test: Sign up with a new email → Links will now point to production! ✅

---

### Option 2: Via Supabase CLI

```bash
# Set the site URL
npx supabase --project-ref fjjoguapljqrngqvtdvj \
  config set auth.site_url="https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app"

# Add redirect URLs
npx supabase --project-ref fjjoguapljqrngqvtdvj \
  config set auth.additional_redirect_urls='["https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app/**","http://localhost:3000/**"]'
```

---

## Why This Happens

Supabase uses the **Site URL** setting to generate all email links:
- Confirmation links
- Password reset links
- Magic links
- OAuth redirects

When it's set to `localhost:3000`, all emails point there. After updating to your production URL, new emails will have correct links.

---

## Verify It's Working

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Check the **Site URL** field shows your production URL
3. Sign up with a test email
4. Check the confirmation link → Should point to production! ✅

---

## Next Steps After Updating

Once the Site URL is correct:

1. ✅ Test email confirmation flow
2. ✅ Update email templates (for branding)
3. ✅ Test password reset flow
4. ✅ Configure custom domain (optional)

---

**Current Production URL:**
`https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app`

**When you get a custom domain**, update the Site URL again to your custom domain.
