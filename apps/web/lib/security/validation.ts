/**
 * Input Validation Utilities
 *
 * Comprehensive input validation and sanitization to prevent:
 * - SQL Injection
 * - XSS attacks
 * - Command injection
 * - Path traversal
 * - SSRF attacks
 */

import { z } from 'zod';

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Email validation schema
 */
export const emailSchema = z.string().email('Invalid email format').max(255);

/**
 * Password validation schema
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/**
 * Organization slug validation
 * - Only lowercase letters, numbers, and hyphens
 * - Must start and end with alphanumeric
 */
export const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .max(63, 'Slug must be less than 63 characters')
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Invalid slug format');

/**
 * URL validation schema
 * - Must be valid HTTPS URL
 * - No localhost or private IPs (for SSRF protection)
 */
export const urlSchema = z
  .string()
  .url('Invalid URL format')
  .startsWith('https://', 'URL must use HTTPS')
  .refine((url) => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }

      // Block private IP ranges
      const privateIpRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
      if (privateIpRegex.test(hostname)) {
        return false;
      }

      // Block link-local addresses
      if (hostname.startsWith('169.254.')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }, 'URL must not point to private network');

/**
 * File path validation
 * - Prevent path traversal attacks
 * - Only allow alphanumeric, hyphens, underscores, and forward slashes
 */
export const filePathSchema = z
  .string()
  .max(1024, 'File path too long')
  .regex(/^[a-zA-Z0-9\/_-]+$/, 'Invalid file path characters')
  .refine((path) => !path.includes('..'), 'Path traversal not allowed')
  .refine((path) => !path.startsWith('/'), 'Absolute paths not allowed');

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize SQL input (use with parameterized queries!)
 */
export function sanitizeSql(input: string): string {
  // Remove or escape dangerous SQL characters
  return input
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
}

/**
 * Validate and sanitize organization input
 */
export const organizationSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim(),
  slug: slugSchema,
  tier: z.enum(['standard', 'enterprise', 'regulated']),
  settings: z.record(z.unknown()).optional(),
});

/**
 * Validate document upload
 */
export const documentUploadSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  fileType: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/, 'Invalid MIME type'),
  fileSize: z.number()
    .int()
    .min(1, 'File size must be positive')
    .max(100 * 1024 * 1024, 'File size must be less than 100MB'),
  organizationId: uuidSchema,
  sensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * Validate API key creation
 */
export const apiKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim(),
  type: z.enum(['read', 'write', 'admin']),
  scopes: z.array(z.string().max(100)).max(20).optional(),
  ipWhitelist: z.array(z.string().ip()).max(10).optional(),
  expiresAt: z.string().datetime().optional(),
  organizationId: uuidSchema,
});

/**
 * Validate user invitation
 */
export const inviteUserSchema = z.object({
  email: emailSchema,
  role: z.enum(['ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER', 'ORG_VIEWER']),
  organizationId: uuidSchema,
});

/**
 * Validate pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Validate search query
 */
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Query is required')
    .max(500, 'Query must be less than 500 characters')
    .trim(),
  filters: z.record(z.unknown()).optional(),
  ...paginationSchema.shape,
});

/**
 * Validate IP address
 */
export function isValidIp(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return false;
  }

  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  return true;
}

/**
 * Validate JWT token format (not verification)
 */
export function isValidJwtFormat(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  try {
    parts.forEach(part => {
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file extension against allowed list
 */
export function validateFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Allowed file extensions for uploads
 */
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'xlsx',
  'xls',
  'csv',
  'doc',
  'docx',
];

/**
 * Validate MIME type against content
 */
export function validateMimeType(mimeType: string, fileExtension: string): boolean {
  const mimeTypeMap: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'image/png': ['png'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/gif': ['gif'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/vnd.ms-excel': ['xls'],
    'text/csv': ['csv'],
    'application/msword': ['doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  };

  const allowedExtensions = mimeTypeMap[mimeType];
  return allowedExtensions ? allowedExtensions.includes(fileExtension.toLowerCase()) : false;
}

/**
 * Generic validation helper
 */
export async function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Format validation errors for API response
 */
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(error.message);
  });

  return formatted;
}

/**
 * Example usage:
 *
 * ```typescript
 * const result = await validateInput(documentUploadSchema, requestBody);
 *
 * if (!result.success) {
 *   return new Response(
 *     JSON.stringify({
 *       error: 'Validation failed',
 *       details: formatValidationErrors(result.errors)
 *     }),
 *     { status: 400 }
 *   );
 * }
 *
 * // Use validated data
 * const document = result.data;
 * ```
 */
