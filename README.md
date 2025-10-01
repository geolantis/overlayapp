# SaaS Payment and Subscription System

A comprehensive, production-ready payment and subscription management system built with Stripe and Supabase for SaaS applications.

## Features

### Core Functionality

- **Multiple Pricing Tiers**: Starter, Professional, Enterprise
- **Flexible Billing**: Monthly and annual billing cycles
- **Usage-Based Billing**: Track storage, API calls, and PDF overlays
- **Trial Management**: Automatic 14-day trial period
- **Multi-Currency Support**: USD, EUR, GBP, AUD, CAD
- **Multi-Region Payment Methods**: Cards, SEPA, US Bank Accounts

### Subscription Management

- **Lifecycle Management**: Create, upgrade, downgrade, cancel subscriptions
- **Proration Handling**: Automatic proration for plan changes
- **Trial Periods**: Configurable trial duration
- **Cancellation Options**: Cancel immediately or at period end
- **Reactivation**: Restore canceled subscriptions
- **Change History**: Complete audit trail of subscription changes

### Payment Processing

- **Stripe Integration**: Full Stripe Checkout and Billing Portal
- **Webhook Handling**: Real-time event processing
- **Payment Retry Logic**: Automatic retry with exponential backoff
- **Dunning Management**: Handle failed payments gracefully
- **Invoice Generation**: Automatic invoice creation and PDF generation
- **Multiple Payment Methods**: Store and manage customer payment methods

### Usage Tracking

- **Real-Time Metering**: Track usage as it happens
- **Usage Limits**: Enforce plan-based limits
- **Overage Handling**: Track and bill for usage overages
- **Historical Data**: Complete usage history and analytics
- **Aggregated Reports**: Daily, weekly, monthly usage summaries

### Analytics & Reporting

- **Revenue Metrics**: MRR, ARR, total revenue
- **Customer Metrics**: Active customers, churn rate, LTV
- **Subscription Metrics**: New, active, canceled subscriptions
- **Usage Analytics**: Storage, API calls, PDF overlays by period
- **Plan Distribution**: Customer distribution across plans
- **Churn Analysis**: Detailed churn tracking and reasons

### Enterprise Features

- **Custom Pricing**: Tailored pricing for enterprise customers
- **Volume Discounts**: Automatic discounts based on usage thresholds
- **Multi-Tenant Billing**: Split costs across multiple tenants
- **Contract Management**: Contract start/end dates, auto-renewal
- **Dedicated Support Levels**: Enterprise, Premium, Dedicated tiers
- **Custom Invoicing**: Generate custom invoices with line items

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (via Supabase)
- **Payment Provider**: Stripe
- **Job Queue**: Bull (Redis)
- **Logging**: Winston
- **Testing**: Jest

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Supabase account
- Stripe account
- Redis (for job queues)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd OverlayApp

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure .env with your keys
nano .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

### Configuration

1. **Supabase Setup**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy project URL and keys to `.env`
   - Run SQL schema from `database/schemas/billing_schema.sql`

2. **Stripe Setup**
   - Create products and prices in Stripe Dashboard
   - Configure webhook endpoint
   - Copy API keys and webhook secret to `.env`

3. **Redis Setup**
   - Install Redis locally or use cloud provider
   - Update `REDIS_URL` in `.env`

See [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) for detailed setup instructions.

## API Documentation

### Endpoints

- `GET /api/billing/plans` - Get pricing plans
- `POST /api/billing/checkout` - Create checkout session
- `POST /api/billing/portal` - Create billing portal session
- `GET /api/billing/subscription` - Get current subscription
- `PUT /api/billing/subscription/:id` - Update subscription
- `DELETE /api/billing/subscription/:id` - Cancel subscription
- `POST /api/billing/subscription/:id/reactivate` - Reactivate subscription
- `GET /api/billing/usage` - Get current usage
- `GET /api/billing/invoices` - Get customer invoices
- `POST /api/billing/webhooks/stripe` - Stripe webhook handler

See [API Documentation](docs/API_DOCUMENTATION.md) for complete API reference.

## Usage Examples

### Create Checkout Session

```typescript
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

const { data } = await response.json();
// Redirect user to data.url
window.location.href = data.url;
```

### Track Usage

```typescript
import { usageService } from './services/usage.service';

// Track storage usage
await usageService.trackStorageUsage({
  userId: 'user-123',
  storageBytes: 1024 * 1024 * 500 // 500 MB
});

// Track API request
await usageService.trackAPIRequest({
  userId: 'user-123',
  endpoint: '/api/data'
});

// Track PDF overlay
await usageService.trackPDFOverlay({
  userId: 'user-123',
  pdfId: 'pdf-456'
});
```

### Check Usage Limits

```typescript
import { usageService } from './services/usage.service';

const limits = await usageService.checkUsageLimits('subscription-id');

if (limits.storage.exceeded) {
  throw new Error('Storage limit exceeded');
}

if (limits.api_requests.exceeded) {
  throw new Error('API request limit exceeded');
}
```

### Get Analytics

```typescript
import { analyticsService } from './services/analytics.service';

// Get dashboard metrics
const analytics = await analyticsService.getDashboardAnalytics(30);

console.log('MRR:', analytics.mrr);
console.log('ARR:', analytics.arr);
console.log('Churn Rate:', analytics.churn_rate);
console.log('LTV:', analytics.ltv);
```

## Project Structure

```
OverlayApp/
├── src/
│   ├── config/           # Configuration files
│   │   ├── stripe.config.ts
│   │   └── supabase.config.ts
│   ├── controllers/      # API controllers
│   │   └── billing.controller.ts
│   ├── services/         # Business logic
│   │   ├── stripe.service.ts
│   │   ├── subscription.service.ts
│   │   ├── usage.service.ts
│   │   ├── webhook.service.ts
│   │   ├── analytics.service.ts
│   │   ├── payment-retry.service.ts
│   │   └── enterprise.service.ts
│   ├── types/            # TypeScript types
│   │   └── billing.types.ts
│   ├── utils/            # Utility functions
│   │   └── logger.ts
│   └── index.ts          # Application entry point
├── database/
│   ├── schemas/          # Database schemas
│   │   └── billing_schema.sql
│   └── migrations/       # Database migrations
├── docs/                 # Documentation
│   ├── API_DOCUMENTATION.md
│   └── IMPLEMENTATION_GUIDE.md
├── tests/                # Test files
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
└── .env.example
```

## Database Schema

The system uses a comprehensive PostgreSQL schema with the following main tables:

- **pricing_plans**: Available subscription plans
- **customers**: Customer information and Stripe mapping
- **subscriptions**: Active and historical subscriptions
- **usage_records**: Usage tracking for metered billing
- **invoices**: Invoice records and payment status
- **invoice_line_items**: Detailed invoice line items
- **payment_methods**: Customer payment methods
- **subscription_changes**: Subscription change history
- **enterprise_pricing**: Custom enterprise pricing
- **discount_codes**: Promotional discount codes
- **revenue_analytics**: Aggregated analytics data

See [Database Schema](database/schemas/billing_schema.sql) for complete schema.

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- subscription.test.ts

# Watch mode
npm run test:watch
```

## Deployment

### Docker

```bash
# Build image
docker build -t payment-system .

# Run container
docker run -p 3000:3000 --env-file .env payment-system
```

### Cloud Platforms

- **Vercel**: Deploy with `vercel --prod`
- **AWS**: Deploy to EC2, ECS, or Lambda
- **Google Cloud**: Deploy to Cloud Run or App Engine
- **Heroku**: Deploy with `git push heroku main`

See [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md) for detailed deployment instructions.

## Monitoring

### Metrics

- Application health checks
- Request/response metrics
- Error rates and types
- Payment success/failure rates
- Webhook processing status
- Job queue statistics

### Logging

Structured JSON logging with Winston:

```typescript
logger.info('Subscription created', {
  subscriptionId: 'sub_xxx',
  customerId: 'cus_xxx',
  plan: 'professional'
});
```

### Analytics Dashboards

Access built-in analytics:

```typescript
// Daily aggregation
await analyticsService.aggregateAnalytics('daily', startDate, endDate);

// Get dashboard data
const analytics = await analyticsService.getDashboardAnalytics(30);
```

## Security

- **Environment Variables**: Never commit secrets to version control
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Webhook Verification**: Stripe signature validation
- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schema validation
- **Error Sanitization**: Safe error messages in production

## Performance

- **Database Indexes**: Optimized for common queries
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis caching for frequently accessed data
- **Job Queues**: Async processing for long-running tasks
- **Webhook Batching**: Efficient webhook event processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: GitHub Issues
- **Email**: support@example.com

## Roadmap

- [ ] Paddle integration (alternative to Stripe)
- [ ] PayPal support
- [ ] Cryptocurrency payments
- [ ] Advanced analytics dashboard UI
- [ ] Automated dunning email campaigns
- [ ] Multi-language support
- [ ] Advanced fraud detection
- [ ] Referral program tracking
- [ ] Gift subscriptions
- [ ] API usage quotas and throttling

## Credits

Built with:
- [Stripe](https://stripe.com) - Payment processing
- [Supabase](https://supabase.com) - Database and authentication
- [Express.js](https://expressjs.com) - Web framework
- [TypeScript](https://www.typescriptlang.org) - Type safety
- [Bull](https://github.com/OptimalBits/bull) - Job queues
- [Winston](https://github.com/winstonjs/winston) - Logging
