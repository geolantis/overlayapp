# API Reference - OverlayApp Payment System

**Version**: 1.0.0
**Base URL**: `https://api.overlayapp.com` (Production) | `http://localhost:3000` (Development)
**Last Updated**: 2025-10-01

## Table of Contents

- [Authentication](#authentication)
- [Pricing Plans](#pricing-plans)
- [Checkout & Subscriptions](#checkout--subscriptions)
- [Subscription Management](#subscription-management)
- [Usage Tracking](#usage-tracking)
- [Invoices](#invoices)
- [Webhooks](#webhooks)
- [Enterprise Features](#enterprise-features)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints (except webhooks and public endpoints) require authentication using a Bearer token.

### Authentication Methods

#### 1. JWT Bearer Token (Primary)
```http
Authorization: Bearer <your-jwt-token>
```

The JWT token is obtained through Supabase Auth after successful login.

#### 2. API Key (For Server-to-Server)
```http
X-API-Key: <your-api-key>
```

API keys can be generated in the dashboard for server-to-server integrations.

### Authentication Flow

```
1. User logs in via Supabase Auth
2. Receives JWT token
3. Include token in Authorization header
4. Middleware validates JWT and extracts user ID
5. Row-level security (RLS) enforces data access
```

### Token Expiration

- **Access Token**: 1 hour
- **Refresh Token**: 30 days
- **API Key**: Never expires (until revoked)

---

## Pricing Plans

### GET /api/billing/plans

Get all available pricing plans.

**Authentication**: Not required (public endpoint)

**Request**:
```http
GET /api/billing/plans HTTP/1.1
Host: api.overlayapp.com
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "starter",
      "display_name": "Starter",
      "description": "Perfect for individuals and small teams",
      "monthly_price_cents": 990,
      "annual_price_cents": 9900,
      "currency": "USD",
      "storage_gb": 10,
      "api_requests_per_month": 10000,
      "pdf_overlays_per_month": 100,
      "team_members_limit": 3,
      "features": [
        "Basic PDF Overlays",
        "10GB Storage",
        "10K API Requests/month",
        "Email Support",
        "3 Team Members"
      ],
      "is_active": true,
      "is_visible": true,
      "sort_order": 1,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "professional",
      "display_name": "Professional",
      "description": "For growing businesses with advanced needs",
      "monthly_price_cents": 4900,
      "annual_price_cents": 49000,
      "currency": "USD",
      "storage_gb": 100,
      "api_requests_per_month": 100000,
      "pdf_overlays_per_month": 1000,
      "team_members_limit": 10,
      "features": [
        "Advanced PDF Overlays",
        "100GB Storage",
        "100K API Requests/month",
        "Priority Support",
        "10 Team Members",
        "Custom Branding",
        "API Access",
        "Webhook Integration"
      ],
      "is_active": true,
      "is_visible": true,
      "sort_order": 2
    },
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "name": "enterprise",
      "display_name": "Enterprise",
      "description": "Custom solutions for large organizations",
      "monthly_price_cents": 29900,
      "annual_price_cents": 299000,
      "currency": "USD",
      "storage_gb": 1000,
      "api_requests_per_month": 1000000,
      "pdf_overlays_per_month": 10000,
      "team_members_limit": 50,
      "features": [
        "Unlimited PDF Overlays",
        "1TB Storage",
        "1M API Requests/month",
        "Dedicated Support",
        "50+ Team Members",
        "SSO/SAML",
        "SLA Guarantee",
        "Custom Integration",
        "White-Label",
        "Advanced Analytics",
        "Multi-Region",
        "Priority Processing"
      ],
      "is_active": true,
      "is_visible": true,
      "sort_order": 3
    }
  ]
}
```

**Pricing Details**:
- All prices in cents (USD)
- Monthly prices are billed monthly
- Annual prices provide ~17% discount
- Free trial available for all plans (14 days)

---

## Checkout & Subscriptions

### POST /api/billing/checkout

Create a Stripe Checkout session for a new subscription.

**Authentication**: Required

**Request**:
```http
POST /api/billing/checkout HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
Content-Type: application/json

{
  "pricing_plan_id": "123e4567-e89b-12d3-a456-426614174000",
  "billing_cycle": "monthly",
  "success_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancel",
  "discount_code": "PROMO20"
}
```

**Request Fields**:
- `pricing_plan_id` (required): UUID of the pricing plan
- `billing_cycle` (required): `"monthly"` or `"annual"`
- `success_url` (required): Redirect URL after successful checkout
- `cancel_url` (required): Redirect URL if user cancels
- `discount_code` (optional): Promotional code to apply

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0",
    "url": "https://checkout.stripe.com/pay/cs_test_a1B2c3D4..."
  }
}
```

**Usage**:
1. Call this endpoint to create a checkout session
2. Redirect user to the returned `url`
3. User completes payment on Stripe Checkout
4. User is redirected to `success_url` or `cancel_url`
5. Webhook handler processes the subscription

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Invalid parameters
- `404 Not Found`: Pricing plan not found
- `500 Internal Server Error`: Stripe API error

---

### POST /api/billing/portal

Create a Stripe billing portal session for subscription management.

**Authentication**: Required

**Request**:
```http
POST /api/billing/portal HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
Content-Type: application/json

{
  "return_url": "https://yourapp.com/dashboard"
}
```

**Request Fields**:
- `return_url` (required): URL to return after portal session

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/session/live_abc123..."
  }
}
```

**Features Available in Portal**:
- Update payment method
- Change subscription plan
- Cancel subscription
- View invoice history
- Download invoices
- Update billing information

---

## Subscription Management

### GET /api/billing/subscription

Get the user's current active subscription.

**Authentication**: Required

**Request**:
```http
GET /api/billing/subscription HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "sub_123e4567-e89b-12d3-a456-426614174000",
    "customer_id": "cus_123e4567-e89b-12d3-a456-426614174000",
    "pricing_plan_id": "plan_123e4567-e89b-12d3-a456-426614174000",
    "stripe_subscription_id": "sub_1234567890abcdef",
    "stripe_subscription_item_id": "si_1234567890abcdef",
    "status": "active",
    "billing_cycle": "monthly",
    "trial_start": null,
    "trial_end": null,
    "current_period_start": "2025-01-01T00:00:00Z",
    "current_period_end": "2025-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "canceled_at": null,
    "ended_at": null,
    "amount_cents": 990,
    "currency": "USD",
    "metered_billing_enabled": true,
    "plan": {
      "name": "starter",
      "display_name": "Starter",
      "description": "Perfect for individuals and small teams",
      "features": [
        "Basic PDF Overlays",
        "10GB Storage",
        "10K API Requests/month"
      ],
      "storage_gb": 10,
      "api_requests_per_month": 10000,
      "pdf_overlays_per_month": 100
    },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Subscription Statuses**:
- `trialing`: In trial period
- `active`: Active subscription
- `past_due`: Payment failed, retry in progress
- `canceled`: Canceled subscription
- `unpaid`: Payment failed after retries
- `incomplete`: Initial payment incomplete

**Error Responses**:
- `404 Not Found`: No active subscription found

---

### PUT /api/billing/subscription/:id

Update an existing subscription (upgrade, downgrade, or modify).

**Authentication**: Required

**Request**:
```http
PUT /api/billing/subscription/sub_123 HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
Content-Type: application/json

{
  "pricing_plan_id": "123e4567-e89b-12d3-a456-426614174001",
  "billing_cycle": "annual",
  "cancel_at_period_end": false
}
```

**Request Fields**:
- `pricing_plan_id` (optional): New plan UUID
- `billing_cycle` (optional): `"monthly"` or `"annual"`
- `cancel_at_period_end` (optional): Boolean to cancel at period end

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "status": "active",
    "pricing_plan_id": "123e4567-e89b-12d3-a456-426614174001",
    "billing_cycle": "annual",
    "amount_cents": 49000,
    "proration_amount_cents": 2500,
    "updated_at": "2025-01-15T00:00:00Z"
  }
}
```

**Proration Behavior**:
- **Upgrade**: Immediate change, prorated credit applied
- **Downgrade**: Change at period end (default) or immediate
- **Cycle change**: Prorated based on remaining time

---

### DELETE /api/billing/subscription/:id

Cancel a subscription.

**Authentication**: Required

**Query Parameters**:
- `immediately` (optional): Boolean, default `false`

**Request**:
```http
DELETE /api/billing/subscription/sub_123?immediately=false HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Subscription canceled successfully",
  "data": {
    "id": "sub_123",
    "status": "active",
    "cancel_at_period_end": true,
    "current_period_end": "2025-02-01T00:00:00Z"
  }
}
```

**Cancellation Modes**:
- `immediately=false`: Cancel at period end (keeps access until end date)
- `immediately=true`: Cancel immediately (access revoked now)

---

### POST /api/billing/subscription/:id/reactivate

Reactivate a subscription scheduled for cancellation.

**Authentication**: Required

**Request**:
```http
POST /api/billing/subscription/sub_123/reactivate HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "sub_123",
    "status": "active",
    "cancel_at_period_end": false,
    "updated_at": "2025-01-15T00:00:00Z"
  }
}
```

**Note**: Only works for subscriptions with `cancel_at_period_end: true` that haven't ended yet.

---

## Usage Tracking

### GET /api/billing/usage

Get current billing period usage and limits.

**Authentication**: Required

**Request**:
```http
GET /api/billing/usage HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "current": {
      "storage_gb": 2.5,
      "api_requests": 1250,
      "pdf_overlays": 45
    },
    "limits": {
      "storage_gb": 10,
      "api_requests_per_month": 10000,
      "pdf_overlays_per_month": 100
    },
    "usage_percentages": {
      "storage": 25.0,
      "api_requests": 12.5,
      "pdf_overlays": 45.0
    },
    "period": {
      "start": "2025-01-01T00:00:00Z",
      "end": "2025-02-01T00:00:00Z"
    },
    "warnings": [
      {
        "type": "approaching_limit",
        "resource": "pdf_overlays",
        "message": "You've used 45% of your PDF overlay limit"
      }
    ]
  }
}
```

**Usage Warning Thresholds**:
- 50% used: Info notification
- 75% used: Warning notification
- 90% used: Critical warning
- 100% used: Limit exceeded (usage blocked or overage charged)

---

## Invoices

### GET /api/billing/invoices

Get list of customer invoices.

**Authentication**: Required

**Query Parameters**:
- `limit` (optional): Number of invoices to return (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by status (`paid`, `open`, `void`, `uncollectible`)

**Request**:
```http
GET /api/billing/invoices?limit=10&status=paid HTTP/1.1
Host: api.overlayapp.com
Authorization: Bearer <token>
```

**Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "inv_123e4567-e89b-12d3-a456-426614174000",
      "customer_id": "cus_123",
      "subscription_id": "sub_123",
      "stripe_invoice_id": "in_1234567890abcdef",
      "stripe_payment_intent_id": "pi_1234567890abcdef",
      "invoice_number": "INV-0001",
      "status": "paid",
      "subtotal_cents": 990,
      "tax_cents": 0,
      "discount_cents": 0,
      "total_cents": 990,
      "amount_paid_cents": 990,
      "amount_due_cents": 0,
      "currency": "USD",
      "invoice_date": "2025-01-01",
      "due_date": "2025-01-08",
      "paid_at": "2025-01-02T10:30:00Z",
      "period_start": "2025-01-01T00:00:00Z",
      "period_end": "2025-02-01T00:00:00Z",
      "payment_method": "card",
      "invoice_pdf_url": "https://invoice.stripe.com/i/acct_1234/inv_123.pdf",
      "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1234/inv_123",
      "line_items": [
        {
          "description": "Starter Plan - Monthly",
          "quantity": 1,
          "unit_amount_cents": 990,
          "amount_cents": 990,
          "item_type": "subscription",
          "period_start": "2025-01-01T00:00:00Z",
          "period_end": "2025-02-01T00:00:00Z"
        }
      ],
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 24,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

**Invoice Statuses**:
- `draft`: Not finalized
- `open`: Awaiting payment
- `paid`: Successfully paid
- `void`: Canceled invoice
- `uncollectible`: Marked as uncollectible after failed collection

---

## Webhooks

### POST /api/billing/webhooks/stripe

Endpoint for receiving Stripe webhook events.

**Authentication**: Stripe signature verification (not Bearer token)

**Headers**:
- `stripe-signature`: Webhook signature for verification

**Request**:
```http
POST /api/billing/webhooks/stripe HTTP/1.1
Host: api.overlayapp.com
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=abc123...

{
  "id": "evt_1234567890abcdef",
  "object": "event",
  "type": "customer.subscription.created",
  "data": {
    "object": {
      ...
    }
  }
}
```

**Response**: `200 OK`
```json
{
  "received": true
}
```

**Supported Webhook Events**:

**Customer Events**:
- `customer.created`: New customer created
- `customer.updated`: Customer details updated
- `customer.deleted`: Customer deleted

**Subscription Events**:
- `customer.subscription.created`: New subscription
- `customer.subscription.updated`: Subscription modified
- `customer.subscription.deleted`: Subscription ended
- `customer.subscription.trial_will_end`: Trial ending soon (3 days)

**Invoice Events**:
- `invoice.created`: New invoice created
- `invoice.finalized`: Invoice finalized and ready
- `invoice.paid`: Invoice successfully paid
- `invoice.payment_failed`: Payment failed

**Payment Events**:
- `payment_intent.succeeded`: Payment successful
- `payment_intent.payment_failed`: Payment failed
- `payment_method.attached`: Payment method added
- `payment_method.detached`: Payment method removed

**Webhook Security**:
1. Verify signature using Stripe webhook secret
2. Check event ID hasn't been processed before
3. Process event asynchronously
4. Return 200 immediately to acknowledge receipt
5. Log all webhook events for debugging

**Setup Instructions**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapi.com/api/billing/webhooks/stripe`
3. Select events or choose "Select all events"
4. Copy webhook signing secret
5. Add to environment as `STRIPE_WEBHOOK_SECRET`

---

## Enterprise Features

### Custom Pricing

Enterprise customers can have custom pricing with volume discounts and custom limits.

**Volume Discount Structure**:
```json
{
  "customer_id": "ent_123",
  "base_price_cents": 50000,
  "billing_cycle": "annual",
  "custom_limits": {
    "storage_gb": 5000,
    "api_requests_per_month": 10000000,
    "pdf_overlays_per_month": 100000,
    "team_members_limit": 200
  },
  "volume_discount_rules": [
    {
      "threshold": 1000,
      "discount_percent": 10,
      "applies_to": "pdf_overlays"
    },
    {
      "threshold": 5000,
      "discount_percent": 15,
      "applies_to": "pdf_overlays"
    },
    {
      "threshold": 10000,
      "discount_percent": 20,
      "applies_to": "pdf_overlays"
    }
  ],
  "contract_start_date": "2025-01-01",
  "contract_end_date": "2026-01-01",
  "auto_renew": true,
  "support_level": "dedicated"
}
```

### Multi-Tenant Cost Allocation

Enterprise customers can split costs across multiple tenants based on usage.

**Example Response**:
```json
{
  "billing_period": {
    "start": "2025-01-01",
    "end": "2025-02-01"
  },
  "total_amount_cents": 100000,
  "tenant_allocations": [
    {
      "tenant_id": "tenant-1",
      "tenant_name": "Engineering Team",
      "amount_cents": 40000,
      "percentage": 40.0,
      "breakdown": {
        "storage_gb": 15000,
        "storage_usage": 150,
        "api_requests": 20000,
        "api_requests_count": 400000,
        "pdf_overlays": 5000,
        "pdf_overlays_count": 500
      }
    },
    {
      "tenant_id": "tenant-2",
      "tenant_name": "Marketing Team",
      "amount_cents": 60000,
      "percentage": 60.0,
      "breakdown": {
        "storage_gb": 25000,
        "storage_usage": 250,
        "api_requests": 30000,
        "api_requests_count": 600000,
        "pdf_overlays": 5000,
        "pdf_overlays_count": 500
      }
    }
  ]
}
```

---

## Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is invalid or malformed",
    "details": {
      "field": "pricing_plan_id",
      "reason": "Plan ID must be a valid UUID"
    }
  },
  "request_id": "req_1234567890abcdef"
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate)
- `422 Unprocessable Entity`: Validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Temporary service outage

### Error Codes

- `INVALID_REQUEST`: Malformed request
- `AUTHENTICATION_REQUIRED`: No auth token provided
- `INVALID_TOKEN`: Token is invalid or expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Request validation failed
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `SUBSCRIPTION_ERROR`: Subscription operation failed
- `PAYMENT_ERROR`: Payment processing failed
- `STRIPE_ERROR`: Stripe API error
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

---

## Rate Limiting

### Rate Limit Policy

**Default Limits**:
- **Authenticated requests**: 100 requests per 15 minutes per user
- **Unauthenticated requests**: 20 requests per 15 minutes per IP
- **Webhook endpoints**: Unlimited (verified by signature)

**Plan-Based Limits**:
- **Starter**: 100 req/15min
- **Professional**: 1000 req/15min
- **Enterprise**: 10000 req/15min (customizable)

### Rate Limit Headers

Every API response includes rate limit headers:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1672531200
X-RateLimit-Policy: user-based
```

**Header Descriptions**:
- `X-RateLimit-Limit`: Maximum requests allowed in the window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when the limit resets
- `X-RateLimit-Policy`: Type of rate limiting applied (`user-based`, `ip-based`)

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "You have exceeded the rate limit. Please try again later.",
    "retry_after": 300
  }
}
```

**HTTP Status**: `429 Too Many Requests`

**Retry-After Header**: Seconds until limit resets

---

## API Versioning

### Current Version

- **API Version**: v1
- **Release Date**: 2025-01-01
- **Status**: Stable

### Version Strategy

API versions are managed through URL path:

- `https://api.overlayapp.com/v1/billing/...` (Current)
- `https://api.overlayapp.com/v2/billing/...` (Future)

### Deprecation Policy

- Minimum 6 months notice before deprecation
- Backward compatibility maintained during transition
- Deprecation warnings in response headers

---

## Best Practices

### 1. Authentication

✅ **Do**:
- Always use HTTPS
- Store tokens securely (never in localStorage)
- Refresh tokens before expiration
- Implement token rotation

❌ **Don't**:
- Include tokens in URL parameters
- Log tokens or sensitive data
- Share tokens between users
- Use tokens beyond their expiration

### 2. Error Handling

✅ **Do**:
- Check `success` field in all responses
- Handle all HTTP status codes
- Implement exponential backoff for retries
- Log errors with request IDs

❌ **Don't**:
- Assume success without checking
- Retry immediately after errors
- Ignore rate limit headers
- Expose error details to users

### 3. Webhooks

✅ **Do**:
- Verify webhook signatures
- Return 200 immediately
- Process events asynchronously
- Implement idempotency checks
- Log all webhook events

❌ **Don't**:
- Perform long operations synchronously
- Ignore duplicate events
- Skip signature verification
- Return errors for invalid events (return 200 and log)

### 4. Performance

✅ **Do**:
- Cache pricing plans (rarely change)
- Use pagination for large lists
- Implement request deduplication
- Monitor API usage patterns

❌ **Don't**:
- Fetch pricing plans on every page load
- Request large datasets without pagination
- Make redundant API calls
- Ignore performance metrics

---

## Support & Resources

### Documentation

- **API Reference**: https://docs.overlayapp.com/api
- **Integration Guide**: https://docs.overlayapp.com/integration
- **SDKs**: https://docs.overlayapp.com/sdks
- **Changelog**: https://docs.overlayapp.com/changelog

### Support Channels

- **Email**: api-support@overlayapp.com
- **Discord**: https://discord.gg/overlayapp
- **Status Page**: https://status.overlayapp.com
- **GitHub**: https://github.com/overlayapp

### Service Level Agreement (SLA)

- **Uptime**: 99.9% (excluding scheduled maintenance)
- **Response Time**: p95 < 500ms
- **Support Response**:
  - Enterprise: < 1 hour
  - Professional: < 4 hours
  - Starter: < 24 hours

---

**Last Updated**: 2025-10-01
**API Version**: 1.0.0
**Document Version**: 1.0
