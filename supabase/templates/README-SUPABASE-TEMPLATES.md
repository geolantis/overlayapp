# Supabase Email Templates - Upload Guide

## 📧 All Templates Created

I've created **5 beautiful, branded email templates** for your Supabase project:

1. ✅ **supabase-confirm-signup.html** - Account confirmation (with 6-digit code)
2. ✅ **supabase-magic-link.html** - Passwordless login
3. ✅ **supabase-password-reset.html** - Password recovery (with security tips)
4. ✅ **supabase-email-change.html** - Email address confirmation
5. ✅ **supabase-invite.html** - Organization invitations

All templates feature:
- 🎨 Blue gradient branding (#2563eb → #1d4ed8)
- 📱 Fully responsive mobile design
- 🔒 Security notices and warnings
- 💡 Helpful tips and instructions
- ✨ Modern, professional design

---

## 🚀 Quick Upload (5 minutes)

### Step 1: Go to Supabase Dashboard

**URL**: https://supabase.com/dashboard/project/fjjoguapljqrngqvtdvj/auth/templates

### Step 2: Upload Each Template

For each template below, follow these steps:

#### 1️⃣ **Confirm signup** Template
- Click "Confirm signup" in Supabase
- Copy contents from: `supabase-confirm-signup.html`
- Paste into editor
- Click **Save**

#### 2️⃣ **Magic Link** Template
- Click "Magic Link" in Supabase
- Copy contents from: `supabase-magic-link.html`
- Paste into editor
- Click **Save**

#### 3️⃣ **Reset Password** Template
- Click "Reset Password" in Supabase
- Copy contents from: `supabase-password-reset.html`
- Paste into editor
- Click **Save**

#### 4️⃣ **Change Email Address** Template
- Click "Change Email Address" in Supabase
- Copy contents from: `supabase-email-change.html`
- Paste into editor
- Click **Save**

#### 5️⃣ **Invite User** Template
- Click "Invite User" in Supabase
- Copy contents from: `supabase-invite.html`
- Paste into editor
- Click **Save**

---

## ✅ Verification

After uploading all templates:

1. ✅ Test signup flow → Check email looks branded
2. ✅ Test password reset → Check email looks branded
3. ✅ Test magic link → Check email looks branded

---

## 🎨 Template Features

### Modern Design
- Clean, professional layout
- Blue gradient headers matching your brand
- Rounded corners and shadows
- High-contrast text for readability

### Security Features
- Clear expiration times
- Security warnings for unauthorized actions
- Tips for password security
- Prominent security notices

### User Experience
- Large, accessible CTA buttons
- Alternative 6-digit codes
- Clear instructions
- Fallback text links

### Mobile Responsive
- Works on all devices
- Optimized for email clients
- Inline CSS for compatibility

---

## 📝 Supabase Variables Used

These templates use Supabase's built-in variables:

- `{{ .ConfirmationURL }}` - Confirmation link
- `{{ .Token }}` - 6-digit code
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email
- `{{ .InviterName }}` - Who invited (for invites)
- `{{ .OrganizationName }}` - Org name (for invites)
- `{{ .Role }}` - User role (for invites)

---

## 🔧 Troubleshooting

**Variables not working?**
- Make sure you're using correct Supabase syntax: `{{ .Variable }}`
- Check Supabase docs for available variables

**Design looks broken?**
- Clear your email client cache
- Try viewing in a different email client
- Check that all HTML was copied correctly

**Links still point to localhost?**
- Update Site URL in Supabase → Authentication → URL Configuration
- Set to: `https://overlayapp-payment-plp9autsi-geolantis-projects.vercel.app`

---

## 📚 Additional Resources

- Supabase Email Templates Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Your Site URL config: See `UPDATE_SUPABASE_SITE_URL.md`
- Full setup guide: See `docs/SUPABASE_EMAIL_SETUP.md`

---

**Status**: ✅ All 5 templates ready to upload
**Time Required**: ~5 minutes total
**Location**: `/Users/michael/Development/OverlayApp/supabase/templates/`

🎉 **Ready to make your emails beautiful!**
