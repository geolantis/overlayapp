/**
 * Jest Test Setup
 * Global test configuration and environment setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Mock console methods in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid UUID`
        : `Expected ${received} to be a valid UUID`,
    };
  },

  toBeValidISODate(received: string) {
    const date = new Date(received);
    const pass = !isNaN(date.getTime()) && received === date.toISOString();

    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid ISO date`
        : `Expected ${received} to be a valid ISO date`,
    };
  },
});

// Declare custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toBeValidISODate(): R;
    }
  }
}

// Global test timeout
jest.setTimeout(10000);
