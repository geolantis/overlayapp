/**
 * CORS Configuration for Edge Functions and API Routes
 *
 * Implements secure Cross-Origin Resource Sharing policies
 * with support for multiple environments and authentication
 */

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

/**
 * Get CORS configuration based on environment
 */
export function getCORSConfig(): CORSConfig {
  const isDev = process.env.NODE_ENV === 'development';
  const productionOrigins = (process.env['ALLOWED_ORIGINS'] || '').split(',').filter(Boolean);

  return {
    allowedOrigins: isDev
      ? ['http://localhost:3000', 'http://localhost:3001']
      : productionOrigins,
    allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Organization-ID',
      'X-API-Key',
    ],
    exposedHeaders: [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  };
}

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null, config: CORSConfig): boolean {
  if (!origin) return false;

  // In development, allow all localhost origins
  if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
    return true;
  }

  return config.allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a request
 */
export function getCORSHeaders(origin: string | null, config: CORSConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if (isOriginAllowed(origin, config)) {
    headers['Access-Control-Allow-Origin'] = origin!;
    headers['Access-Control-Allow-Credentials'] = config.credentials.toString();
  }

  headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
  headers['Access-Control-Expose-Headers'] = config.exposedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = config.maxAge.toString();

  // Additional security headers
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';

  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCORSPreflight(request: Request): Response {
  const origin = request.headers.get('Origin');
  const config = getCORSConfig();

  if (!isOriginAllowed(origin, config)) {
    return new Response('Forbidden', { status: 403 });
  }

  const headers = getCORSHeaders(origin, config);

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Apply CORS headers to a response
 */
export function applyCORSHeaders(response: Response, request: Request): Response {
  const origin = request.headers.get('Origin');
  const config = getCORSConfig();

  if (!isOriginAllowed(origin, config)) {
    return response;
  }

  const headers = getCORSHeaders(origin, config);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * CORS middleware for Edge Functions
 */
export async function corsMiddleware(
  request: Request,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handleCORSPreflight(request);
  }

  // Execute handler and apply CORS headers
  const response = await handler(request);
  return applyCORSHeaders(response, request);
}

/**
 * Example usage in Edge Function:
 *
 * ```typescript
 * export default async function handler(req: Request) {
 *   return corsMiddleware(req, async (req) => {
 *     // Your handler logic here
 *     return new Response(JSON.stringify({ data: 'hello' }), {
 *       headers: { 'Content-Type': 'application/json' }
 *     });
 *   });
 * }
 * ```
 */
