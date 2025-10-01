# OverlayApp API Documentation

Welcome to the comprehensive API documentation for the OverlayApp Payment System.

**Version**: 1.0.0
**Last Updated**: 2025-10-01
**Status**: Production Ready

---

## 📚 Documentation Index

### Core Documentation

1. **[API Reference](./API_REFERENCE.md)**
   - Complete endpoint documentation
   - Request/response examples
   - Authentication guide
   - Error handling
   - Rate limiting
   - Best practices

2. **[OpenAPI Specification](./openapi.yaml)**
   - OpenAPI 3.0 compliant spec
   - Machine-readable format
   - Import into Postman, Swagger UI, etc.
   - Auto-generated client SDKs

3. **[Database Schema](./DATABASE_SCHEMA.md)**
   - Complete database documentation
   - Entity relationship diagrams
   - Row-level security policies
   - Functions and triggers
   - Indexes and performance

---

## 🚀 Quick Start

### 1. Get API Access

```bash
# Sign up and get your API credentials
curl -X POST https://api.overlayapp.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### 2. Authenticate

```bash
# Login to get JWT token
curl -X POST https://api.overlayapp.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Make Your First Request

```bash
# Get pricing plans
curl https://api.overlayapp.com/api/billing/plans
```

---

## 🔑 Authentication

All API requests (except public endpoints) require authentication:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  https://api.overlayapp.com/api/billing/subscription
```

**Token Management**:
- Access tokens expire after 1 hour
- Refresh tokens valid for 30 days
- Store tokens securely (never in localStorage)
- Implement token refresh before expiration

---

## 📖 API Reference

### Base URLs

- **Production**: `https://api.overlayapp.com`
- **Staging**: `https://staging-api.overlayapp.com`
- **Development**: `http://localhost:3000`

### Core Endpoints

#### Pricing Plans
- `GET /api/billing/plans` - Get all pricing plans

#### Subscriptions
- `POST /api/billing/checkout` - Create checkout session
- `GET /api/billing/subscription` - Get current subscription
- `PUT /api/billing/subscription/:id` - Update subscription
- `DELETE /api/billing/subscription/:id` - Cancel subscription
- `POST /api/billing/subscription/:id/reactivate` - Reactivate subscription

#### Usage & Invoices
- `GET /api/billing/usage` - Get current usage
- `GET /api/billing/invoices` - Get invoice history

#### Management
- `POST /api/billing/portal` - Create billing portal session

#### Webhooks
- `POST /api/billing/webhooks/stripe` - Stripe webhook handler

---

## 🗄️ Database

### Technology Stack
- **Database**: PostgreSQL 15+ (Supabase)
- **Extensions**: uuid-ossp, pgcrypto, PostGIS
- **Security**: Row-Level Security (RLS) enabled
- **Backup**: Continuous backup with PITR

### Main Tables

**Billing Tables**:
- `pricing_plans` - Available subscription plans
- `customers` - Customer billing information
- `subscriptions` - Active and historical subscriptions
- `usage_records` - Resource usage tracking
- `invoices` - Invoice history
- `invoice_line_items` - Invoice details

**Security Tables**:
- `organizations` - Multi-tenant organizations
- `users` - User profiles with security features
- `user_organizations` - User-organization relationships
- `audit_logs` - Comprehensive audit trail
- `api_keys` - API key management

See [Database Schema](./DATABASE_SCHEMA.md) for complete details.

---

## 🔒 Security

### Authentication Methods

1. **JWT Bearer Token** (Primary)
   ```http
   Authorization: Bearer <jwt-token>
   ```

2. **API Key** (Server-to-Server)
   ```http
   X-API-Key: <api-key>
   ```

### Security Features

- **Row-Level Security (RLS)**: Database-level access control
- **Encrypted PII**: Personal data encrypted at rest
- **Audit Logging**: Comprehensive audit trail
- **Rate Limiting**: Prevent abuse
- **HTTPS Only**: All connections encrypted in transit
- **Webhook Verification**: Stripe signature validation

### Best Practices

✅ **Do**:
- Always use HTTPS
- Store tokens securely
- Implement token rotation
- Verify webhook signatures
- Log security events
- Handle errors gracefully

❌ **Don't**:
- Store tokens in localStorage
- Share API keys
- Skip error handling
- Ignore rate limits
- Log sensitive data

---

## 📊 Rate Limiting

### Default Limits

- **Authenticated**: 100 requests per 15 minutes
- **Unauthenticated**: 20 requests per 15 minutes
- **Webhooks**: Unlimited (signature verified)

### Plan-Based Limits

- **Starter**: 100 req/15min
- **Professional**: 1000 req/15min
- **Enterprise**: Custom limits

### Rate Limit Headers

Every response includes:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
```

---

## 🛠️ Tools & SDKs

### API Testing

**Postman**:
1. Import [openapi.yaml](./openapi.yaml)
2. Set environment variables
3. Start testing

**Swagger UI**:
```bash
# Serve OpenAPI spec
npx @redocly/openapi-cli preview-docs openapi.yaml
```

**cURL**:
```bash
# Test API with cURL
curl -X GET https://api.overlayapp.com/api/billing/plans \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Client SDKs

Generate SDKs from OpenAPI spec:

**TypeScript/JavaScript**:
```bash
npx openapi-typescript-codegen --input openapi.yaml --output ./sdk/typescript
```

**Python**:
```bash
openapi-generator-cli generate -i openapi.yaml -g python -o ./sdk/python
```

**Go**:
```bash
openapi-generator-cli generate -i openapi.yaml -g go -o ./sdk/go
```

---

## 🔄 Webhooks

### Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourapi.com/api/billing/webhooks/stripe`
3. Select events or choose "Select all events"
4. Copy webhook signing secret
5. Add to `.env` as `STRIPE_WEBHOOK_SECRET`

### Supported Events

**Customer**:
- `customer.created`
- `customer.updated`
- `customer.deleted`

**Subscription**:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`

**Invoice**:
- `invoice.created`
- `invoice.finalized`
- `invoice.paid`
- `invoice.payment_failed`

**Payment**:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_method.attached`
- `payment_method.detached`

### Local Testing

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhooks/stripe
```

---

## 📈 Monitoring & Observability

### Logging

**Levels**:
- `INFO`: Normal operations
- `WARNING`: Potential issues
- `ERROR`: Failed operations
- `CRITICAL`: System failures

**Log Format**:
```json
{
  "timestamp": "2025-01-01T00:00:00Z",
  "level": "INFO",
  "service": "billing-api",
  "user_id": "user-123",
  "operation": "create_checkout",
  "duration_ms": 245,
  "status": "success"
}
```

### Metrics

Monitor these key metrics:
- Request rate (requests/second)
- Error rate (%)
- Response time (p50, p95, p99)
- Database query time
- Cache hit rate
- Active subscriptions
- Revenue metrics (MRR, ARR)

### Alerts

Configure alerts for:
- Error rate > 1%
- Response time p95 > 1000ms
- Failed payments
- Webhook failures
- Database connection issues
- Rate limit violations

---

## 🐛 Debugging & Troubleshooting

### Common Issues

#### 1. Authentication Failed (401)

**Cause**: Invalid or expired token

**Solution**:
```bash
# Refresh your token
curl -X POST https://api.overlayapp.com/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "YOUR_REFRESH_TOKEN"}'
```

#### 2. Rate Limit Exceeded (429)

**Cause**: Too many requests

**Solution**:
- Check `X-RateLimit-Reset` header
- Implement exponential backoff
- Upgrade plan for higher limits

#### 3. Webhook Verification Failed

**Cause**: Invalid signature

**Solution**:
- Verify webhook secret is correct
- Check request body is not modified
- Ensure raw body is used (not parsed JSON)

### Debug Mode

Enable debug logging:
```bash
# Set environment variable
DEBUG=billing:* npm start
```

### Request IDs

Every response includes a `request_id`:
```json
{
  "success": false,
  "error": "...",
  "request_id": "req_1234567890abcdef"
}
```

Include this in support requests for faster debugging.

---

## 📞 Support

### Documentation

- **API Reference**: [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema**: [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- **OpenAPI Spec**: [openapi.yaml](./openapi.yaml)
- **Main Docs**: https://docs.overlayapp.com

### Contact

- **Email**: api-support@overlayapp.com
- **Discord**: https://discord.gg/overlayapp
- **GitHub**: https://github.com/overlayapp
- **Status**: https://status.overlayapp.com

### Response Times

- **Enterprise**: < 1 hour
- **Professional**: < 4 hours
- **Starter**: < 24 hours

### Office Hours

- Monday - Friday: 9 AM - 5 PM PST
- Saturday - Sunday: Emergency support only

---

## 📝 Changelog

### v1.0.0 (2025-01-01)

**Initial Release**:
- Pricing plans API
- Subscription management
- Usage tracking
- Invoice management
- Stripe webhook integration
- OpenAPI 3.0 specification
- Comprehensive database schema
- Row-level security
- Audit logging

---

## 🎯 Roadmap

### Q1 2025
- [ ] GraphQL API
- [ ] Webhook retry mechanism
- [ ] Advanced analytics API
- [ ] Multi-currency support

### Q2 2025
- [ ] Mobile SDKs (iOS, Android)
- [ ] Batch operations API
- [ ] Export API (CSV, JSON)
- [ ] Custom reporting

### Q3 2025
- [ ] API versioning (v2)
- [ ] Real-time updates (WebSocket)
- [ ] Advanced search API
- [ ] Machine learning insights

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with:
- [Stripe](https://stripe.com) - Payment processing
- [Supabase](https://supabase.com) - Backend as a Service
- [PostgreSQL](https://postgresql.org) - Database
- [Express.js](https://expressjs.com) - Web framework
- [TypeScript](https://typescriptlang.org) - Type safety

---

**Last Updated**: 2025-10-01
**API Version**: 1.0.0
**Document Version**: 1.0

For detailed endpoint documentation, see [API_REFERENCE.md](./API_REFERENCE.md)
