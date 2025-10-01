# Email Configuration Guide

This guide explains how to configure email templates and settings for Supabase authentication in OverlayApp.

## Table of Contents

- [Overview](#overview)
- [Configuration Files](#configuration-files)
- [Supabase Dashboard Setup](#supabase-dashboard-setup)
- [Email Template Variables](#email-template-variables)
- [Custom Email Templates](#custom-email-templates)
- [Testing Email Flow](#testing-email-flow)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## Overview

OverlayApp uses Supabase Authentication for user management, which includes email-based flows:

- **Email Confirmation**: Sent when users sign up
- **Password Recovery**: Sent when users request password reset
- **Email Change**: Sent when users change their email address
- **Magic Link**: Sent for passwordless authentication (if enabled)

## Configuration Files

### 1. Local Development (`supabase/config.toml`)

```toml
[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = [
  "https://overlayapp.vercel.app",
  "https://*.overlayapp.vercel.app",
  "http://localhost:3000"
]

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = true
secure_password_change = true
max_frequency = "1h"
```

**Key Settings:**

- `site_url`: The primary URL users will be redirected to after email actions
- `additional_redirect_urls`: All allowed redirect URLs (including preview deployments)
- `enable_confirmations`: Require email confirmation for new signups
- `double_confirm_changes`: Send confirmation to both old and new email when changing
- `max_frequency`: Rate limit for email sending (prevents spam)

### 2. Environment Variables (`.env.local`)

```bash
# Production URL for email links
NEXT_PUBLIC_PRODUCTION_URL=https://overlayapp.vercel.app

# Optional: Custom SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_FROM=noreply@overlayapp.com
SMTP_FROM_NAME=OverlayApp
```

**Notes:**

- If SMTP variables are not set, Supabase uses its default email service
- For Gmail: Use App-Specific Passwords, not your regular password
- For production: Use a professional email service (SendGrid, Postmark, etc.)

## Supabase Dashboard Setup

### Step 1: Access Email Templates

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`fjjoguapljqrngqvtdvj`)
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Configure URL Settings

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://overlayapp.vercel.app` (your production URL)
3. Add **Redirect URLs**:
   - `https://overlayapp.vercel.app/**`
   - `https://*.overlayapp.vercel.app/**`
   - `http://localhost:3000/**`

### Step 3: Customize Email Templates

For each email type (Confirm signup, Magic Link, Change Email, Reset Password):

1. Click on the template name
2. Edit the **Subject** line
3. Customize the **Message body** (HTML supported)
4. Use available **variables** (see next section)
5. Click **Save**

## Email Template Variables

Supabase provides these variables for use in email templates:

### Common Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | URL for email confirmation | Used in signup emails |
| `{{ .Token }}` | 6-digit confirmation code | Alternative to URL |
| `{{ .TokenHash }}` | Hashed token for security | For custom implementations |
| `{{ .SiteURL }}` | Your configured site URL | `https://overlayapp.vercel.app` |
| `{{ .Email }}` | User's email address | `user@example.com` |
| `{{ .RedirectTo }}` | Custom redirect destination | From client-side auth call |

### Email Type Specific

**Signup Confirmation:**
```html
<p>Confirm your email: <a href="{{ .ConfirmationURL }}">Click here</a></p>
<p>Or enter this code: {{ .Token }}</p>
```

**Password Reset:**
```html
<p>Reset your password: <a href="{{ .ConfirmationURL }}">Click here</a></p>
<p>Code: {{ .Token }}</p>
```

**Magic Link:**
```html
<p>Sign in to your account: <a href="{{ .ConfirmationURL }}">Click here</a></p>
```

**Email Change:**
```html
<p>Confirm your new email: <a href="{{ .ConfirmationURL }}">Click here</a></p>
<p>Code: {{ .Token }}</p>
```

## Custom Email Templates

### Option 1: Dashboard HTML Editor

1. Go to Authentication → Email Templates
2. Select template to customize
3. Edit HTML directly in the editor
4. Use variables as shown above
5. Save and test

**Example Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #0070f3;
      color: white;
      text-decoration: none;
      border-radius: 5px;
    }
    .code {
      font-size: 24px;
      font-weight: bold;
      letter-spacing: 4px;
      padding: 10px;
      background-color: #f5f5f5;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to OverlayApp!</h1>
    <p>Hi {{ .Email }},</p>
    <p>Thanks for signing up! Please confirm your email address to get started.</p>

    <p style="text-align: center;">
      <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
    </p>

    <p>Or enter this code in the app:</p>
    <p class="code">{{ .Token }}</p>

    <p>This link expires in 24 hours.</p>

    <hr>
    <p style="color: #666; font-size: 12px;">
      If you didn't create an account, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
```

### Option 2: Custom SMTP Provider

For advanced email customization, use a dedicated email service:

1. **SendGrid**: Free tier available, excellent deliverability
2. **Postmark**: Transaction email specialist
3. **AWS SES**: Cost-effective for high volume
4. **Mailgun**: Good for developer-friendly APIs

**Configure in Supabase Dashboard:**

1. Go to **Project Settings** → **Authentication**
2. Scroll to **SMTP Settings**
3. Enter your SMTP credentials:
   - Host: `smtp.sendgrid.net`
   - Port: `587`
   - Username: `apikey`
   - Password: `YOUR_SENDGRID_API_KEY`
   - Sender Email: `noreply@overlayapp.com`
   - Sender Name: `OverlayApp`

## Testing Email Flow

### Local Testing (Development)

**Using Inbucket (Included with Supabase CLI):**

1. Start local Supabase: `npx supabase start`
2. Open Inbucket UI: `http://localhost:54324`
3. Trigger email action (signup, password reset)
4. Check email in Inbucket interface
5. Click confirmation links to test flow

**Testing Checklist:**

```bash
# 1. Sign up new user
curl -X POST 'http://localhost:54321/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'

# 2. Check email in Inbucket: http://localhost:54324

# 3. Request password reset
curl -X POST 'http://localhost:54321/auth/v1/recover' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'

# 4. Check reset email in Inbucket
```

### Production Testing

**Pre-deployment Checklist:**

- [ ] Update `site_url` in Supabase Dashboard to production URL
- [ ] Add all redirect URLs (including preview deployments)
- [ ] Configure custom SMTP (if using)
- [ ] Test email templates with real data
- [ ] Verify email deliverability (check spam folders)
- [ ] Test all email flows:
  - [ ] Signup confirmation
  - [ ] Password reset
  - [ ] Email change
  - [ ] Magic link (if enabled)
- [ ] Check email rendering on mobile devices
- [ ] Verify links work from email clients

**Production Test Commands:**

```bash
# Test signup (production)
curl -X POST 'https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_PRODUCTION_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@yourdomain.com",
    "password": "securepassword123"
  }'
```

## Production Deployment

### Deployment Checklist

**1. Update Configuration Files:**

```bash
# .env.production (or Vercel Environment Variables)
NEXT_PUBLIC_APP_URL=https://overlayapp.vercel.app
NEXT_PUBLIC_PRODUCTION_URL=https://overlayapp.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://fjjoguapljqrngqvtdvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

**2. Supabase Dashboard Settings:**

- Site URL: `https://overlayapp.vercel.app`
- Redirect URLs:
  - `https://overlayapp.vercel.app/**`
  - `https://*.vercel.app/**`
  - Custom domain if applicable

**3. DNS and Email Authentication (if using custom SMTP):**

For custom domain emails, configure SPF, DKIM, and DMARC:

```dns
# SPF Record
TXT @ "v=spf1 include:sendgrid.net ~all"

# DKIM Record (provided by email service)
TXT s1._domainkey "v=DKIM1; k=rsa; p=YOUR_DKIM_KEY"

# DMARC Record
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:postmaster@overlayapp.com"
```

**4. Rate Limiting:**

Configure rate limits in `supabase/config.toml`:

```toml
[auth.email]
max_frequency = "1h"  # Maximum 1 email per hour per user
```

**5. Email Monitoring:**

Set up monitoring for email deliverability:

- Track bounce rates
- Monitor spam complaints
- Check delivery rates
- Set up alerts for failures

### Vercel Deployment

**Environment Variables to Set:**

```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_APP_URL=https://overlayapp.vercel.app
NEXT_PUBLIC_PRODUCTION_URL=https://overlayapp.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://fjjoguapljqrngqvtdvj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Custom SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_FROM=noreply@overlayapp.com
SMTP_FROM_NAME=OverlayApp
```

## Troubleshooting

### Common Issues

**1. Emails Not Sending**

**Symptoms:** Users don't receive confirmation emails

**Solutions:**

- Check spam/junk folders
- Verify `site_url` is correctly set
- Check Supabase logs: Dashboard → Logs → Authentication
- Verify SMTP credentials (if using custom)
- Check email service status

**Debug Commands:**

```bash
# Check Supabase logs
npx supabase logs --level error

# Test SMTP connection
curl -v smtp://smtp.gmail.com:587
```

**2. Confirmation Links Not Working**

**Symptoms:** Clicking email links shows errors

**Solutions:**

- Verify all redirect URLs are added to Supabase
- Check that `NEXT_PUBLIC_APP_URL` matches production URL
- Ensure auth callback route exists: `/auth/callback`
- Verify tokens haven't expired (24-hour default)

**3. Wrong Redirect After Email Confirmation**

**Symptoms:** Users redirected to wrong URL

**Solutions:**

- Update `site_url` in Supabase Dashboard
- Check `additional_redirect_urls` includes all variants
- Use `redirectTo` parameter in auth calls:

```typescript
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    emailRedirectTo: 'https://overlayapp.vercel.app/dashboard'
  }
})
```

**4. Rate Limiting Issues**

**Symptoms:** Users can't receive multiple emails

**Solutions:**

- Adjust `max_frequency` in config.toml
- Implement user-friendly error messages
- Consider using different email types (magic link vs password)

**5. Email Rendering Issues**

**Symptoms:** Emails look broken in some clients

**Solutions:**

- Use inline CSS (many email clients strip `<style>` tags)
- Test with [Litmus](https://www.litmus.com/) or [Email on Acid](https://www.emailonacid.com/)
- Keep HTML simple and table-based
- Avoid JavaScript (not supported in emails)

### Debug Email Flow

**Check Email Status:**

```sql
-- In Supabase SQL Editor
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  last_sign_in_at
FROM auth.users
WHERE email = 'user@example.com';
```

**Check Auth Logs:**

```sql
-- View recent auth events
SELECT
  created_at,
  user_id,
  event_type,
  ip_address
FROM auth.audit_log_entries
ORDER BY created_at DESC
LIMIT 50;
```

### Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Template Variables](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)
- [Community Support](https://github.com/supabase/supabase/discussions)

## Best Practices

### Security

1. **Never expose service role keys** in email templates or client code
2. **Use HTTPS** for all production URLs
3. **Implement rate limiting** to prevent email abuse
4. **Validate email addresses** before sending
5. **Set token expiration** appropriately (24 hours default)

### User Experience

1. **Clear subject lines**: "Confirm your OverlayApp email"
2. **Multiple confirmation methods**: Both link and code
3. **Mobile-friendly design**: Test on various devices
4. **Clear call-to-action**: Prominent confirmation button
5. **Helpful error messages**: Guide users when things go wrong

### Deliverability

1. **Use professional email service** for production
2. **Configure SPF/DKIM/DMARC** for custom domains
3. **Monitor bounce rates** and maintain clean lists
4. **Warm up new domains** gradually increase volume
5. **Include unsubscribe option** for marketing emails

### Monitoring

1. **Track email metrics**: Delivery, open, click rates
2. **Set up alerts**: For delivery failures
3. **Log email events**: For debugging
4. **Regular testing**: Automated email flow tests
5. **User feedback**: Collect reports of email issues

---

## Quick Reference

### Email Types and Default Templates

| Type | Trigger | Default Expiry | Variables |
|------|---------|----------------|-----------|
| Signup Confirmation | User registers | 24 hours | `.ConfirmationURL`, `.Token`, `.Email` |
| Password Reset | User requests reset | 1 hour | `.ConfirmationURL`, `.Token`, `.Email` |
| Email Change | User changes email | 24 hours | `.ConfirmationURL`, `.Token`, `.Email` |
| Magic Link | Passwordless login | 1 hour | `.ConfirmationURL`, `.Token`, `.Email` |

### Configuration Priority

1. **Supabase Dashboard** (highest priority)
2. **Environment Variables** (`.env.local`, `.env.production`)
3. **Local config.toml** (development only)
4. **Default Supabase settings** (fallback)

### Testing URLs

- **Local Development**: `http://localhost:3000`
- **Local Email Viewer**: `http://localhost:54324` (Inbucket)
- **Supabase Studio**: `http://localhost:54323`
- **Production**: `https://overlayapp.vercel.app`

---

**Last Updated**: 2025-10-01
**Configuration Version**: 1.0.0
**Supabase Project**: `fjjoguapljqrngqvtdvj`
