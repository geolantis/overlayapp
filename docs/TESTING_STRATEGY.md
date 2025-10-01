# Testing Strategy - OverlayApp Payment System

## Overview

This document outlines the comprehensive testing strategy for the OverlayApp payment and subscription management system. Our approach follows industry best practices with a focus on reliability, maintainability, and comprehensive coverage.

## Testing Philosophy

### Core Principles

1. **Test First**: Write tests before or alongside implementation (TDD approach)
2. **Comprehensive Coverage**: Target 80%+ code coverage across all metrics
3. **Fast Feedback**: Unit tests run in <100ms, full suite in <5 minutes
4. **Isolated Tests**: No dependencies between tests, can run in any order
5. **Realistic Data**: Use factories and fixtures for consistent test data

### Test Pyramid

```
       /\       E2E Tests (5%)
      /  \      - Critical user flows
     /    \     - Payment workflows
    /------\
   /        \   Integration Tests (25%)
  /          \  - API endpoints
 /            \ - Service interactions
/--------------\
    Unit Tests (70%)
    - Business logic
    - Service methods
    - Utility functions
```

## Test Categories

### 1. Unit Tests (`tests/unit/`)

**Purpose**: Test individual functions and methods in isolation

**Coverage Areas**:
- Service classes (Stripe, Subscription, Usage, Webhook)
- Utility functions (logger, validators)
- Type definitions and interfaces
- Business logic and calculations

**Key Files**:
- `stripe.service.test.ts` - Stripe API interactions
- `subscription.service.test.ts` - Subscription lifecycle
- `webhook.service.test.ts` - Webhook event handling
- `usage.service.test.ts` - Usage tracking and metering
- `payment-retry.service.test.ts` - Payment retry logic
- `analytics.service.test.ts` - Revenue analytics
- `enterprise.service.test.ts` - Enterprise pricing

**Example Test Structure**:
```typescript
describe('StripeService', () => {
  describe('createCustomer', () => {
    it('should create customer with valid params', async () => {
      // Arrange
      const params = { email: 'test@example.com', userId: 'user_123' };

      // Act
      const result = await stripeService.createCustomer(params);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(params.email);
    });

    it('should handle errors gracefully', async () => {
      // Test error scenarios
    });
  });
});
```

### 2. Integration Tests (`tests/integration/`)

**Purpose**: Test API endpoints and service interactions

**Coverage Areas**:
- REST API endpoints
- Database operations
- External service integration
- Authentication and authorization
- Request/response validation

**Key Files**:
- `billing.controller.test.ts` - Billing API endpoints
- `subscription-workflow.test.ts` - Complete subscription flows
- `webhook-integration.test.ts` - Webhook processing
- `payment-flow.test.ts` - End-to-end payment scenarios

**Example Test Structure**:
```typescript
describe('POST /api/billing/checkout', () => {
  it('should create checkout session with valid params', async () => {
    const response = await request(app)
      .post('/api/billing/checkout')
      .send({
        pricing_plan_id: 'plan_starter',
        billing_cycle: 'monthly',
        success_url: 'https://app.com/success',
        cancel_url: 'https://app.com/cancel',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('sessionId');
  });
});
```

### 3. End-to-End Tests (`tests/e2e/`)

**Purpose**: Test critical user journeys from start to finish

**Coverage Areas**:
- New subscription signup
- Plan upgrades/downgrades
- Payment method updates
- Subscription cancellation
- Invoice generation and payment

**Example Scenarios**:
1. New user signs up for Starter plan with trial
2. User upgrades from Starter to Pro plan
3. Payment fails and retry mechanism activates
4. User cancels subscription at period end
5. User reactivates canceled subscription

## Test Utilities

### Mocks (`tests/utils/mocks.ts`)

Provides mock implementations for:
- Stripe API client
- Supabase database client
- Logger
- Express request/response objects

### Factories (`tests/utils/factories.ts`)

Generates realistic test data:
- `mockCustomer()` - Customer entities
- `mockSubscription()` - Subscription entities
- `mockInvoice()` - Invoice entities
- `mockUsageRecord()` - Usage records
- `mockStripeCustomer()` - Stripe customer objects
- `mockStripeSubscription()` - Stripe subscription objects

### Fixtures (`tests/utils/fixtures.ts`)

Common test scenarios and data:
- Pricing tiers (Free, Starter, Pro, Enterprise)
- Test users with different roles
- Discount codes
- Usage scenarios (low, medium, high, over-limit)
- Payment methods (valid, expired, declined)
- Invoice states
- Error scenarios

## Coverage Requirements

### Minimum Thresholds

```javascript
{
  global: {
    branches: 75,    // 75% branch coverage
    functions: 80,   // 80% function coverage
    lines: 80,       // 80% line coverage
    statements: 80   // 80% statement coverage
  }
}
```

### Critical Paths (100% Coverage Required)

- Payment processing logic
- Subscription state transitions
- Usage limit enforcement
- Webhook event handling
- Security and authentication
- Data validation and sanitization

## Running Tests

### Local Development

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- stripe.service.test.ts

# Run integration tests only
npm test -- --testMatch='**/tests/integration/**/*.test.ts'

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

### CI/CD Pipeline

Tests run automatically on:
- Every push to `main` or `develop`
- All pull requests
- Pre-deployment validation

**Pipeline Stages**:
1. Lint and type checking
2. Unit tests (parallel across Node 18.x, 20.x)
3. Integration tests (with PostgreSQL and Redis)
4. Security audit
5. Coverage upload to Codecov

## Best Practices

### Do's ✅

- **Write descriptive test names** that explain what is being tested
- **Use AAA pattern** (Arrange, Act, Assert)
- **Mock external dependencies** (Stripe, Supabase, etc.)
- **Test edge cases** and error scenarios
- **Keep tests focused** - one assertion per test when possible
- **Use factories** for test data generation
- **Reset mocks** between tests
- **Test async code** properly with async/await

### Don'ts ❌

- **Don't test implementation details** - test behavior
- **Don't share state** between tests
- **Don't use real API keys** or production data
- **Don't skip flaky tests** - fix them
- **Don't write slow tests** - mock expensive operations
- **Don't test third-party libraries** - assume they work
- **Don't commit commented-out tests**

## Test Data Management

### Database Fixtures

For integration tests requiring database state:
- Use in-memory SQLite for fast tests
- Seed minimal required data
- Clean up after each test
- Use transactions for isolation

### Stripe Test Data

Use Stripe test mode with special test cards:
- `4242424242424242` - Successful payment
- `4000000000000002` - Card declined
- `4000000000009995` - Insufficient funds
- `4000000000000069` - Expired card

## Performance Benchmarks

### Target Execution Times

- Unit test: <100ms each
- Integration test: <500ms each
- E2E test: <5s each
- Full test suite: <5 minutes

### Optimization Strategies

1. **Parallel execution** - Run tests concurrently
2. **Selective testing** - Run affected tests only
3. **Mock expensive operations** - Database, API calls
4. **Cache test data** - Reuse fixtures when possible
5. **Optimize setup/teardown** - Use beforeAll when safe

## Security Testing

### Areas Covered

1. **Input Validation**
   - SQL injection prevention
   - XSS attack prevention
   - Command injection prevention

2. **Authentication**
   - JWT token validation
   - Session management
   - Role-based access control

3. **Payment Security**
   - PCI compliance
   - Secure webhook handling
   - Sensitive data encryption

4. **API Security**
   - Rate limiting
   - CORS configuration
   - Request size limits

## Continuous Improvement

### Metrics Tracking

Monitor these metrics over time:
- Test coverage percentage
- Test execution time
- Flaky test rate
- Bug escape rate (bugs found in production)
- Time to fix failed tests

### Review Process

- Review test coverage in code reviews
- Update tests when requirements change
- Refactor tests with production code
- Remove obsolete tests
- Add tests for reported bugs

## Troubleshooting

### Common Issues

**Tests timeout**:
- Increase jest timeout: `jest.setTimeout(10000)`
- Check for unresolved promises
- Verify mock implementations

**Flaky tests**:
- Check for race conditions
- Ensure proper cleanup
- Avoid time-dependent tests
- Use deterministic test data

**Coverage not meeting threshold**:
- Identify uncovered lines: `npm run test:coverage`
- Add missing test cases
- Consider if code is testable

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

### Tools
- Jest - Test framework
- ts-jest - TypeScript support
- Supertest - HTTP assertion library
- codecov - Coverage reporting

## Conclusion

This testing strategy ensures high-quality, reliable code through comprehensive test coverage, automated testing, and continuous improvement. All developers should follow these guidelines and contribute to maintaining high testing standards.

**Last Updated**: 2025-10-01
**Maintained By**: Testing Engineering Team
