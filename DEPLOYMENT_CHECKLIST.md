# Production Deployment Checklist

## Pre-Deployment

### Environment Setup
- [ ] Production environment provisioned
- [ ] SSL certificates installed
- [ ] Domain name configured
- [ ] CDN setup (if applicable)
- [ ] Load balancer configured

### Database
- [ ] Supabase production project created
- [ ] Database schema migrated
- [ ] RLS policies verified
- [ ] Indexes created
- [ ] Backup strategy configured
- [ ] Connection pooling enabled

### Stripe Configuration
- [ ] Live mode account activated
- [ ] Business verification completed
- [ ] Products created in live mode
- [ ] Prices created (monthly/annual)
- [ ] Webhook endpoint configured
- [ ] Webhook secret obtained
- [ ] Test payment processed successfully

### Environment Variables
- [ ] All production secrets configured
- [ ] Stripe live API keys set
- [ ] Supabase production keys set
- [ ] Redis production URL set
- [ ] CORS origins configured
- [ ] Log level set appropriately
- [ ] Sentry DSN configured (if using)

### Security
- [ ] Rate limiting configured
- [ ] HTTPS enforced
- [ ] CORS properly restricted
- [ ] Webhook signature verification enabled
- [ ] Input validation in place
- [ ] SQL injection protection verified
- [ ] XSS protection enabled
- [ ] Environment variables secured

## Deployment

### Code Preparation
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Linting passed
- [ ] Dependencies audit clean
- [ ] Build artifacts generated
- [ ] Version tagged in git

### Infrastructure
- [ ] Application deployed
- [ ] Health check endpoint responding
- [ ] Database migrations applied
- [ ] Redis connection verified
- [ ] External services accessible

### Monitoring Setup
- [ ] Logging configured
- [ ] Error tracking active (Sentry)
- [ ] Performance monitoring enabled
- [ ] Uptime monitoring configured
- [ ] Alert rules defined
- [ ] Dashboard created

## Post-Deployment

### Smoke Tests
- [ ] Health check passes
- [ ] Can retrieve pricing plans
- [ ] Can create checkout session
- [ ] Webhook receives test events
- [ ] Database queries working
- [ ] Redis connection stable

### Integration Tests
- [ ] Complete subscription flow tested
- [ ] Payment processing verified
- [ ] Webhook processing confirmed
- [ ] Usage tracking working
- [ ] Invoice generation successful
- [ ] Analytics calculated correctly

### Monitoring
- [ ] Logs flowing correctly
- [ ] Errors being tracked
- [ ] Metrics being collected
- [ ] Alerts configured
- [ ] Dashboard accessible

### Documentation
- [ ] API documentation published
- [ ] Runbook created
- [ ] Incident response plan documented
- [ ] Team trained on system
- [ ] Support contacts updated

## Operations

### Daily
- [ ] Check error rates
- [ ] Review failed payments
- [ ] Monitor webhook processing
- [ ] Check system health

### Weekly
- [ ] Review analytics
- [ ] Check payment retry status
- [ ] Audit suspicious activity
- [ ] Review performance metrics

### Monthly
- [ ] Generate revenue reports
- [ ] Calculate churn metrics
- [ ] Review and optimize costs
- [ ] Update documentation
- [ ] Security review

## Emergency Contacts

### Internal
- DevOps Team: [contact]
- Engineering Lead: [contact]
- On-Call Engineer: [contact]

### External
- Stripe Support: https://support.stripe.com
- Supabase Support: https://supabase.com/support
- Hosting Provider: [contact]

## Rollback Plan

### If Deployment Fails
1. Revert to previous version
2. Restore database if needed
3. Clear Redis cache
4. Verify system stability
5. Investigate root cause

### Rollback Steps
```bash
# Revert application
git checkout <previous-version>
npm run build
npm start

# Revert database (if needed)
supabase db reset --version <previous-migration>

# Clear Redis
redis-cli FLUSHALL
```

## Success Criteria

- [ ] Zero critical errors in first hour
- [ ] Payment processing success rate > 95%
- [ ] API response time < 500ms (p95)
- [ ] Webhook processing < 5s (p95)
- [ ] Customer signup flow working
- [ ] All monitoring alerts functioning

## Sign-off

### Deployment Team
- [ ] Engineering Lead: _____________ Date: _______
- [ ] DevOps Lead: _____________ Date: _______
- [ ] Product Manager: _____________ Date: _______

### Verification
- [ ] Tested by: _____________ Date: _______
- [ ] Approved by: _____________ Date: _______

## Notes

### Deployment Time
- Started: _______
- Completed: _______
- Duration: _______

### Issues Encountered
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Follow-up Actions
1. _______________________________________
2. _______________________________________
3. _______________________________________
