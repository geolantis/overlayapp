# Email Templates

This directory contains HTML email templates for Supabase authentication emails.

## Templates

- `confirmation.html` - Email confirmation for new signups
- `recovery.html` - Password reset emails
- `email_change.html` - Email address change confirmation
- `magic_link.html` - Passwordless authentication (if enabled)

## Usage

### Local Development

These templates are referenced in `supabase/config.toml` for local development:

```toml
[auth.email]
template = "supabase/templates/email"
```

When running `npx supabase start`, emails will use these templates and can be viewed at:
- **Inbucket**: http://localhost:54324

### Production (Supabase Dashboard)

For production, these templates must be uploaded to the Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates**
4. Select each template type
5. Copy the HTML content from these files
6. Paste into the dashboard editor
7. Customize as needed
8. Click **Save**

## Available Variables

Supabase provides these template variables (use Go template syntax):

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ .ConfirmationURL }}` | Full confirmation URL | `https://app.com/auth/confirm?token=...` |
| `{{ .Token }}` | 6-digit confirmation code | `123456` |
| `{{ .TokenHash }}` | Hashed token | `abc123...` |
| `{{ .SiteURL }}` | Configured site URL | `https://overlayapp.vercel.app` |
| `{{ .Email }}` | User's email address | `user@example.com` |
| `{{ .RedirectTo }}` | Custom redirect URL | Set in auth calls |

## Customization

### Branding

Update these elements to match your brand:

- **Logo**: Change `.logo` text or add `<img>` tag
- **Colors**: Update gradient in `.header` and `.button`
- **Fonts**: Change `font-family` in body styles
- **Footer**: Update company name and links

### Styling

All styles are inline for maximum email client compatibility:

- Use inline CSS for best compatibility
- Avoid JavaScript (not supported in emails)
- Test with multiple email clients
- Keep HTML table-based for older clients

### Testing

**Local Testing:**
```bash
# Start Supabase
npx supabase start

# Trigger email (signup example)
curl -X POST 'http://localhost:54321/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# View email at: http://localhost:54324
```

**Production Testing:**

Use email testing services:
- [Litmus](https://www.litmus.com/) - Comprehensive testing
- [Email on Acid](https://www.emailonacid.com/) - Client preview
- [Mail Tester](https://www.mail-tester.com/) - Spam score

## Email Client Compatibility

These templates are tested with:

- ✅ Gmail (web and mobile)
- ✅ Outlook (web and desktop)
- ✅ Apple Mail (macOS and iOS)
- ✅ Yahoo Mail
- ✅ AOL Mail
- ✅ Thunderbird

## Best Practices

1. **Inline CSS**: Email clients strip `<style>` tags
2. **Table Layouts**: Better cross-client support
3. **Alt Text**: Always add for images
4. **Plain Text**: Consider providing plain text version
5. **Mobile First**: Test on mobile devices
6. **CTA Clarity**: Clear call-to-action buttons
7. **Security**: Never ask for passwords in emails

## Resources

- [Supabase Email Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Email Design Best Practices](https://www.campaignmonitor.com/dev-resources/)
- [HTML Email Guide](https://www.cerberusemail.com/)

## Support

For issues with these templates:
- Check `/docs/EMAIL_CONFIGURATION.md` for setup guide
- Review `/docs/DEPLOYMENT_CHECKLIST.md` for deployment steps
- Contact support: support@overlayapp.com
