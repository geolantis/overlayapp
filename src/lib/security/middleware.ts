/**
 * Security Middleware for API Protection
 * Rate limiting, authentication, authorization, and threat detection
 */

import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface SecurityConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  rateLimiting?: RateLimitConfig;
  cors?: CORSConfig;
  encryption?: EncryptionConfig;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxAge?: number;
}

interface EncryptionConfig {
  algorithm: string;
  keyId: string;
}

interface AuthContext {
  user?: any;
  organization?: any;
  apiKey?: any;
  permissions: string[];
}

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================

export function securityHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // HSTS
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // XSS Protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.trusted.com",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.yourdomain.com wss://realtime.yourdomain.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ')
    );

    next();
  };
}

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

export function corsMiddleware(config: CORSConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    // Check if origin is allowed
    if (origin && config.allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      config.allowedMethods.join(', ')
    );

    res.setHeader(
      'Access-Control-Allow-Headers',
      config.allowedHeaders.join(', ')
    );

    if (config.maxAge) {
      res.setHeader('Access-Control-Max-Age', config.maxAge.toString());
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  };
}

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

class RateLimiter {
  private requests = new Map<string, number[]>();
  private violations = new Map<string, number>();

  constructor(private config: RateLimitConfig) {}

  async limit(identifier: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
  }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get request timestamps for this identifier
    let timestamps = this.requests.get(identifier) || [];

    // Remove old timestamps outside the window
    timestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    const allowed = timestamps.length < this.config.maxRequests;

    if (allowed) {
      timestamps.push(now);
      this.requests.set(identifier, timestamps);
    } else {
      // Record violation
      const violations = (this.violations.get(identifier) || 0) + 1;
      this.violations.set(identifier, violations);

      // Log to database if too many violations
      if (violations > 10) {
        await this.logRateLimitViolation(identifier);
      }
    }

    const resetAt = Math.min(...timestamps) + this.config.windowMs;
    const remaining = Math.max(0, this.config.maxRequests - timestamps.length);

    return {
      allowed,
      limit: this.config.maxRequests,
      remaining,
      resetAt
    };
  }

  private async logRateLimitViolation(identifier: string): Promise<void> {
    // Log to security_events table
    console.log('Rate limit violation:', identifier);
  }

  cleanup(): void {
    const now = Date.now();

    for (const [identifier, timestamps] of this.requests.entries()) {
      const windowStart = now - this.config.windowMs;
      const validTimestamps = timestamps.filter(ts => ts > windowStart);

      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
        this.violations.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }
}

export function rateLimitMiddleware(config: RateLimitConfig) {
  const limiter = new RateLimiter(config);

  // Cleanup every minute
  setInterval(() => limiter.cleanup(), 60000);

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = config.keyGenerator
      ? config.keyGenerator(req)
      : req.ip || 'unknown';

    const result = await limiter.limit(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', result.resetAt.toString());

    if (!result.allowed) {
      res.setHeader('Retry-After', Math.ceil((result.resetAt - Date.now()) / 1000).toString());

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        limit: result.limit,
        resetAt: new Date(result.resetAt).toISOString()
      });
    }

    next();
  };
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

export function authenticationMiddleware(supabase: SupabaseClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
      }

      const [type, token] = authHeader.split(' ');

      if (type === 'Bearer') {
        // JWT token authentication
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request
        (req as any).user = user;
        (req as any).authType = 'user';
      } else if (type === 'ApiKey') {
        // API key authentication
        const apiKeyHash = crypto.createHash('sha256').update(token).digest('hex');

        const { data: apiKey, error } = await supabase
          .from('api_keys')
          .select('*, organizations(*)')
          .eq('key_hash', apiKeyHash)
          .eq('status', 'active')
          .single();

        if (error || !apiKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }

        // Check expiration
        if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
          return res.status(401).json({ error: 'API key expired' });
        }

        // Check IP whitelist
        if (apiKey.ip_whitelist && apiKey.ip_whitelist.length > 0) {
          const clientIP = req.ip;
          if (!apiKey.ip_whitelist.includes(clientIP)) {
            await logSecurityEvent({
              type: 'SECURITY_IP_WHITELIST_VIOLATION',
              apiKeyId: apiKey.id,
              clientIP,
              severity: 'high'
            });

            return res.status(403).json({ error: 'IP not whitelisted' });
          }
        }

        // Update last used
        await supabase
          .from('api_keys')
          .update({
            last_used_at: new Date().toISOString(),
            last_used_ip: req.ip,
            usage_count: apiKey.usage_count + 1
          })
          .eq('id', apiKey.id);

        // Attach API key to request
        (req as any).apiKey = apiKey;
        (req as any).organization = apiKey.organizations;
        (req as any).authType = 'apiKey';
      } else {
        return res.status(401).json({ error: 'Invalid authentication type' });
      }

      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

// ============================================================================
// AUTHORIZATION MIDDLEWARE
// ============================================================================

export function requirePermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authContext = await getAuthContext(req);

    if (!authContext) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if user has required permissions
    const hasPermission = permissions.every(permission =>
      authContext.permissions.includes(permission) ||
      authContext.permissions.includes('*')
    );

    if (!hasPermission) {
      await logSecurityEvent({
        type: 'AUTHZ_ACCESS_DENIED',
        userId: authContext.user?.id,
        resource: req.path,
        requiredPermissions: permissions,
        userPermissions: authContext.permissions,
        severity: 'warning'
      });

      return res.status(403).json({
        error: 'Insufficient permissions',
        required: permissions
      });
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authContext = await getAuthContext(req);

    if (!authContext || !authContext.organization) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userRole = authContext.organization.role;

    if (!roles.includes(userRole) && userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Insufficient role',
        required: roles,
        current: userRole
      });
    }

    next();
  };
}

// ============================================================================
// ORGANIZATION CONTEXT MIDDLEWARE
// ============================================================================

export function organizationContextMiddleware(supabase: SupabaseClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const apiKey = (req as any).apiKey;

      // Get organization from header, query, or body
      const orgId =
        req.headers['x-organization-id'] ||
        req.query.organizationId ||
        (req.body && req.body.organizationId);

      let organization;

      if (apiKey) {
        // API key already has organization
        organization = (req as any).organization;
      } else if (user && orgId) {
        // Verify user belongs to organization
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('*, organizations(*)')
          .eq('user_id', user.id)
          .eq('organization_id', orgId)
          .single();

        if (!userOrg) {
          await logSecurityEvent({
            type: 'SECURITY_CROSS_TENANT_ATTEMPT',
            userId: user.id,
            requestedOrgId: orgId,
            severity: 'critical'
          });

          return res.status(403).json({ error: 'Access denied to organization' });
        }

        organization = userOrg.organizations;
        (req as any).userOrganization = userOrg;
      } else if (user) {
        // Get user's default organization
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('*, organizations(*)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (userOrg) {
          organization = userOrg.organizations;
          (req as any).userOrganization = userOrg;
        }
      }

      if (organization) {
        (req as any).organization = organization;
      }

      next();
    } catch (error) {
      console.error('Organization context error:', error);
      return res.status(500).json({ error: 'Failed to load organization context' });
    }
  };
}

// ============================================================================
// INPUT VALIDATION MIDDLEWARE
// ============================================================================

export function validateInput(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map((d: any) => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    req.body = value;
    next();
  };
}

// ============================================================================
// SQL INJECTION PROTECTION
// ============================================================================

export function sqlInjectionProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    const sqlPatterns = [
      /(\bUNION\b.*\bSELECT\b)/i,
      /(\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
      /(\bINSERT\b.*\bINTO\b.*\bVALUES\b)/i,
      /(\bDELETE\b.*\bFROM\b)/i,
      /(\bDROP\b.*\bTABLE\b)/i,
      /(\bEXEC\b|\bEXECUTE\b)/i,
      /--/,
      /\/\*/,
      /\*\//,
      /;/
    ];

    const checkValue = (value: any): boolean => {
      if (typeof value === 'string') {
        return sqlPatterns.some(pattern => pattern.test(value));
      } else if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(checkValue);
      }
      return false;
    };

    const suspicious =
      checkValue(req.query) ||
      checkValue(req.body) ||
      checkValue(req.params);

    if (suspicious) {
      logSecurityEvent({
        type: 'SECURITY_SQL_INJECTION_ATTEMPT',
        userId: (req as any).user?.id,
        path: req.path,
        query: req.query,
        body: req.body,
        severity: 'critical'
      });

      return res.status(400).json({ error: 'Invalid input detected' });
    }

    next();
  };
}

// ============================================================================
// XSS PROTECTION
// ============================================================================

export function xssProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi
    ];

    const sanitize = (value: any): any => {
      if (typeof value === 'string') {
        let sanitized = value;
        xssPatterns.forEach(pattern => {
          sanitized = sanitized.replace(pattern, '');
        });
        return sanitized;
      } else if (typeof value === 'object' && value !== null) {
        const sanitized: any = Array.isArray(value) ? [] : {};
        for (const key in value) {
          sanitized[key] = sanitize(value[key]);
        }
        return sanitized;
      }
      return value;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);

    next();
  };
}

// ============================================================================
// AUDIT LOGGING MIDDLEWARE
// ============================================================================

export function auditLogMiddleware(supabase: SupabaseClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture response
    const originalSend = res.send;
    let responseBody: any;

    res.send = function (body: any) {
      responseBody = body;
      return originalSend.call(this, body);
    };

    res.on('finish', async () => {
      const duration = Date.now() - startTime;

      // Determine if this should be logged
      const shouldLog =
        req.method !== 'GET' ||  // Log all mutations
        res.statusCode >= 400 ||  // Log errors
        duration > 1000;          // Log slow requests

      if (shouldLog) {
        await supabase.from('audit_logs').insert({
          event_type: `API_${req.method}_${res.statusCode >= 400 ? 'FAILURE' : 'SUCCESS'}`,
          severity: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info',
          user_id: (req as any).user?.id,
          organization_id: (req as any).organization?.id,
          api_key_id: (req as any).apiKey?.id,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          resource: 'api',
          operation: req.method,
          endpoint: req.path,
          result: {
            status_code: res.statusCode,
            duration_ms: duration
          },
          context: {
            query: req.query,
            body: sanitizeForLog(req.body),
            params: req.params
          }
        });
      }
    });

    next();
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const user = (req as any).user;
  const apiKey = (req as any).apiKey;
  const userOrg = (req as any).userOrganization;

  if (!user && !apiKey) {
    return null;
  }

  let permissions: string[] = [];

  if (apiKey) {
    permissions = apiKey.scopes || [];
  } else if (userOrg) {
    // Get permissions from role
    permissions = []; // Would fetch from role_permissions table
  }

  return {
    user,
    organization: (req as any).organization,
    apiKey,
    permissions
  };
}

async function logSecurityEvent(event: any): Promise<void> {
  console.log('Security Event:', event);
  // Would log to database in real implementation
}

function sanitizeForLog(data: any): any {
  if (!data) return data;

  const sensitive = ['password', 'token', 'secret', 'key', 'apiKey'];
  const sanitized = { ...data };

  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const SecurityMiddleware = {
  headers: securityHeadersMiddleware,
  cors: corsMiddleware,
  rateLimit: rateLimitMiddleware,
  authentication: authenticationMiddleware,
  requirePermission,
  requireRole,
  organizationContext: organizationContextMiddleware,
  validateInput,
  sqlInjectionProtection,
  xssProtection,
  auditLog: auditLogMiddleware
};
