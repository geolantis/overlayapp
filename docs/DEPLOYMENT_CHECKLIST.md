# Deployment Checklist - Email System

Complete this checklist before deploying the email system to production.

## Pre-Deployment

### 1. Configuration Files ✓

- [ ] **supabase/config.toml**
  - [ ] Updated `site_url` to production URL
  - [ ] Added all redirect URLs (production, preview, localhost)
  - [ ] Configured email settings (`max_frequency`, etc.)
  - [ ] Verified Google OAuth settings (if using)

- [ ] **.env.production** (or Vercel Environment Variables)
  - [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
  - [ ] Set `NEXT_PUBLIC_PRODUCTION_URL` to production URL
  - [ ] Configured Supabase production keys
  - [ ] Added SMTP settings (if using custom email)

- [ ] **.env.example**
  - [ ] Updated with all required email variables
  - [ ] Added production URL placeholders
  - [ ] Documented all email configuration options

### 2. Supabase Dashboard Configuration ✓

- [ ] **URL Configuration**
  - [ ] Site URL set to: `https://overlayapp.vercel.app`
  - [ ] Redirect URLs added:
    - [ ] `https://overlayapp.vercel.app/**`
    - [ ] `https://*.overlayapp.vercel.app/**`
    - [ ] `http://localhost:3000/**` (for local testing)

- [ ] **Email Templates**
  - [ ] Customized signup confirmation email
  - [ ] Customized password reset email
  - [ ] Customized email change confirmation
  - [ ] Customized magic link email (if using)
  - [ ] Tested all templates with real data
  - [ ] Verified all variables render correctly

- [ ] **SMTP Settings** (if using custom email)
  - [ ] Configured SMTP host and port
  - [ ] Added authentication credentials
  - [ ] Set sender email and name
  - [ ] Tested SMTP connection

- [ ] **Rate Limiting**
  - [ ] Configured max email frequency
  - [ ] Set appropriate limits for production volume
  - [ ] Tested rate limiting behavior

### 3. Email Service Setup (if using custom SMTP) ✓

- [ ] **Email Provider Account**
  - [ ] Created account with email service (SendGrid, Postmark, etc.)
  - [ ] Generated API keys/SMTP credentials
  - [ ] Verified account and completed setup
  - [ ] Configured sender domain

- [ ] **DNS Configuration**
  - [ ] Added SPF record
  - [ ] Added DKIM record
  - [ ] Added DMARC record
  - [ ] Verified DNS propagation
  - [ ] Passed authentication checks

- [ ] **Domain Verification**
  - [ ] Verified sender domain with email service
  - [ ] Configured return-path domain
  - [ ] Set up bounce/complaint handling
  - [ ] Warmed up sending domain (if new)

### 4. Code Review ✓

- [ ] **Authentication Flow**
  - [ ] Signup flow includes email confirmation
  - [ ] Password reset sends email correctly
  - [ ] Email change requires confirmation
  - [ ] Magic link authentication works (if enabled)
  - [ ] Proper error handling for email failures

- [ ] **Redirect Handling**
  - [ ] `/auth/callback` route exists and works
  - [ ] Proper redirectTo parameters in auth calls
  - [ ] Error states handled gracefully
  - [ ] Success redirects to appropriate pages

- [ ] **Security**
  - [ ] No service role keys in client code
  - [ ] No hardcoded secrets in repository
  - [ ] Proper environment variable usage
  - [ ] HTTPS enforced in production
  - [ ] Token expiration configured appropriately

## Testing

### 5. Local Testing ✓

- [ ] **Development Environment**
  - [ ] Local Supabase running: `npx supabase start`
  - [ ] Inbucket accessible at `http://localhost:54324`
  - [ ] All email flows tested locally
  - [ ] Email templates render correctly

- [ ] **Email Flows**
  - [ ] User signup sends confirmation email
  - [ ] Confirmation link works correctly
  - [ ] Confirmation code works (if using)
  - [ ] Password reset sends email
  - [ ] Password reset link works
  - [ ] Email change sends confirmation to both addresses
  - [ ] Magic link works (if enabled)

- [ ] **Error Handling**
  - [ ] Invalid email addresses rejected
  - [ ] Rate limiting works as expected
  - [ ] Expired tokens show appropriate errors
  - [ ] Network errors handled gracefully

### 6. Staging/Preview Testing ✓

- [ ] **Preview Deployment**
  - [ ] Deployed to Vercel preview environment
  - [ ] Environment variables set correctly
  - [ ] Redirect URLs include preview URL
  - [ ] Email confirmation works from preview

- [ ] **Real Email Testing**
  - [ ] Test with real email addresses
  - [ ] Check spam/junk folders
  - [ ] Verify email rendering in multiple clients:
    - [ ] Gmail web
    - [ ] Outlook web
    - [ ] Apple Mail
    - [ ] Mobile email apps
  - [ ] Test links on mobile devices

- [ ] **Integration Testing**
  - [ ] End-to-end signup flow
  - [ ] End-to-end password reset flow
  - [ ] End-to-end email change flow
  - [ ] User dashboard after confirmation
  - [ ] Subscription flow after signup

### 7. Production Testing ✓

- [ ] **Pre-Production Verification**
  - [ ] All environment variables set in Vercel
  - [ ] Supabase project using production credentials
  - [ ] Custom domain configured (if applicable)
  - [ ] SSL certificate valid

- [ ] **Smoke Tests**
  - [ ] Create test account with real email
  - [ ] Confirm email from production
  - [ ] Reset password from production
  - [ ] Change email from production
  - [ ] Delete test account after verification

- [ ] **Monitoring Setup**
  - [ ] Error tracking enabled (Sentry, etc.)
  - [ ] Email delivery monitoring configured
  - [ ] Bounce/complaint tracking set up
  - [ ] Alert thresholds configured

## Deployment

### 8. Vercel Deployment ✓

- [ ] **Environment Variables**
  ```bash
  NEXT_PUBLIC_APP_URL=https://overlayapp.vercel.app
  NEXT_PUBLIC_PRODUCTION_URL=https://overlayapp.vercel.app
  NEXT_PUBLIC_SUPABASE_URL=https://fjjoguapljqrngqvtdvj.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  # SMTP variables (if using custom)
  SMTP_HOST=smtp.sendgrid.net
  SMTP_PORT=587
  SMTP_USER=apikey
  SMTP_PASSWORD=your_api_key
  SMTP_FROM=noreply@overlayapp.com
  SMTP_FROM_NAME=OverlayApp
  ```

- [ ] **Deployment Steps**
  - [ ] Push code to main branch
  - [ ] Verify build succeeds
  - [ ] Check deployment logs for errors
  - [ ] Visit production URL
  - [ ] Test auth flow immediately after deployment

### 9. Post-Deployment Verification ✓

- [ ] **Immediate Checks**
  - [ ] Production site loads correctly
  - [ ] Signup form accessible
  - [ ] Test email flow with new account
  - [ ] Verify email received and renders correctly
  - [ ] Confirm link redirects properly

- [ ] **Monitoring**
  - [ ] Check error logs (first 30 minutes)
  - [ ] Monitor email delivery rates
  - [ ] Watch for bounce/complaint notifications
  - [ ] Verify analytics tracking

- [ ] **User Communication**
  - [ ] Test with beta users (if applicable)
  - [ ] Collect initial feedback
  - [ ] Monitor support channels for issues
  - [ ] Document any immediate issues

## Post-Deployment

### 10. Documentation ✓

- [ ] **Internal Documentation**
  - [ ] Updated README with production URLs
  - [ ] Documented email configuration process
  - [ ] Created troubleshooting guide
  - [ ] Updated deployment procedures

- [ ] **User Documentation**
  - [ ] Help articles for email issues
  - [ ] FAQ for common email problems
  - [ ] Support contact information
  - [ ] Email preferences documentation

### 11. Monitoring and Alerts ✓

- [ ] **Email Metrics**
  - [ ] Delivery rate tracking
  - [ ] Bounce rate monitoring
  - [ ] Spam complaint tracking
  - [ ] Open rate analytics (if applicable)

- [ ] **Application Metrics**
  - [ ] Signup completion rate
  - [ ] Email confirmation rate
  - [ ] Password reset success rate
  - [ ] Error rate by email type

- [ ] **Alert Configuration**
  - [ ] High bounce rate alerts
  - [ ] Email send failure alerts
  - [ ] Rate limit breach alerts
  - [ ] Unusual email volume alerts

### 12. Maintenance Plan ✓

- [ ] **Regular Tasks**
  - [ ] Weekly email deliverability check
  - [ ] Monthly template review and updates
  - [ ] Quarterly email service evaluation
  - [ ] Regular DNS record verification

- [ ] **Incident Response**
  - [ ] Email outage procedures documented
  - [ ] Escalation path defined
  - [ ] Backup email service identified
  - [ ] Rollback procedures tested

- [ ] **Optimization**
  - [ ] A/B test email templates
  - [ ] Monitor confirmation completion rates
  - [ ] Optimize email copy for engagement
  - [ ] Reduce bounce/spam rates

## Rollback Plan

### 13. Emergency Procedures ✓

- [ ] **Rollback Steps**
  1. Revert to previous Vercel deployment
  2. Restore previous Supabase configuration
  3. Switch DNS back to old configuration (if changed)
  4. Notify users of service interruption
  5. Document incident for post-mortem

- [ ] **Backup Configuration**
  - [ ] Previous config.toml saved
  - [ ] Previous environment variables documented
  - [ ] Previous email templates backed up
  - [ ] Previous DNS settings recorded

## Sign-Off

### 14. Stakeholder Approval ✓

- [ ] **Technical Review**
  - [ ] Lead developer approval
  - [ ] Security review completed
  - [ ] Performance review completed

- [ ] **Business Review**
  - [ ] Product owner approval
  - [ ] Marketing/communications informed
  - [ ] Support team trained

- [ ] **Compliance** (if applicable)
  - [ ] GDPR compliance verified
  - [ ] CAN-SPAM compliance verified
  - [ ] Privacy policy updated
  - [ ] Terms of service updated

---

## Deployment Timeline

**Pre-Deployment**: 2-3 days
- Configuration and setup
- Template customization
- DNS configuration

**Testing**: 3-5 days
- Local and staging tests
- Email client testing
- Integration testing

**Deployment**: 1 day
- Production deployment
- Immediate verification
- Monitoring setup

**Post-Deployment**: Ongoing
- Daily monitoring (first week)
- Weekly reviews (first month)
- Monthly optimization

---

## Contacts and Resources

**Emergency Contacts:**
- Technical Lead: [Name/Email]
- DevOps: [Name/Email]
- Supabase Support: support@supabase.com
- Email Service Support: [Provider contact]

**Documentation:**
- Email Configuration Guide: `/docs/EMAIL_CONFIGURATION.md`
- Supabase Dashboard: https://app.supabase.com
- Email Service Dashboard: [Provider URL]
- Vercel Dashboard: https://vercel.com/dashboard

**Useful Commands:**
```bash
# Deploy to Vercel
vercel --prod

# Check Supabase status
npx supabase status

# View production logs
vercel logs

# Test email API
curl -X POST 'https://fjjoguapljqrngqvtdvj.supabase.co/auth/v1/signup' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Verified By**: _________________
**Production URL**: https://overlayapp.vercel.app
**Supabase Project**: fjjoguapljqrngqvtdvj

---

## Notes

Use this section for deployment-specific notes, issues encountered, or deviations from the checklist:

```
[Add notes here]
```
