/**
 * Email Configuration
 * Centralized email settings and environment configuration
 */

export const emailConfig = {
  // App information
  appName: 'OverlayApp',

  // Production URL (Vercel deployment)
  productionUrl: 'https://overlayapp-payment-lzp70tpls-geolantis-projects.vercel.app',

  // Get the appropriate app URL based on environment
  getAppUrl: (): string => {
    // Use environment variable if available
    if (process.env['NEXT_PUBLIC_APP_URL']) {
      return process.env['NEXT_PUBLIC_APP_URL'];
    }

    // Check if running on Vercel
    if (process.env['VERCEL_URL']) {
      return `https://${process.env['VERCEL_URL']}`;
    }

    // Default to production URL
    return emailConfig.productionUrl;
  },

  // SMTP configuration (from environment variables)
  smtp: {
    host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port: parseInt(process.env['SMTP_PORT'] || '587', 10),
    user: process.env['SMTP_USER'] || '',
    password: process.env['SMTP_PASSWORD'] || '',
    secure: process.env['SMTP_SECURE'] === 'true',
  },

  // Email defaults
  from: {
    name: process.env['EMAIL_FROM_NAME'] || 'OverlayApp',
    email: process.env['EMAIL_FROM_ADDRESS'] || 'noreply@overlayapp.com',
  },

  // Support email
  support: {
    name: 'OverlayApp Support',
    email: process.env['SUPPORT_EMAIL'] || 'support@overlayapp.com',
  },

  // Email expiration times (in milliseconds)
  expiration: {
    verification: 24 * 60 * 60 * 1000, // 24 hours
    passwordReset: 1 * 60 * 60 * 1000, // 1 hour
    invitation: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Template paths
  templates: {
    verification: 'verification-email.html',
    passwordReset: 'password-reset-email.html',
    teamInvitation: 'team-invitation-email.html',
    welcome: 'welcome-email.html',
  },

  // Rate limiting for emails
  rateLimit: {
    maxPerHour: 10, // Max emails per user per hour
    maxPerDay: 50, // Max emails per user per day
  },
} as const;

/**
 * Validate email configuration
 * @throws Error if required configuration is missing
 */
export function validateEmailConfig(): void {
  const errors: string[] = [];

  // Check SMTP configuration in production
  if (process.env['NODE_ENV'] === 'production') {
    if (!emailConfig.smtp.user) {
      errors.push('SMTP_USER is required in production');
    }
    if (!emailConfig.smtp.password) {
      errors.push('SMTP_PASSWORD is required in production');
    }
  }

  // Throw if there are errors
  if (errors.length > 0) {
    throw new Error(`Email configuration errors:\n${errors.join('\n')}`);
  }
}

/**
 * Get email sender information
 */
export function getEmailSender(type: 'default' | 'support' = 'default') {
  const sender = type === 'support' ? emailConfig.support : emailConfig.from;
  return `${sender.name} <${sender.email}>`;
}

/**
 * Build email URL with proper protocol and domain
 */
export function buildEmailUrl(path: string, params?: Record<string, string>): string {
  const baseUrl = emailConfig.getAppUrl();
  const url = new URL(path, baseUrl);

  // Add query parameters if provided
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url.toString();
}

/**
 * Check if email is in development mode
 */
export function isEmailDevMode(): boolean {
  return process.env['NODE_ENV'] === 'development';
}

/**
 * Get current year for email footers
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}
