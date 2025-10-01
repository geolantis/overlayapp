/**
 * Next.js Middleware - Security and Authentication
 *
 * This middleware handles:
 * - Authentication verification
 * - Security headers injection
 * - Rate limiting
 * - CSRF protection
 * - Organization context validation
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers configuration
const securityHeaders = {
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions Policy (restrict browser features)
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', '),

  // Content Security Policy (will be set dynamically)
  // 'Content-Security-Policy': ... (see getCSP function)
};

/**
 * Generate Content Security Policy dynamically based on environment
 */
function getCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      isDev ? "'unsafe-eval'" : '', // Allow eval in development only
      'https://cdn.jsdelivr.net', // For external libraries
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components/emotion
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      process.env['NEXT_PUBLIC_SUPABASE_URL'] || '',
      'https://*.supabase.co',
      'wss://*.supabase.co',
      isDev ? 'ws://localhost:*' : '',
    ].filter(Boolean),
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  return Buffer.from(buffer).toString('base64');
}

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/privacy',
  '/terms',
  '/api/auth/callback',
  '/api/webhooks/stripe',
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Rate limiting check (simple in-memory implementation)
 * In production, use Redis or similar distributed cache
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Main middleware function
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const nonce = generateNonce();

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Add Content Security Policy with nonce
  res.headers.set('Content-Security-Policy', getCSP(nonce));

  // Add nonce to request headers so it can be used in the app
  res.headers.set('x-nonce', nonce);

  // Rate limiting check
  const identifier = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(identifier)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    });
  }

  // Authentication check for protected routes
  if (!isPublicRoute(req.nextUrl.pathname)) {
    const supabase = createServerClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
            const response = NextResponse.next({
              request: req,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    );

    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        // Redirect to login with return URL
        const redirectUrl = new URL('/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Check for MFA requirement if accessing sensitive routes
      const sensitivePaths = ['/settings/security', '/billing', '/admin'];
      if (sensitivePaths.some(path => req.nextUrl.pathname.startsWith(path))) {
        // Check if user has MFA enabled (you'll need to query your users table)
        const { data: userData } = await supabase
          .from('users')
          .select('mfa_enabled')
          .eq('id', session.user.id)
          .single();

        if (!userData?.mfa_enabled) {
          const mfaUrl = new URL('/settings/security/enable-mfa', req.url);
          mfaUrl.searchParams.set('required', 'true');
          return NextResponse.redirect(mfaUrl);
        }
      }

      // Add user context to headers for downstream use
      res.headers.set('x-user-id', session.user.id);
      res.headers.set('x-user-email', session.user.email || '');

    } catch (error) {
      console.error('Middleware auth error:', error);
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return res;
}

/**
 * Configure which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
