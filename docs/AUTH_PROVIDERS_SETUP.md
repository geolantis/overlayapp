# Authentication Providers Setup Guide

OverlayApp now supports multiple authentication providers for a seamless user experience:

- ✅ **Email/Password** (Default)
- 🔐 **Phone/SMS** (OTP)
- 🍎 **Apple Sign In**
- 📧 **Google OAuth**

---

## 📱 Phone Authentication Setup

Phone authentication allows users to sign in using their mobile number with OTP verification.

### 1. Choose an SMS Provider

Supabase supports multiple SMS providers:
- **Twilio** (Recommended for production)
- **MessageBird**
- **Vonage**
- **TextLocal**

### 2. Configure in Supabase Dashboard

**Navigate to:** https://supabase.com/dashboard/project/fjjoguapljqrngqvtdvj/auth/providers

1. Click on **"Phone"** under Authentication Providers
2. Enable Phone Sign-In
3. Select your SMS provider (e.g., Twilio)
4. Add your provider credentials:
   - **Twilio Account SID**
   - **Twilio Auth Token**
   - **Twilio Phone Number** (your sender number)

### 3. Test OTP (Development Only)

For testing, you can set a test OTP code in the Supabase Dashboard:
- Go to Authentication → Settings
- Under "Test OTP", enter `123456`
- This allows testing without sending real SMS

### 4. Configuration File

The phone authentication is pre-configured in `supabase/config.toml`:

```toml
[auth.sms]
enable_signup = true
enable_confirmations = true
max_frequency = "5m"  # Prevent spam: 1 OTP per 5 minutes
```

### 5. User Flow

1. User enters phone number on `/login/phone` or `/signup/phone`
2. OTP is sent via SMS
3. User enters the 6-digit code
4. User is authenticated and redirected to dashboard

---

## 🍎 Apple Sign In Setup

Enable users to sign in with their Apple ID.

### 1. Apple Developer Account Requirements

You need an **Apple Developer Account** ($99/year):
- Visit: https://developer.apple.com/account

### 2. Create Service ID

**Navigate to:** https://developer.apple.com/account/resources/identifiers/list/serviceId

1. Click **"+"** to create a new identifier
2. Select **"Services IDs"**
3. Enter details:
   - **Description**: OverlayApp Authentication
   - **Identifier**: `com.overlayapp.auth` (must be unique)
4. Click **Continue** and **Register**

### 3. Configure Service ID

1. Select your newly created Service ID
2. Enable **"Sign In with Apple"**
3. Click **"Configure"**
4. Add your domains and redirect URLs:
   - **Domains**: `overlayapp-payment-plp9autsi-geolantis-projects.vercel.app`
   - **Return URLs**: `https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/callback`
5. Save changes

### 4. Create Private Key

1. Go to **Keys** in Apple Developer
2. Click **"+"** to create a new key
3. Enter a name: "OverlayApp Auth Key"
4. Enable **"Sign In with Apple"**
5. Configure the key with your Service ID
6. Download the `.p8` key file (you can only download once!)
7. Note your **Key ID** (10 characters)

### 5. Add Credentials to Supabase

**Navigate to:** https://supabase.com/dashboard/project/fjjoguapljqrngqvtdvj/auth/providers

1. Click on **"Apple"** under Authentication Providers
2. Enable Apple Sign-In
3. Enter your credentials:
   - **Services ID**: `com.overlayapp.auth`
   - **Team ID**: Found in Apple Developer Account
   - **Key ID**: From step 4 above
   - **Private Key**: Contents of the `.p8` file

### 6. Update Environment Variables

Add to your `.env.local`:

```env
APPLE_CLIENT_ID=com.overlayapp.auth
APPLE_CLIENT_SECRET=your-generated-secret
```

### 7. Configuration File

Pre-configured in `supabase/config.toml`:

```toml
[auth.external.apple]
enabled = true
client_id = "env(APPLE_CLIENT_ID)"
secret = "env(APPLE_CLIENT_SECRET)"
redirect_uri = "https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/callback"
```

---

## 📧 Google OAuth Setup

Enable users to sign in with their Google account.

### 1. Create Google Cloud Project

**Navigate to:** https://console.cloud.google.com/

1. Create a new project or select existing
2. Name it: "OverlayApp"

### 2. Enable Google+ API

1. Go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

### 3. Create OAuth Consent Screen

**Navigate to:** https://console.cloud.google.com/apis/credentials/consent

1. Select **"External"** user type
2. Fill in application details:
   - **App name**: OverlayApp
   - **User support email**: your-email@example.com
   - **Developer contact**: your-email@example.com
3. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
4. Add test users (for testing phase)
5. Save and continue

### 4. Create OAuth Client ID

**Navigate to:** https://console.cloud.google.com/apis/credentials

1. Click **"Create Credentials"** → **"OAuth client ID"**
2. Application type: **"Web application"**
3. Name: "OverlayApp Web Client"
4. Authorized JavaScript origins:
   - `https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app`
   - `http://localhost:3000` (for development)
5. Authorized redirect URIs:
   - `https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/callback`
6. Click **Create**
7. Copy your **Client ID** and **Client Secret**

### 5. Add Credentials to Supabase

**Navigate to:** https://supabase.com/dashboard/project/fjjoguapljqrngqvtdvj/auth/providers

1. Click on **"Google"** under Authentication Providers
2. Enable Google Sign-In
3. Enter your credentials:
   - **Client ID**: From step 4
   - **Client Secret**: From step 4

### 6. Update Environment Variables

Add to your `.env.local`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 7. Configuration File

Pre-configured in `supabase/config.toml`:

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/callback"
```

---

## 🔄 Testing Authentication Providers

### Local Development

1. **Update your local Supabase**:
   ```bash
   supabase stop
   supabase start
   ```

2. **Test each provider**:
   - **Email**: Use the signup form
   - **Phone**: Navigate to `/login/phone` (will be created)
   - **Google**: Click Google button on login page
   - **Apple**: Click Apple button on login page

### Production Testing

1. **Deploy environment variables** to Vercel:
   ```bash
   vercel env add GOOGLE_CLIENT_ID
   vercel env add GOOGLE_CLIENT_SECRET
   vercel env add APPLE_CLIENT_ID
   vercel env add APPLE_CLIENT_SECRET
   ```

2. **Redeploy** your application:
   ```bash
   vercel --prod
   ```

3. **Test on production URL**:
   - Visit: https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app
   - Try logging in with each provider

---

## 🎨 UI Updates

Both login and signup pages now include:

✅ **Three provider buttons** in a grid layout:
- Google (with Google logo)
- Apple (with Apple logo)
- Phone (with phone icon)

✅ **Branded styling** matching OverlayApp design:
- Blue-600 primary color
- Slate color palette
- Professional iconography

---

## 📋 Checklist

Use this checklist to track your setup progress:

### Phone Authentication
- [ ] Choose SMS provider (Twilio recommended)
- [ ] Create provider account
- [ ] Add credentials to Supabase Dashboard
- [ ] Test OTP delivery
- [ ] Create `/login/phone` and `/signup/phone` pages

### Apple Sign In
- [ ] Have Apple Developer Account ($99/year)
- [ ] Create Service ID
- [ ] Generate Private Key (.p8 file)
- [ ] Add credentials to Supabase Dashboard
- [ ] Add environment variables to Vercel
- [ ] Test Apple login flow

### Google OAuth
- [ ] Create Google Cloud Project
- [ ] Enable Google+ API
- [ ] Configure OAuth Consent Screen
- [ ] Create OAuth Client ID
- [ ] Add credentials to Supabase Dashboard
- [ ] Add environment variables to Vercel
- [ ] Test Google login flow

### Deployment
- [ ] Deploy all environment variables to Vercel
- [ ] Update Supabase config: `supabase db push`
- [ ] Redeploy to production
- [ ] Test all providers on production

---

## 🔧 Troubleshooting

### "OAuth Error: Invalid Client ID"
- Double-check client ID in Supabase Dashboard
- Ensure environment variables are deployed to Vercel
- Verify redirect URI matches exactly

### "Phone authentication not working"
- Check SMS provider credentials in Supabase Dashboard
- Verify your Twilio/MessageBird account has credits
- Test with test OTP first

### "Apple Sign In fails"
- Verify your Apple Developer account is active
- Check that Service ID is properly configured
- Ensure domains and redirect URLs are correct
- Verify `.p8` private key is correctly uploaded

### "Redirect URI Mismatch"
- Ensure all redirect URIs include:
  `https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/callback`
- Check for trailing slashes or typos
- Verify the URI in both provider console and Supabase Dashboard

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple Sign In Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Phone Auth Setup](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Documentation](https://www.twilio.com/docs)

---

**Status**: ✅ Configuration files updated, UI ready
**Next Steps**: Add provider credentials and test authentication flows
