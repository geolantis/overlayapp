import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
  typescript: true,
  appInfo: {
    name: 'OverlayApp Payment System',
    version: '1.0.0',
  },
});

// Stripe configuration
export const stripeConfig = {
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',

  // Payment method types to accept
  paymentMethodTypes: [
    'card',
    'sepa_debit',
    'us_bank_account',
  ] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],

  // Supported currencies
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'] as const,

  // Trial configuration
  defaultTrialDays: parseInt(process.env.TRIAL_DURATION_DAYS || '14', 10),

  // Billing configuration
  billingCycleAnchor: 'now' as const,
  prorationBehavior: 'create_prorations' as const,
  collectionMethod: 'charge_automatically' as const,

  // Invoice settings
  daysUntilDue: 7,
  automaticTax: {
    enabled: true,
  },

  // Retry configuration for failed payments
  retryConfiguration: {
    maxAttempts: 3,
    retrySchedule: [1, 3, 5], // days
  },
};

// Feature flags
export const featureFlags = {
  enableAnnualBilling: process.env.ENABLE_ANNUAL_BILLING === 'true',
  enableUsageBasedBilling: process.env.ENABLE_USAGE_BASED_BILLING === 'true',
  enableEnterpriseFeatures: process.env.ENABLE_ENTERPRISE_FEATURES === 'true',
};

export default stripe;
