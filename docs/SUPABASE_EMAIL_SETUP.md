# Supabase Email Template Setup Guide

## Quick Setup (5 minutes)

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/fjjoguapljqrngqvtdvj
2. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Confirmation Email Template

1. Click on **"Confirm signup"** template
2. Replace the entire HTML content with the template below
3. Click **Save**

### Step 3: Branded Confirmation Email Template

Copy this template into Supabase:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - OverlayApp</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: -0.5px;">OverlayApp</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">Confirm your email address</h2>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for signing up for OverlayApp! To complete your registration and start georeferencing your PDFs, please confirm your email address.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">Confirm Email Address</a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Code -->
              <div style="background-color: #f0f7ff; border-left: 4px solid #2563eb; padding: 16px 20px; margin: 20px 0; border-radius: 4px;">
                <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                  <strong>Or enter this 6-digit code:</strong>
                </p>
                <p style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; margin: 0;">{{ .Token }}</p>
              </div>

              <!-- Security Notice -->
              <div style="margin: 20px 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 600;">🔒 Security Notice</p>
                <p style="color: #92400e; font-size: 14px; margin: 8px 0 0 0; line-height: 1.5;">
                  This confirmation link will expire in <strong>24 hours</strong>. If you didn't create an account, please ignore this email.
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">

              <p style="color: #999999; font-size: 14px; line-height: 1.6; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #2563eb; word-break: break-all;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #999999; font-size: 14px; margin: 0 0 8px 0;">
                &copy; {{ .CurrentYear }} OverlayApp. All rights reserved.
              </p>
              <p style="color: #999999; font-size: 14px; margin: 0;">
                <a href="{{ .SiteURL }}" style="color: #2563eb; text-decoration: none;">Visit our website</a> |
                <a href="{{ .SiteURL }}/support" style="color: #2563eb; text-decoration: none;">Get support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Step 4: Update Other Email Templates (Optional)

Do the same for these templates:

#### **Magic Link** (similar to confirmation)
#### **Password Reset**
#### **Email Change Confirmation**

---

## Available Supabase Variables

Use these variables in your templates:

- `{{ .ConfirmationURL }}` - Email confirmation link
- `{{ .Token }}` - 6-digit confirmation code
- `{{ .TokenHash }}` - Hashed token (for password reset)
- `{{ .SiteURL }}` - Your site URL (from config)
- `{{ .RedirectTo }}` - Redirect URL after confirmation
- `{{ .Email }}` - User's email address
- `{{ .CurrentYear }}` - Current year

---

## Test Your Email Template

1. Sign up with a new email address
2. Check your inbox for the branded email
3. Verify the design looks correct
4. Test the confirmation button works

---

## Troubleshooting

**Email still looks plain?**
- Clear your browser cache
- Wait 1-2 minutes for Supabase to apply changes
- Check you saved the template correctly

**Variables not working?**
- Make sure you're using the correct Supabase syntax: `{{ .Variable }}`
- Check the Supabase documentation for available variables

**Need help?**
- Supabase Email Templates Docs: https://supabase.com/docs/guides/auth/auth-email-templates
- Contact: support@overlayapp.com

---

## Next Steps

After setting up email templates:

1. ✅ Test email confirmation flow
2. ✅ Update password reset template
3. ✅ Update email change template
4. ✅ Configure custom SMTP (optional, for better deliverability)
5. ✅ Setup email tracking and analytics

---

**Current Setup:**
- ✅ Templates created in `/supabase/templates/email/`
- ✅ Blue branding applied (#2563eb → #1d4ed8)
- ✅ Responsive mobile design
- ⏳ **PENDING**: Upload to Supabase Dashboard

**Time Required:** 5 minutes per template
