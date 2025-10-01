# Payment System API Documentation

## Overview

This API provides comprehensive subscription and billing management for SaaS applications, powered by Stripe and Supabase.

**Base URL**: `http://localhost:3000/api`

**Authentication**: Bearer token in `Authorization` header (except webhooks and public endpoints)

## Table of Contents

- [Pricing Plans](#pricing-plans)
- [Checkout & Subscriptions](#checkout--subscriptions)
- [Subscription Management](#subscription-management)
- [Usage Tracking](#usage-tracking)
- [Invoices](#invoices)
- [Webhooks](#webhooks)
- [Enterprise Features](#enterprise-features)

---

## Pricing Plans

### Get All Pricing Plans

Get list of available pricing plans.

**Endpoint**: `GET /billing/plans`

**Authentication**: Not required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
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
        "Email Support"
      ]
    }
  ]
}
```

---

## Checkout & Subscriptions

### Create Checkout Session

Create a Stripe Checkout session for new subscription.

**Endpoint**: `POST /billing/checkout`

**Authentication**: Required

**Request Body**:
```json
{
  "pricing_plan_id": "uuid",
  "billing_cycle": "monthly",
  "success_url": "https://yourapp.com/success",
  "cancel_url": "https://yourapp.com/cancel",
  "discount_code": "PROMO20"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### Create Billing Portal Session

Create a Stripe billing portal session for subscription management.

**Endpoint**: `POST /billing/portal`

**Authentication**: Required

**Request Body**:
```json
{
  "return_url": "https://yourapp.com/dashboard"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/..."
  }
}
```

---

## Subscription Management

### Get Current Subscription

Get the user's active subscription.

**Endpoint**: `GET /billing/subscription`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    "billing_cycle": "monthly",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "cancel_at_period_end": false,
    "amount_cents": 990,
    "currency": "USD",
    "plan": {
      "name": "starter",
      "display_name": "Starter",
      "features": [...]
    }
  }
}
```

### Update Subscription

Upgrade, downgrade, or modify subscription.

**Endpoint**: `PUT /billing/subscription/:id`

**Authentication**: Required

**Request Body**:
```json
{
  "pricing_plan_id": "uuid",
  "billing_cycle": "annual",
  "cancel_at_period_end": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "active",
    ...
  }
}
```

### Cancel Subscription

Cancel subscription (at period end or immediately).

**Endpoint**: `DELETE /billing/subscription/:id?immediately=false`

**Authentication**: Required

**Query Parameters**:
- `immediately`: Boolean (optional, default: false)

**Response**:
```json
{
  "success": true,
  "message": "Subscription canceled successfully"
}
```

### Reactivate Subscription

Reactivate a subscription scheduled for cancellation.

**Endpoint**: `POST /billing/subscription/:id/reactivate`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "cancel_at_period_end": false,
    ...
  }
}
```

---

## Usage Tracking

### Get Current Usage

Get current billing period usage and limits.

**Endpoint**: `GET /billing/usage`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "current": {
      "storage": 2.5,
      "api_requests": 1250,
      "pdf_overlays": 45
    },
    "limits": {
      "storage_gb": 10,
      "api_requests_per_month": 10000,
      "pdf_overlays_per_month": 100
    },
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-02-01T00:00:00Z"
    }
  }
}
```

---

## Invoices

### Get Customer Invoices

Get list of customer invoices.

**Endpoint**: `GET /billing/invoices`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "invoice_number": "INV-001",
      "status": "paid",
      "total_cents": 990,
      "currency": "USD",
      "invoice_date": "2024-01-01",
      "due_date": "2024-01-08",
      "paid_at": "2024-01-02T10:30:00Z",
      "invoice_pdf_url": "https://...",
      "hosted_invoice_url": "https://..."
    }
  ]
}
```

---

## Webhooks

### Stripe Webhook Handler

Endpoint for receiving Stripe webhook events.

**Endpoint**: `POST /billing/webhooks/stripe`

**Authentication**: Not required (uses Stripe signature verification)

**Headers**:
- `stripe-signature`: Stripe webhook signature

**Request Body**: Raw Stripe event JSON

**Supported Events**:
- `customer.created`
- `customer.updated`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `customer.subscription.trial_will_end`
- `invoice.created`
- `invoice.finalized`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_method.attached`
- `payment_method.detached`

**Response**:
```json
{
  "received": true
}
```

---

## Enterprise Features

### Custom Pricing

Enterprise customers can have custom pricing with volume discounts.

**Volume Discount Example**:
```json
{
  "base_price_cents": 50000,
  "volume_discount_rules": [
    { "threshold": 1000, "discount_percent": 10 },
    { "threshold": 5000, "discount_percent": 15 },
    { "threshold": 10000, "discount_percent": 20 }
  ]
}
```

### Multi-Tenant Billing

Split costs across multiple tenants based on usage.

**Cost Allocation Example**:
```json
{
  "totalAmount": 100000,
  "tenantAllocations": [
    {
      "tenantId": "tenant-1",
      "amount": 40000,
      "breakdown": {
        "storage": 15000,
        "apiRequests": 20000,
        "pdfOverlays": 5000
      }
    },
    {
      "tenantId": "tenant-2",
      "amount": 60000,
      "breakdown": {
        "storage": 25000,
        "apiRequests": 30000,
        "pdfOverlays": 5000
      }
    }
  ]
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

API is rate-limited to 100 requests per 15 minutes per IP address.

**Rate Limit Headers**:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Webhook Configuration

### Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapi.com/api/billing/webhooks/stripe`
3. Select events (or select all events)
4. Copy webhook signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`

### Testing Webhooks Locally

Use Stripe CLI for local testing:

```bash
stripe listen --forward-to localhost:3000/api/billing/webhooks/stripe
```

---

## Code Examples

### JavaScript/TypeScript

```typescript
// Create checkout session
const response = await fetch('http://localhost:3000/api/billing/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    pricing_plan_id: 'plan-uuid',
    billing_cycle: 'monthly',
    success_url: 'https://yourapp.com/success',
    cancel_url: 'https://yourapp.com/cancel'
  })
});

const data = await response.json();
// Redirect to data.data.url
```

### cURL

```bash
# Get pricing plans
curl http://localhost:3000/api/billing/plans

# Create checkout
curl -X POST http://localhost:3000/api/billing/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "pricing_plan_id": "plan-uuid",
    "billing_cycle": "monthly",
    "success_url": "https://yourapp.com/success",
    "cancel_url": "https://yourapp.com/cancel"
  }'

# Get current subscription
curl http://localhost:3000/api/billing/subscription \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Python

```python
import requests

# Get pricing plans
response = requests.get('http://localhost:3000/api/billing/plans')
plans = response.json()

# Create checkout
response = requests.post(
    'http://localhost:3000/api/billing/checkout',
    headers={
        'Authorization': 'Bearer YOUR_TOKEN',
        'Content-Type': 'application/json'
    },
    json={
        'pricing_plan_id': 'plan-uuid',
        'billing_cycle': 'monthly',
        'success_url': 'https://yourapp.com/success',
        'cancel_url': 'https://yourapp.com/cancel'
    }
)
checkout_data = response.json()
```

---

## Support

For issues or questions:
- Email: support@yourapp.com
- Documentation: https://docs.yourapp.com
- Status Page: https://status.yourapp.com
