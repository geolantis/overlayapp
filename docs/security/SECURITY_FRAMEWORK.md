# Security and Compliance Framework
## Multi-Tenant SaaS Security Architecture

### Document Version: 1.0.0
**Last Updated:** 2025-10-01
**Classification:** Internal - Confidential

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Security](#data-security)
4. [Compliance Requirements](#compliance-requirements)
5. [Security Monitoring](#security-monitoring)
6. [Tenant Isolation](#tenant-isolation)
7. [Incident Response](#incident-response)
8. [Implementation Checklist](#implementation-checklist)

---

## Overview

### Security Objectives

This framework establishes security controls for a multi-tenant SaaS platform handling:
- **Sensitive PDF documents** with geographic data
- **Payment processing** (PCI-DSS scope)
- **Multi-jurisdiction compliance** (EU, US, Canada, Australia)
- **Enterprise-grade authentication** and authorization

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Zero Trust Architecture**: Never trust, always verify
3. **Least Privilege**: Minimal access rights for users and services
4. **Data Minimization**: Collect only necessary data
5. **Privacy by Design**: Privacy embedded in system architecture
6. **Secure by Default**: Security controls enabled automatically

### Threat Model

**High-Risk Threats:**
- Cross-tenant data leakage
- Unauthorized document access
- Payment data breach
- Geographic data privacy violations
- Account takeover attacks
- API abuse and DDoS

**Medium-Risk Threats:**
- Social engineering attacks
- Insider threats
- Supply chain vulnerabilities
- Session hijacking
- CSRF/XSS attacks

---

## Authentication & Authorization

### 1. Supabase Auth Implementation

#### 1.1 Authentication Methods

**Primary Authentication:**
```typescript
// Email/Password with strong password policy
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, special characters
- Password history (prevent reuse of last 5 passwords)
- Password expiration: 90 days for standard users, 60 days for admins
- Account lockout: 5 failed attempts, 30-minute lockout
```

**Enterprise Authentication:**
- OAuth 2.0 / OpenID Connect for SSO
- SAML 2.0 for enterprise customers
- Magic link authentication (time-limited, single-use)
- Biometric authentication for mobile (Face ID, Touch ID)

**MFA Implementation:**
```typescript
// Multi-Factor Authentication Options
1. TOTP (Time-based One-Time Password) - Primary method
2. SMS OTP - Fallback method (with rate limiting)
3. Hardware tokens (FIDO2/WebAuthn) - Enterprise tier
4. Backup codes - Recovery mechanism (10 single-use codes)
```

#### 1.2 Session Management

**Session Security:**
```typescript
interface SessionConfig {
  maxAge: 3600000,              // 1 hour for web
  maxAgeMobile: 2592000000,     // 30 days for mobile with refresh
  rollingSession: true,          // Extend on activity
  absoluteTimeout: 28800000,     // 8 hours absolute max
  cookieOptions: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    domain: '.yourdomain.com'
  }
}
```

**Refresh Token Strategy:**
- Refresh tokens valid for 30 days
- Automatic rotation on use
- Device tracking and limit (max 5 devices per user)
- Revocation on password change or suspicious activity

#### 1.3 Role-Based Access Control (RBAC)

**Role Hierarchy:**
```sql
-- Core Roles
SUPER_ADMIN      -- Platform administration
ORG_ADMIN        -- Organization owner
ORG_MANAGER      -- Can manage users and settings
ORG_MEMBER       -- Standard access to org resources
ORG_VIEWER       -- Read-only access
EXTERNAL_AUDITOR -- Compliance auditor (read-only + logs)

-- Custom Roles (per-tenant)
CUSTOM_ROLE_*    -- Tenant-specific permissions
```

**Permission Matrix:**
```typescript
const PERMISSIONS = {
  // Document permissions
  'documents.create': ['ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER'],
  'documents.read': ['ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER', 'ORG_VIEWER'],
  'documents.update': ['ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER'],
  'documents.delete': ['ORG_ADMIN', 'ORG_MANAGER'],
  'documents.share': ['ORG_ADMIN', 'ORG_MANAGER'],

  // User management
  'users.invite': ['ORG_ADMIN', 'ORG_MANAGER'],
  'users.remove': ['ORG_ADMIN'],
  'users.change_role': ['ORG_ADMIN'],

  // Billing and payments
  'billing.view': ['ORG_ADMIN', 'ORG_MANAGER'],
  'billing.modify': ['ORG_ADMIN'],

  // Audit logs
  'audit.view': ['ORG_ADMIN', 'EXTERNAL_AUDITOR'],
  'audit.export': ['ORG_ADMIN', 'EXTERNAL_AUDITOR'],

  // Settings
  'settings.view': ['ORG_ADMIN', 'ORG_MANAGER'],
  'settings.modify': ['ORG_ADMIN'],
  'settings.security': ['ORG_ADMIN'],

  // API access
  'api.read': ['ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER'],
  'api.write': ['ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER'],
  'api.admin': ['ORG_ADMIN']
}
```

#### 1.4 API Key Management

**API Key Types:**
```typescript
interface APIKey {
  id: string;
  organizationId: string;
  name: string;
  type: 'read' | 'write' | 'admin';
  keyHash: string;              // SHA-256 hash
  prefix: string;               // First 8 chars for identification
  scopes: string[];             // Fine-grained permissions
  ipWhitelist?: string[];       // Optional IP restrictions
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  createdBy: string;
  status: 'active' | 'revoked' | 'expired';
}
```

**API Key Best Practices:**
- Generate cryptographically secure keys (min 32 bytes)
- Store only SHA-256 hashes, never plaintext
- Display full key only once at creation
- Automatic expiration (90 days default, configurable)
- Rotation reminders at 80% of lifetime
- Immediate revocation capability
- Audit all API key usage

**Mobile App Authentication:**
```typescript
// Mobile-specific authentication flow
1. Device registration with device fingerprint
2. Refresh token stored in secure keychain/keystore
3. Short-lived access tokens (15 minutes)
4. Certificate pinning for API calls
5. Biometric authentication for sensitive operations
```

#### 1.5 OAuth Integration for Enterprise SSO

**Supported Providers:**
- Okta
- Auth0
- Azure AD / Microsoft Entra
- Google Workspace
- OneLogin
- Custom OIDC providers

**SSO Configuration:**
```typescript
interface SSOConfig {
  organizationId: string;
  provider: 'okta' | 'azure' | 'google' | 'custom';
  clientId: string;
  clientSecret: string;         // Encrypted at rest
  issuer: string;
  authorizationURL: string;
  tokenURL: string;
  userInfoURL: string;
  scopes: string[];
  claimMappings: {
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  autoProvision: boolean;       // Create users automatically
  defaultRole: string;
  enforceSSOOnly: boolean;      // Disable password auth
}
```

---

## Data Security

### 2. Encryption Strategy

#### 2.1 Encryption at Rest

**Database Encryption:**
```sql
-- Supabase provides AES-256 encryption at rest by default
-- Additional column-level encryption for sensitive fields

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypted columns for PII
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  -- Encrypted fields
  ssn_encrypted BYTEA,              -- Social Security Number
  tax_id_encrypted BYTEA,           -- Tax ID
  phone_encrypted BYTEA,            -- Phone number
  address_encrypted BYTEA,          -- Physical address
  payment_method_encrypted BYTEA,   -- Payment details reference
  encryption_key_id TEXT NOT NULL,  -- Key rotation tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encryption/Decryption functions
CREATE OR REPLACE FUNCTION encrypt_field(data TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(data, key);
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_field(data BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(data, key);
$$ LANGUAGE SQL SECURITY DEFINER;
```

**File Storage Encryption:**
```typescript
// Supabase Storage with encryption
interface FileEncryptionConfig {
  method: 'AES-256-GCM';           // Authenticated encryption
  keyManagement: 'AWS-KMS' | 'VAULT' | 'SUPABASE';
  encryptionScope: {
    atRest: true;                  // Storage encryption
    clientSide: boolean;           // Pre-upload encryption for sensitive docs
  };
  metadata: {
    encrypted: boolean;
    keyId: string;
    algorithm: string;
    iv: string;                    // Initialization vector
  };
}
```

**Client-Side Encryption for Sensitive Documents:**
```typescript
// End-to-end encryption for highly sensitive PDFs
class DocumentEncryption {
  async encryptDocument(file: File, userKey: string): Promise<EncryptedFile> {
    // Generate unique encryption key per document
    const documentKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    // Encrypt document with document key
    const encryptedData = await this.encrypt(file, documentKey);

    // Wrap document key with user's key
    const wrappedKey = await this.wrapKey(documentKey, userKey);

    return {
      data: encryptedData,
      wrappedKey: wrappedKey,
      metadata: {
        algorithm: 'AES-256-GCM',
        iv: generateIV(),
        authTag: extractAuthTag(encryptedData)
      }
    };
  }
}
```

#### 2.2 Encryption in Transit

**TLS Configuration:**
```nginx
# Minimum TLS 1.3, fallback to TLS 1.2
ssl_protocols TLSv1.3 TLSv1.2;

# Strong cipher suites
ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES256-GCM-SHA384';

# Prefer server ciphers
ssl_prefer_server_ciphers on;

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# Certificate pinning (for mobile apps)
Public-Key-Pins: pin-sha256="[primary-key]"; pin-sha256="[backup-key]"; max-age=5184000; includeSubDomains
```

**API Security Headers:**
```typescript
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.trusted.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.yourdomain.com wss://realtime.yourdomain.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()
};
```

#### 2.3 Data Retention and Deletion

**Retention Policy:**
```typescript
interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number;        // Days
  deletionMethod: 'soft' | 'hard';
  archiveBeforeDelete: boolean;

  policies: {
    // Active user data
    activeUserData: {
      retention: Infinity,        // Keep while active
      afterAccountDeletion: 30    // Grace period
    },

    // Documents
    documents: {
      retention: 2555,            // 7 years (compliance)
      deleted: 30                 // Soft delete recovery period
    },

    // Audit logs
    auditLogs: {
      retention: 2555,            // 7 years (compliance)
      archiveAfter: 365           // Archive after 1 year
    },

    // Payment records
    paymentRecords: {
      retention: 2555,            // 7 years (tax compliance)
      archiveAfter: 365
    },

    // Session data
    sessions: {
      retention: 90               // 90 days
    },

    // API logs
    apiLogs: {
      retention: 365,             // 1 year
      archiveAfter: 90
    }
  }
}
```

**Secure Deletion Procedure:**
```sql
-- Soft delete with automatic hard delete after retention
CREATE OR REPLACE FUNCTION schedule_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  NEW.hard_delete_at = NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Automatic hard deletion job (run daily)
CREATE OR REPLACE FUNCTION execute_hard_deletes()
RETURNS void AS $$
BEGIN
  -- Delete user data
  DELETE FROM users WHERE hard_delete_at < NOW();

  -- Securely delete files from storage
  -- (triggers storage deletion webhook)
  DELETE FROM documents WHERE hard_delete_at < NOW();

  -- Log deletion for compliance
  INSERT INTO deletion_audit_log (table_name, deleted_count, deleted_at)
  VALUES ('users', (SELECT COUNT(*) FROM users WHERE hard_delete_at < NOW()), NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Right to Erasure (GDPR Article 17):**
```typescript
class DataErasureService {
  async executeRightToErasure(userId: string): Promise<ErasureReport> {
    const report = {
      userId,
      requestedAt: new Date(),
      completedAt: null,
      itemsDeleted: []
    };

    // 1. Delete user profile data
    await this.deleteUserProfile(userId);
    report.itemsDeleted.push('user_profile');

    // 2. Delete documents (or anonymize if needed for compliance)
    await this.deleteUserDocuments(userId);
    report.itemsDeleted.push('documents');

    // 3. Anonymize audit logs (keep for compliance)
    await this.anonymizeAuditLogs(userId);
    report.itemsDeleted.push('audit_logs_anonymized');

    // 4. Delete payment methods (keep transaction records anonymized)
    await this.deletePaymentMethods(userId);
    report.itemsDeleted.push('payment_methods');

    // 5. Delete sessions and tokens
    await this.revokeAllSessions(userId);
    report.itemsDeleted.push('sessions');

    // 6. Delete from third-party services
    await this.deleteFromThirdParties(userId);
    report.itemsDeleted.push('third_party_services');

    report.completedAt = new Date();
    return report;
  }
}
```

---

## Compliance Requirements

### 3. Multi-Jurisdiction Compliance

#### 3.1 GDPR Compliance (EU)

**Key Requirements:**

1. **Lawful Basis for Processing:**
   - Consent (explicit, freely given, specific)
   - Contract performance
   - Legal obligation
   - Legitimate interests

2. **Data Subject Rights:**
   - Right to access (Article 15)
   - Right to rectification (Article 16)
   - Right to erasure (Article 17)
   - Right to data portability (Article 20)
   - Right to object (Article 21)
   - Right to restrict processing (Article 18)

3. **Data Protection Officer (DPO):**
   - Required if processing large scale sensitive data
   - Contact: dpo@yourdomain.com
   - Independent role, reports to highest management

4. **Data Processing Agreements (DPA):**
   - Required for all third-party processors
   - Must include: purpose, duration, data types, security measures
   - Sub-processor management

5. **Privacy by Design and Default:**
   - Minimize data collection
   - Pseudonymization where possible
   - Encryption by default
   - Access controls

6. **Breach Notification:**
   - 72 hours to supervisory authority
   - Without undue delay to affected individuals
   - Document all breaches (even if not reported)

**Implementation:**
```typescript
// GDPR Consent Management
interface ConsentRecord {
  userId: string;
  purpose: 'necessary' | 'analytics' | 'marketing';
  consentGiven: boolean;
  consentedAt?: Date;
  withdrawnAt?: Date;
  ipAddress: string;
  userAgent: string;
  version: string;              // Consent form version
}

// Data Subject Access Request (DSAR)
class DSARHandler {
  async generateUserDataExport(userId: string): Promise<DataExport> {
    return {
      personalData: await this.collectPersonalData(userId),
      documents: await this.collectDocuments(userId),
      activityLogs: await this.collectActivityLogs(userId),
      thirdPartySharing: await this.collectThirdPartyData(userId),
      format: 'JSON',             // Machine-readable format
      generatedAt: new Date(),
      expiresAt: addDays(new Date(), 30)
    };
  }
}
```

#### 3.2 CCPA Compliance (California)

**Key Requirements:**

1. **Consumer Rights:**
   - Right to know what data is collected
   - Right to delete personal information
   - Right to opt-out of sale
   - Right to non-discrimination

2. **Privacy Notice:**
   - Categories of data collected
   - Purposes for collection
   - Categories of third parties data is shared with
   - Consumer rights

3. **Opt-Out Mechanism:**
   - "Do Not Sell My Personal Information" link
   - Must honor opt-out within 15 days
   - Cannot require account creation to opt-out

4. **Verification Procedures:**
   - Verify identity before fulfilling requests
   - Match at least 2-3 data points
   - Additional verification for sensitive requests

**Implementation:**
```typescript
// CCPA Opt-Out Management
interface CCPAOptOut {
  userId: string;
  optOutDate: Date;
  categories: {
    analytics: boolean;
    marketing: boolean;
    thirdPartySharing: boolean;
  };
  verified: boolean;
  verificationMethod: 'email' | 'sms' | 'account';
}

// "Do Not Sell" Registry
class DoNotSellRegistry {
  async registerOptOut(email: string): Promise<void> {
    // Can be done without account
    await this.db.doNotSell.create({
      email: hashEmail(email),
      optOutAt: new Date(),
      source: 'web_form'
    });

    // Propagate to all third parties within 15 days
    await this.notifyThirdParties(email);
  }
}
```

#### 3.3 PIPEDA Compliance (Canada)

**Key Principles:**

1. Accountability
2. Identifying purposes
3. Consent
4. Limiting collection
5. Limiting use, disclosure, retention
6. Accuracy
7. Safeguards
8. Openness
9. Individual access
10. Challenging compliance

**Data Residency:**
- Option to store Canadian user data in Canadian data centers
- Cross-border transfer agreements
- Adequate protection for transferred data

**Implementation:**
```typescript
interface PIPEDACompliance {
  dataResidency: {
    canadianUsers: 'CA-CENTRAL-1';  // Canadian region
    crossBorderTransfers: {
      allowed: boolean;
      countries: string[];
      adequacyDecision: boolean;
      contractualClauses: boolean;
    };
  };

  consentManagement: {
    explicit: boolean;            // Explicit consent required
    purposeLimitation: string[];  // Specific purposes only
    withdrawalMechanism: boolean; // Easy withdrawal
  };
}
```

#### 3.4 Australian Privacy Principles (APP)

**Key Requirements:**

1. **APP 1 - Open and Transparent:**
   - Clear, accessible privacy policy
   - Contact details for privacy inquiries

2. **APP 3 - Collection:**
   - Only collect necessary personal information
   - Collect lawfully and fairly

3. **APP 6 - Use and Disclosure:**
   - Only use for primary purpose or related secondary purposes
   - Disclosure restrictions

4. **APP 8 - Cross-Border Disclosure:**
   - Take reasonable steps to ensure overseas recipients comply
   - Accountability for transferred data

5. **APP 11 - Security:**
   - Take reasonable steps to protect personal information
   - Destroy or de-identify when no longer needed

6. **APP 12 - Access:**
   - Provide access to personal information upon request
   - Respond within 30 days

**Implementation:**
```typescript
interface APPCompliance {
  dataResidency: {
    australianUsers: 'AP-SOUTHEAST-2';  // Sydney region
    overseasDisclosure: {
      countries: string[];
      adequateProtection: boolean;
      bindingScheme: boolean;
    };
  };

  notifiableDataBreaches: {
    thresholdMet: boolean;        // Serious harm likely
    notifyOAIC: boolean;          // Office of Australian Info Commissioner
    notifyIndividuals: boolean;
    timeframe: '72_hours';
  };
}
```

#### 3.5 SOC 2 Type II Pathway

**Trust Service Criteria:**

1. **Security:**
   - Access controls
   - Encryption
   - Vulnerability management
   - Security monitoring

2. **Availability:**
   - 99.9% uptime SLA
   - Disaster recovery
   - Redundancy
   - Performance monitoring

3. **Processing Integrity:**
   - Data validation
   - Error handling
   - Transaction completeness
   - Accuracy controls

4. **Confidentiality:**
   - Encryption at rest and in transit
   - Access restrictions
   - Secure disposal
   - NDA requirements

5. **Privacy:**
   - Privacy notice
   - Choice and consent
   - Collection limitation
   - Retention and disposal

**SOC 2 Implementation Roadmap:**

```typescript
interface SOC2Roadmap {
  phase1: {
    duration: '3_months';
    activities: [
      'Define scope and boundaries',
      'Document policies and procedures',
      'Implement required controls',
      'Conduct risk assessment',
      'Select auditor'
    ];
  };

  phase2: {
    duration: '6_months';
    activities: [
      'Operate controls consistently',
      'Collect evidence',
      'Conduct internal audits',
      'Remediate gaps',
      'Employee training'
    ];
  };

  phase3: {
    duration: '3_months';
    activities: [
      'External audit fieldwork',
      'Testing of controls',
      'Review findings',
      'Remediation',
      'Receive SOC 2 Type II report'
    ];
  };

  totalDuration: '12_months';
  estimatedCost: '$50,000 - $100,000';

  requiredDocuments: [
    'Information Security Policy',
    'Access Control Policy',
    'Change Management Policy',
    'Incident Response Plan',
    'Business Continuity Plan',
    'Risk Assessment',
    'Vendor Management Policy'
  ];
}
```

---

## Security Monitoring

### 4. Comprehensive Security Monitoring

#### 4.1 Audit Logging Strategy

**What to Log:**
```typescript
interface AuditLog {
  // Core fields
  id: string;
  timestamp: Date;
  eventType: AuditEventType;
  severity: 'info' | 'warning' | 'error' | 'critical';

  // Actor information
  actor: {
    userId?: string;
    organizationId?: string;
    apiKeyId?: string;
    ipAddress: string;
    userAgent: string;
    sessionId?: string;
  };

  // Action details
  action: {
    resource: string;           // e.g., 'document', 'user', 'organization'
    resourceId: string;
    operation: string;          // e.g., 'create', 'read', 'update', 'delete'
    method: string;             // HTTP method or function name
    endpoint?: string;
  };

  // Context
  context: {
    before?: any;               // State before change
    after?: any;                // State after change
    changes?: any;              // Diff of changes
    metadata?: any;             // Additional context
  };

  // Result
  result: {
    status: 'success' | 'failure' | 'partial';
    statusCode?: number;
    errorMessage?: string;
    errorCode?: string;
  };

  // Compliance
  compliance: {
    dataSubjectId?: string;     // For GDPR/privacy tracking
    legalBasis?: string;
    retentionPeriod: number;
  };
}

enum AuditEventType {
  // Authentication
  AUTH_LOGIN_SUCCESS = 'auth.login.success',
  AUTH_LOGIN_FAILURE = 'auth.login.failure',
  AUTH_LOGOUT = 'auth.logout',
  AUTH_MFA_ENABLED = 'auth.mfa.enabled',
  AUTH_MFA_DISABLED = 'auth.mfa.disabled',
  AUTH_PASSWORD_CHANGE = 'auth.password.change',
  AUTH_PASSWORD_RESET = 'auth.password.reset',

  // Authorization
  AUTHZ_ACCESS_GRANTED = 'authz.access.granted',
  AUTHZ_ACCESS_DENIED = 'authz.access.denied',
  AUTHZ_ROLE_ASSIGNED = 'authz.role.assigned',
  AUTHZ_PERMISSION_CHANGED = 'authz.permission.changed',

  // Data access
  DATA_READ = 'data.read',
  DATA_CREATE = 'data.create',
  DATA_UPDATE = 'data.update',
  DATA_DELETE = 'data.delete',
  DATA_EXPORT = 'data.export',

  // Document operations
  DOC_UPLOAD = 'document.upload',
  DOC_DOWNLOAD = 'document.download',
  DOC_SHARE = 'document.share',
  DOC_DELETE = 'document.delete',

  // Admin operations
  ADMIN_USER_CREATE = 'admin.user.create',
  ADMIN_USER_DELETE = 'admin.user.delete',
  ADMIN_SETTINGS_CHANGE = 'admin.settings.change',
  ADMIN_API_KEY_CREATE = 'admin.apikey.create',
  ADMIN_API_KEY_REVOKE = 'admin.apikey.revoke',

  // Security events
  SECURITY_BREACH_ATTEMPT = 'security.breach.attempt',
  SECURITY_RATE_LIMIT_EXCEEDED = 'security.ratelimit.exceeded',
  SECURITY_ANOMALY_DETECTED = 'security.anomaly.detected',

  // Compliance events
  COMPLIANCE_CONSENT_GIVEN = 'compliance.consent.given',
  COMPLIANCE_CONSENT_WITHDRAWN = 'compliance.consent.withdrawn',
  COMPLIANCE_DATA_REQUEST = 'compliance.data.request',
  COMPLIANCE_DATA_DELETION = 'compliance.data.deletion'
}
```

**Audit Log Implementation:**
```sql
-- Audit log table with partitioning for performance
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL,

  -- Actor
  user_id UUID,
  organization_id UUID,
  api_key_id UUID,
  ip_address INET NOT NULL,
  user_agent TEXT,
  session_id UUID,

  -- Action
  resource TEXT NOT NULL,
  resource_id TEXT,
  operation TEXT NOT NULL,
  method TEXT,
  endpoint TEXT,

  -- Context and result
  context JSONB,
  result JSONB NOT NULL,

  -- Compliance
  data_subject_id UUID,
  legal_basis TEXT,
  retention_days INTEGER DEFAULT 2555,  -- 7 years

  -- Indexes
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type, timestamp DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity, timestamp DESC) WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id, timestamp DESC);

-- GIN index for JSONB context searches
CREATE INDEX idx_audit_logs_context ON audit_logs USING GIN(context);
```

#### 4.2 Intrusion Detection System (IDS)

**Detection Rules:**
```typescript
class IntrusionDetectionSystem {
  private rules: DetectionRule[] = [
    {
      name: 'Brute Force Attack',
      condition: 'failed_login_count > 10 within 5 minutes from same IP',
      severity: 'high',
      action: 'block_ip',
      alertChannels: ['security-team', 'pagerduty']
    },
    {
      name: 'Credential Stuffing',
      condition: 'failed_logins > 100 within 10 minutes across different IPs',
      severity: 'critical',
      action: 'enable_captcha',
      alertChannels: ['security-team', 'pagerduty', 'ciso']
    },
    {
      name: 'SQL Injection Attempt',
      condition: 'request contains SQL keywords in unexpected parameters',
      severity: 'critical',
      action: 'block_request_and_log',
      alertChannels: ['security-team', 'pagerduty']
    },
    {
      name: 'Cross-Tenant Data Access',
      condition: 'user accessing resources outside their organization',
      severity: 'critical',
      action: 'terminate_session_and_alert',
      alertChannels: ['security-team', 'pagerduty', 'ciso']
    },
    {
      name: 'Unusual Data Export',
      condition: 'data_export_size > 10GB OR export_count > 100 per day',
      severity: 'medium',
      action: 'alert_and_require_approval',
      alertChannels: ['security-team', 'org-admin']
    },
    {
      name: 'Geographic Anomaly',
      condition: 'login from country different from usual within 1 hour',
      severity: 'medium',
      action: 'require_mfa_verification',
      alertChannels: ['user-email', 'security-team']
    },
    {
      name: 'API Abuse',
      condition: 'api_requests > 10000 per minute from single key',
      severity: 'high',
      action: 'rate_limit',
      alertChannels: ['security-team', 'org-admin']
    },
    {
      name: 'Privilege Escalation Attempt',
      condition: 'unauthorized role change attempt',
      severity: 'critical',
      action: 'terminate_session_and_alert',
      alertChannels: ['security-team', 'pagerduty', 'ciso']
    }
  ];

  async evaluateRules(event: SecurityEvent): Promise<void> {
    for (const rule of this.rules) {
      if (await this.ruleMatches(rule, event)) {
        await this.executeAction(rule, event);
        await this.sendAlerts(rule, event);
      }
    }
  }
}
```

**Anomaly Detection with Machine Learning:**
```typescript
// Behavioral analysis for detecting unusual patterns
class AnomalyDetector {
  async detectAnomalies(userId: string): Promise<Anomaly[]> {
    const userBaseline = await this.getUserBaseline(userId);
    const recentActivity = await this.getRecentActivity(userId);

    const anomalies: Anomaly[] = [];

    // Check for unusual access patterns
    if (this.isUnusualAccessTime(userBaseline, recentActivity)) {
      anomalies.push({
        type: 'unusual_access_time',
        severity: 'low',
        confidence: 0.7
      });
    }

    // Check for unusual data volume
    if (this.isUnusualDataVolume(userBaseline, recentActivity)) {
      anomalies.push({
        type: 'unusual_data_volume',
        severity: 'medium',
        confidence: 0.85
      });
    }

    // Check for unusual location
    if (this.isUnusualLocation(userBaseline, recentActivity)) {
      anomalies.push({
        type: 'unusual_location',
        severity: 'medium',
        confidence: 0.9
      });
    }

    return anomalies;
  }
}
```

#### 4.3 Rate Limiting and DDoS Protection

**Multi-Layer Rate Limiting:**
```typescript
interface RateLimitConfig {
  // Layer 1: CDN/Edge (Cloudflare, Fastly)
  cdn: {
    requestsPerSecond: 1000,
    burstSize: 2000,
    ddosProtection: true,
    botManagement: true
  };

  // Layer 2: Load Balancer / API Gateway
  apiGateway: {
    global: {
      requestsPerSecond: 500,
      burstSize: 1000
    },
    perIP: {
      requestsPerSecond: 100,
      burstSize: 200,
      windowSize: '1m'
    },
    perUser: {
      requestsPerMinute: 600,
      requestsPerHour: 10000,
      windowSize: '1h'
    }
  };

  // Layer 3: Application-level rate limiting
  application: {
    // Authentication endpoints
    '/auth/login': {
      perIP: { requests: 5, window: '5m' },
      perUser: { requests: 10, window: '15m' }
    },
    '/auth/register': {
      perIP: { requests: 3, window: '1h' }
    },

    // API endpoints
    '/api/*': {
      perAPIKey: { requests: 1000, window: '1m' },
      perOrg: { requests: 10000, window: '1h' }
    },

    // Upload endpoints
    '/upload': {
      perUser: { requests: 100, window: '1h' },
      maxFileSize: '100MB',
      totalUploadSize: '1GB per day'
    },

    // Export endpoints
    '/export': {
      perUser: { requests: 10, window: '1h' },
      requiresApproval: true  // For large exports
    }
  };

  // Layer 4: Resource-specific limits
  resources: {
    documents: {
      createPerHour: 1000,
      readPerHour: 10000,
      updatePerHour: 500,
      deletePerHour: 100
    },
    apiKeys: {
      createPerDay: 10,
      total: 50  // Max active keys per org
    }
  };
}
```

**Implementation with Supabase Edge Functions:**
```typescript
// Rate limiting middleware
import { createClient } from '@supabase/supabase-js';

export async function rateLimitMiddleware(req: Request): Promise<Response | null> {
  const identifier = await getIdentifier(req);  // IP, user ID, or API key
  const endpoint = new URL(req.url).pathname;

  const rateLimitKey = `ratelimit:${endpoint}:${identifier}`;

  // Check rate limit using Redis/Upstash
  const current = await redis.incr(rateLimitKey);

  if (current === 1) {
    await redis.expire(rateLimitKey, 60);  // 1 minute window
  }

  const limit = getRateLimitForEndpoint(endpoint);

  if (current > limit) {
    // Log rate limit exceeded
    await logSecurityEvent({
      type: 'SECURITY_RATE_LIMIT_EXCEEDED',
      identifier,
      endpoint,
      current,
      limit
    });

    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        limit,
        resetAt: await redis.ttl(rateLimitKey)
      }),
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': Math.max(0, limit - current).toString(),
          'X-RateLimit-Reset': (Date.now() + await redis.ttl(rateLimitKey) * 1000).toString(),
          'Retry-After': (await redis.ttl(rateLimitKey)).toString()
        }
      }
    );
  }

  return null;  // Allow request
}
```

#### 4.4 Vulnerability Scanning

**Continuous Security Scanning:**
```yaml
# Security scanning pipeline
security_scanning:
  # Dependency scanning
  dependency_scanning:
    tool: "Snyk, Dependabot, npm audit"
    frequency: "daily"
    severity_threshold: "medium"
    auto_fix: true

  # Static Application Security Testing (SAST)
  sast:
    tool: "SonarQube, Semgrep"
    frequency: "on_commit"
    rules:
      - SQL injection
      - XSS vulnerabilities
      - Hardcoded secrets
      - Insecure crypto
      - Path traversal

  # Dynamic Application Security Testing (DAST)
  dast:
    tool: "OWASP ZAP, Burp Suite"
    frequency: "weekly"
    scope: "production-like staging environment"

  # Container scanning
  container_scanning:
    tool: "Trivy, Clair"
    frequency: "on_build"
    registries: ["ECR", "Docker Hub"]

  # Infrastructure as Code scanning
  iac_scanning:
    tool: "Checkov, tfsec"
    frequency: "on_commit"
    frameworks: ["Terraform", "CloudFormation"]

  # Secret scanning
  secret_scanning:
    tool: "GitGuardian, TruffleHog"
    frequency: "on_commit"
    scope: ["git history", "code", "config files"]

  # Penetration testing
  penetration_testing:
    frequency: "quarterly"
    scope: "full application"
    provider: "external security firm"
    compliance: ["OWASP Top 10", "SANS 25"]
```

---

## Tenant Isolation

### 5. Multi-Tenant Security Architecture

#### 5.1 Row-Level Security (RLS) Policies

**Organization Isolation:**
```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations table - users can only see their own org
CREATE POLICY organization_isolation ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users table - organization members can see other members
CREATE POLICY user_isolation ON users
  FOR SELECT
  USING (
    id = auth.uid() OR  -- Can always see self
    EXISTS (
      SELECT 1 FROM user_organizations uo1
      JOIN user_organizations uo2 ON uo1.organization_id = uo2.organization_id
      WHERE uo1.user_id = auth.uid()
        AND uo2.user_id = users.id
    )
  );

-- Documents table - strict organization isolation
CREATE POLICY document_isolation ON documents
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Additional policy for shared documents
CREATE POLICY document_shared_access ON documents
  FOR SELECT
  USING (
    id IN (
      SELECT document_id
      FROM document_shares
      WHERE user_id = auth.uid()
        AND expires_at > NOW()
        AND revoked_at IS NULL
    )
  );

-- Audit logs - users can only see logs for their org
CREATE POLICY audit_log_isolation ON audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND (
      -- Regular users see limited audit logs
      user_id = auth.uid() OR
      -- Admins see all org audit logs
      EXISTS (
        SELECT 1 FROM user_organizations
        WHERE user_id = auth.uid()
          AND organization_id = audit_logs.organization_id
          AND role IN ('ORG_ADMIN', 'ORG_MANAGER')
      )
    )
  );
```

**Permission-Based Access Control:**
```sql
-- Function to check user permissions
CREATE OR REPLACE FUNCTION has_permission(
  required_permission TEXT,
  target_org_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get user's role in the organization
  SELECT role INTO user_role
  FROM user_organizations
  WHERE user_id = auth.uid()
    AND organization_id = COALESCE(target_org_id,
                                    (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1));

  -- Check if role has required permission
  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = user_role
      AND permission = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy using permission check
CREATE POLICY document_create_permission ON documents
  FOR INSERT
  WITH CHECK (
    has_permission('documents.create', organization_id)
  );

CREATE POLICY document_delete_permission ON documents
  FOR DELETE
  USING (
    has_permission('documents.delete', organization_id)
  );

CREATE POLICY document_update_permission ON documents
  FOR UPDATE
  USING (
    has_permission('documents.update', organization_id)
  )
  WITH CHECK (
    has_permission('documents.update', organization_id)
  );
```

**Super Admin Access (Bypass RLS for Support):**
```sql
-- Create super admin role
CREATE ROLE super_admin;

-- Grant bypass RLS capability
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;

-- Super admin policy (with extensive logging)
CREATE POLICY super_admin_access ON documents
  FOR ALL
  TO super_admin
  USING (true)
  WITH CHECK (
    -- Log all super admin access
    log_super_admin_access(
      auth.uid(),
      'documents',
      id,
      TG_OP
    ) OR true
  );

-- Audit function for super admin access
CREATE OR REPLACE FUNCTION log_super_admin_access(
  admin_id UUID,
  table_name TEXT,
  resource_id UUID,
  operation TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO super_admin_audit_log (
    admin_id,
    table_name,
    resource_id,
    operation,
    timestamp
  ) VALUES (
    admin_id,
    table_name,
    resource_id,
    operation,
    NOW()
  );

  -- Send real-time alert
  PERFORM pg_notify('super_admin_access', json_build_object(
    'admin_id', admin_id,
    'table', table_name,
    'resource', resource_id,
    'op', operation
  )::text);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 5.2 API Endpoint Isolation

**Middleware for Organization Context:**
```typescript
// Middleware to inject organization context
export async function organizationContextMiddleware(
  req: Request,
  ctx: Context
): Promise<Response | void> {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get organization from header, query, or body
  const orgId =
    req.headers.get('X-Organization-ID') ||
    new URL(req.url).searchParams.get('organizationId') ||
    (await req.clone().json()).organizationId;

  // Verify user belongs to organization
  const userOrg = await db.userOrganizations.findFirst({
    where: {
      userId: user.id,
      organizationId: orgId
    }
  });

  if (!userOrg) {
    await logSecurityEvent({
      type: 'SECURITY_CROSS_TENANT_ATTEMPT',
      userId: user.id,
      requestedOrgId: orgId,
      severity: 'critical'
    });

    return new Response('Forbidden', { status: 403 });
  }

  // Inject organization context
  ctx.organization = {
    id: orgId,
    role: userOrg.role,
    permissions: await getPermissions(userOrg.role)
  };
}

// API route with organization isolation
export async function getDocuments(req: Request, ctx: Context) {
  // Organization context automatically enforced
  const documents = await db.documents.findMany({
    where: {
      organizationId: ctx.organization.id  // Enforced by middleware
    }
  });

  return new Response(JSON.stringify(documents));
}
```

**API Gateway Organization Routing:**
```typescript
// Organization-specific subdomains or paths
const routes = {
  // Subdomain routing: {org-slug}.yourdomain.com
  subdomain: async (req: Request) => {
    const hostname = new URL(req.url).hostname;
    const orgSlug = hostname.split('.')[0];

    const org = await db.organizations.findUnique({
      where: { slug: orgSlug }
    });

    if (!org) {
      return new Response('Organization not found', { status: 404 });
    }

    return { organizationId: org.id };
  },

  // Path routing: /orgs/{org-id}/...
  path: async (req: Request) => {
    const url = new URL(req.url);
    const orgId = url.pathname.split('/')[2];

    return { organizationId: orgId };
  }
};
```

#### 5.3 Storage Bucket Segregation

**Organization-Specific Storage Buckets:**
```typescript
// Supabase Storage with organization isolation
const storageConfig = {
  // Bucket per organization
  createOrganizationBucket: async (orgId: string) => {
    const bucketName = `org-${orgId}`;

    await supabase.storage.createBucket(bucketName, {
      public: false,
      fileSizeLimit: 104857600,  // 100MB
      allowedMimeTypes: [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]
    });

    // Set RLS policy on bucket
    await supabase.rpc('set_bucket_policy', {
      bucket_name: bucketName,
      policy: `
        CREATE POLICY "Organization members can upload"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = '${bucketName}' AND
          auth.uid() IN (
            SELECT user_id FROM user_organizations
            WHERE organization_id = '${orgId}'
          )
        );

        CREATE POLICY "Organization members can read"
        ON storage.objects FOR SELECT
        USING (
          bucket_id = '${bucketName}' AND
          auth.uid() IN (
            SELECT user_id FROM user_organizations
            WHERE organization_id = '${orgId}'
          )
        );
      `
    });
  }
};

// File upload with organization check
export async function uploadFile(
  file: File,
  orgId: string,
  userId: string
) {
  // Verify user belongs to organization
  const authorized = await verifyOrganizationMembership(userId, orgId);
  if (!authorized) {
    throw new Error('Unauthorized');
  }

  const bucketName = `org-${orgId}`;
  const filePath = `${userId}/${Date.now()}-${file.name}`;

  // Upload to organization bucket
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  // Log upload
  await logAuditEvent({
    type: 'DOC_UPLOAD',
    userId,
    organizationId: orgId,
    resource: 'document',
    resourceId: data.path
  });

  return data;
}
```

**Signed URLs with Expiration:**
```typescript
// Generate time-limited signed URLs for document access
export async function generateDocumentURL(
  documentId: string,
  userId: string,
  expiresIn: number = 3600  // 1 hour default
): Promise<string> {
  // Get document and verify access
  const document = await db.documents.findUnique({
    where: { id: documentId },
    include: { organization: true }
  });

  // Verify user has access
  const hasAccess = await verifyDocumentAccess(userId, documentId);
  if (!hasAccess) {
    throw new Error('Unauthorized');
  }

  // Generate signed URL
  const { data, error } = await supabase.storage
    .from(`org-${document.organizationId}`)
    .createSignedUrl(document.storagePath, expiresIn);

  if (error) throw error;

  // Log access
  await logAuditEvent({
    type: 'DOC_DOWNLOAD',
    userId,
    organizationId: document.organizationId,
    resourceId: documentId,
    metadata: { expiresIn }
  });

  return data.signedUrl;
}
```

#### 5.4 Cross-Tenant Attack Prevention

**Defense Mechanisms:**
```typescript
// 1. Parameterized queries to prevent SQL injection
class SecureDatabase {
  async query(sql: string, params: any[]) {
    // Always use parameterized queries
    return await this.db.raw(sql, params);
  }

  // Never allow dynamic table or column names from user input
  async findByOrganization(orgId: string, table: string) {
    // Whitelist allowed tables
    const allowedTables = ['documents', 'users', 'projects'];
    if (!allowedTables.includes(table)) {
      throw new Error('Invalid table');
    }

    // Use parameterized query
    return await this.db.raw(
      `SELECT * FROM ${table} WHERE organization_id = ?`,
      [orgId]
    );
  }
}

// 2. Object Reference Validation
class ObjectReferenceValidator {
  async validateAccess(
    userId: string,
    resourceType: string,
    resourceId: string
  ): Promise<boolean> {
    // Get user's organizations
    const userOrgs = await db.userOrganizations.findMany({
      where: { userId },
      select: { organizationId: true }
    });

    const orgIds = userOrgs.map(uo => uo.organizationId);

    // Verify resource belongs to one of user's organizations
    const resource = await db[resourceType].findUnique({
      where: { id: resourceId },
      select: { organizationId: true }
    });

    if (!resource || !orgIds.includes(resource.organizationId)) {
      // Log potential attack
      await logSecurityEvent({
        type: 'SECURITY_CROSS_TENANT_ATTEMPT',
        userId,
        resourceType,
        resourceId,
        severity: 'high'
      });

      return false;
    }

    return true;
  }
}

// 3. Organization Context Enforcement
class OrganizationContextGuard {
  private threadLocal: AsyncLocalStorage<OrganizationContext>;

  async setContext(userId: string, orgId: string) {
    // Verify user belongs to organization
    const valid = await this.verifyMembership(userId, orgId);
    if (!valid) {
      throw new Error('Invalid organization context');
    }

    this.threadLocal.run({ userId, orgId }, async () => {
      // All database queries within this context
      // automatically filter by organization
    });
  }

  getContext(): OrganizationContext {
    const context = this.threadLocal.getStore();
    if (!context) {
      throw new Error('No organization context');
    }
    return context;
  }
}

// 4. Database Query Interceptor
class QueryInterceptor {
  intercept(query: any) {
    // Automatically inject organization filter
    const context = organizationContextGuard.getContext();

    if (query.table in MULTI_TENANT_TABLES) {
      query.where('organization_id', context.orgId);
    }

    return query;
  }
}
```

**Network Isolation:**
```typescript
// Separate VPCs/subnets per tier or high-security tenants
interface NetworkIsolation {
  // Standard tenants
  standard: {
    vpc: 'vpc-standard',
    subnet: 'subnet-standard-private',
    securityGroup: 'sg-standard'
  };

  // Enterprise tenants (dedicated resources)
  enterprise: {
    vpc: 'vpc-enterprise-{orgId}',
    subnet: 'subnet-enterprise-{orgId}-private',
    securityGroup: 'sg-enterprise-{orgId}',
    dedicatedNATGateway: true,
    dedicatedLoadBalancer: true
  };

  // Regulated industries (highest isolation)
  regulated: {
    vpc: 'vpc-regulated-{orgId}',
    subnet: 'subnet-regulated-{orgId}-private',
    securityGroup: 'sg-regulated-{orgId}',
    dedicatedNATGateway: true,
    dedicatedLoadBalancer: true,
    dedicatedDatabase: true,      // Separate DB instance
    encryptedVolumes: true,
    privateEndpoints: true
  };
}
```

---

## Incident Response

### 6. Security Incident Response Plan

#### 6.1 Incident Classification

**Severity Levels:**
```typescript
enum IncidentSeverity {
  P0_CRITICAL = 'P0',    // Data breach, complete service outage
  P1_HIGH = 'P1',        // Partial breach, major vulnerability
  P2_MEDIUM = 'P2',      // Attempted breach, minor vulnerability
  P3_LOW = 'P3'          // Suspicious activity, no confirmed breach
}

interface SecurityIncident {
  id: string;
  severity: IncidentSeverity;
  type: IncidentType;
  status: 'detected' | 'investigating' | 'contained' | 'resolved';
  detectedAt: Date;
  detectedBy: 'automated' | 'manual' | 'external';

  // Incident details
  description: string;
  affectedSystems: string[];
  affectedUsers?: string[];
  affectedOrganizations?: string[];
  dataExposed?: string[];

  // Response
  incidentCommander: string;
  responseTeam: string[];
  timeline: IncidentTimelineEntry[];

  // Communication
  customersNotified: boolean;
  regulatorsNotified: boolean;
  publicDisclosure: boolean;

  // Resolution
  rootCause?: string;
  remediation: string[];
  lessonsLearned?: string[];

  // Compliance
  reportableUnderGDPR: boolean;
  reportableUnderCCPA: boolean;
  reportedAt?: Date;
}
```

#### 6.2 Response Procedures

**P0 - Critical Incident Response:**
```typescript
class CriticalIncidentResponse {
  async executeP0Response(incident: SecurityIncident) {
    // 1. IMMEDIATE CONTAINMENT (0-15 minutes)
    await this.immediateContainment(incident);

    // 2. ACTIVATE INCIDENT RESPONSE TEAM (15-30 minutes)
    await this.activateResponseTeam(incident);

    // 3. INVESTIGATE AND ASSESS (30 minutes - 4 hours)
    await this.investigateAndAssess(incident);

    // 4. NOTIFY STAKEHOLDERS (within 72 hours for GDPR)
    await this.notifyStakeholders(incident);

    // 5. REMEDIATE AND RECOVER
    await this.remediateAndRecover(incident);

    // 6. POST-INCIDENT REVIEW
    await this.postIncidentReview(incident);
  }

  private async immediateContainment(incident: SecurityIncident) {
    const actions = [];

    // Isolate affected systems
    if (incident.affectedSystems.includes('database')) {
      actions.push(this.isolateDatabase());
    }

    // Revoke compromised credentials
    if (incident.type === 'credential_compromise') {
      actions.push(this.revokeAllSessions());
      actions.push(this.rotateAPIKeys());
    }

    // Block malicious IPs
    if (incident.type === 'unauthorized_access') {
      actions.push(this.blockMaliciousIPs(incident));
    }

    // Enable enhanced monitoring
    actions.push(this.enableEnhancedMonitoring());

    await Promise.all(actions);

    // Log containment actions
    await this.logIncidentAction(incident.id, 'containment', actions);
  }

  private async activateResponseTeam(incident: SecurityIncident) {
    const team = {
      incidentCommander: 'ciso@yourdomain.com',
      technical: ['security-lead@yourdomain.com', 'devops-lead@yourdomain.com'],
      legal: ['legal@yourdomain.com'],
      communications: ['pr@yourdomain.com'],
      executive: ['ceo@yourdomain.com', 'cto@yourdomain.com']
    };

    // Page incident commander
    await this.pagerDuty.alert({
      severity: 'critical',
      title: `P0 Security Incident: ${incident.type}`,
      recipients: [team.incidentCommander],
      description: incident.description
    });

    // Create incident war room
    await this.slack.createChannel({
      name: `incident-${incident.id}`,
      members: Object.values(team).flat(),
      topic: `P0 Security Incident - ${incident.type}`
    });

    // Schedule incident calls
    await this.scheduleIncidentCalls(incident, team);
  }

  private async investigateAndAssess(incident: SecurityIncident) {
    // Collect evidence
    const evidence = await this.collectEvidence(incident);

    // Analyze logs
    const logs = await this.analyzeLogs(incident);

    // Determine scope
    const scope = await this.determineScope(incident, evidence, logs);

    // Assess data exposure
    const dataExposure = await this.assessDataExposure(scope);

    // Update incident record
    await this.updateIncident(incident.id, {
      scope,
      dataExposure,
      rootCause: await this.determineRootCause(evidence, logs)
    });

    return { scope, dataExposure };
  }

  private async notifyStakeholders(incident: SecurityIncident) {
    // Determine notification requirements
    const notifications = this.determineNotificationRequirements(incident);

    // GDPR - 72 hours to data protection authority
    if (notifications.gdpr) {
      await this.notifyDataProtectionAuthority(incident, 'GDPR');
    }

    // CCPA - notify California AG if > 500 California residents
    if (notifications.ccpa) {
      await this.notifyCaliforniaAG(incident);
    }

    // Notify affected customers
    if (notifications.customers) {
      await this.notifyAffectedCustomers(incident);
    }

    // Public disclosure if required
    if (notifications.public) {
      await this.publishSecurityBulletin(incident);
    }
  }
}
```

**Notification Templates:**
```typescript
// Customer notification email template
const customerNotificationTemplate = {
  subject: 'Important Security Notice - Action Required',

  body: `
Dear [Customer Name],

We are writing to inform you of a security incident that may have affected your data.

WHAT HAPPENED:
[Brief description of incident]

WHEN IT HAPPENED:
[Date and time range]

WHAT INFORMATION WAS INVOLVED:
[List of data types potentially exposed]

WHAT WE ARE DOING:
- [Containment actions taken]
- [Security improvements implemented]
- [Ongoing monitoring]

WHAT YOU SHOULD DO:
1. [Recommended immediate actions]
2. [Long-term precautions]
3. Contact our support team at security@yourdomain.com

We take the security of your data very seriously and sincerely apologize for this incident.

For more information, please visit: https://yourdomain.com/security/incident-[ID]

Sincerely,
[Your Company] Security Team
  `
};

// Regulatory notification template (GDPR)
const gdprNotificationTemplate = {
  authority: 'Data Protection Authority',

  requiredInformation: {
    natureOfBreach: 'Description of the nature of the personal data breach',
    dataProtectionOfficer: 'Name and contact details of DPO',
    likelyConsequences: 'Description of likely consequences',
    measuresTaken: 'Measures taken or proposed to address the breach',

    details: {
      categoriesOfDataSubjects: 'Number and categories of data subjects',
      categoriesOfRecords: 'Number and categories of personal data records',
      timeOfBreach: 'Date and time when breach occurred',
      timeOfDiscovery: 'Date and time when breach was discovered',
      ongoingBreach: 'Whether breach is ongoing',

      dataTypes: [
        'Names',
        'Email addresses',
        'Addresses',
        'Phone numbers',
        'Payment information',
        'Other: [specify]'
      ],

      technicalMeasures: [
        'Encryption status',
        'Access controls',
        'Authentication methods',
        'Monitoring systems'
      ],

      containmentActions: [
        'Immediate steps taken',
        'Timeline of response',
        'Current status'
      ]
    }
  }
};
```

#### 6.3 Post-Incident Activities

**Post-Incident Review Template:**
```typescript
interface PostIncidentReview {
  incident: SecurityIncident;

  // Timeline analysis
  timeline: {
    detectionTime: number;      // Time from occurrence to detection
    responseTime: number;       // Time from detection to response
    containmentTime: number;    // Time to contain
    resolutionTime: number;     // Time to full resolution
  };

  // Effectiveness analysis
  effectiveness: {
    detectionMethods: {
      automated: boolean;
      manual: boolean;
      external: boolean;
      effectiveness: 'high' | 'medium' | 'low';
    };
    responseProcedures: {
      followed: boolean;
      adequate: boolean;
      improvements: string[];
    };
    communication: {
      internal: 'effective' | 'needs_improvement';
      external: 'effective' | 'needs_improvement';
      timeliness: 'appropriate' | 'delayed';
    };
  };

  // Root cause analysis
  rootCause: {
    technical: string[];
    process: string[];
    human: string[];
  };

  // Lessons learned
  lessonsLearned: {
    whatWorkedWell: string[];
    whatDidntWork: string[];
    surprises: string[];
  };

  // Action items
  actionItems: Array<{
    id: string;
    description: string;
    owner: string;
    dueDate: Date;
    priority: 'high' | 'medium' | 'low';
    status: 'open' | 'in_progress' | 'completed';
  }>;

  // Preventive measures
  preventiveMeasures: {
    immediate: string[];        // Implemented immediately
    shortTerm: string[];        // 1-3 months
    longTerm: string[];         // 3-12 months
  };
}
```

---

## Implementation Checklist

### 7. Security Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-4)

**Authentication & Authorization:**
- [ ] Implement Supabase Auth with email/password
- [ ] Configure password policy (12+ chars, complexity)
- [ ] Set up session management with appropriate timeouts
- [ ] Implement TOTP-based MFA
- [ ] Create RBAC system with core roles
- [ ] Develop permission matrix
- [ ] Build role assignment UI

**Data Security Basics:**
- [ ] Enable Supabase encryption at rest
- [ ] Configure TLS 1.3 for all connections
- [ ] Implement security headers
- [ ] Set up certificate pinning for mobile

**Tenant Isolation:**
- [ ] Create multi-tenant database schema
- [ ] Implement RLS policies for all tables
- [ ] Test cross-tenant access prevention
- [ ] Create organization-specific storage buckets

#### Phase 2: Compliance Foundation (Weeks 5-8)

**Privacy Controls:**
- [ ] Create privacy policy and terms of service
- [ ] Implement consent management system
- [ ] Build data subject access request (DSAR) workflow
- [ ] Implement right to erasure functionality
- [ ] Set up data export capability (GDPR Article 20)

**Audit & Monitoring:**
- [ ] Implement comprehensive audit logging
- [ ] Set up log aggregation and analysis
- [ ] Create audit log viewer for admins
- [ ] Configure log retention policies

**Data Retention:**
- [ ] Define retention policies for all data types
- [ ] Implement soft delete with recovery period
- [ ] Create automatic hard deletion jobs
- [ ] Set up data archival system

#### Phase 3: Advanced Security (Weeks 9-12)

**Enhanced Authentication:**
- [ ] Implement OAuth/SAML for enterprise SSO
- [ ] Add biometric authentication for mobile
- [ ] Create API key management system
- [ ] Implement device tracking and limits
- [ ] Set up account lockout policies

**Security Monitoring:**
- [ ] Deploy intrusion detection system
- [ ] Implement rate limiting at all levels
- [ ] Set up anomaly detection
- [ ] Create security dashboards
- [ ] Configure alerting for security events

**Encryption:**
- [ ] Implement column-level encryption for PII
- [ ] Add client-side encryption for sensitive docs
- [ ] Set up key rotation procedures
- [ ] Create key management documentation

#### Phase 4: Compliance Certification (Weeks 13-24)

**GDPR Compliance:**
- [ ] Conduct Data Protection Impact Assessment (DPIA)
- [ ] Appoint Data Protection Officer (if required)
- [ ] Create and execute DPAs with processors
- [ ] Implement breach notification procedures
- [ ] Train staff on GDPR requirements

**Multi-Jurisdiction:**
- [ ] Implement data residency options
- [ ] Create region-specific privacy notices
- [ ] Set up CCPA "Do Not Sell" mechanism
- [ ] Ensure PIPEDA compliance for Canadian data
- [ ] Verify APP compliance for Australian users

**SOC 2 Preparation:**
- [ ] Document all security policies and procedures
- [ ] Implement required controls
- [ ] Conduct internal audit
- [ ] Engage external auditor
- [ ] Complete 6-12 month observation period
- [ ] Obtain SOC 2 Type II report

#### Phase 5: Ongoing Operations

**Regular Activities:**
- [ ] Weekly vulnerability scans
- [ ] Monthly security reviews
- [ ] Quarterly penetration testing
- [ ] Annual security training for all staff
- [ ] Continuous monitoring and alerting

**Continuous Improvement:**
- [ ] Review and update security policies quarterly
- [ ] Conduct incident response drills
- [ ] Update threat model annually
- [ ] Review and rotate credentials regularly
- [ ] Update dependencies and patch systems

---

## Security Metrics and KPIs

```typescript
interface SecurityMetrics {
  // Authentication metrics
  authentication: {
    mfaAdoptionRate: number;              // Target: >80%
    passwordResetRequests: number;
    accountLockouts: number;
    failedLoginAttempts: number;
  };

  // Vulnerability metrics
  vulnerabilities: {
    criticalOpen: number;                 // Target: 0
    highOpen: number;                     // Target: <5
    meanTimeToRemediate: number;          // Target: <7 days for critical
    patchCoverage: number;                // Target: >95%
  };

  // Incident metrics
  incidents: {
    totalIncidents: number;
    p0Incidents: number;                  // Target: 0
    meanTimeToDetect: number;             // Target: <1 hour
    meanTimeToContain: number;            // Target: <4 hours
    meanTimeToResolve: number;            // Target: <24 hours
  };

  // Compliance metrics
  compliance: {
    dsarResponseTime: number;             // Target: <30 days
    consentRate: number;                  // Target: >90%
    dataRetentionCompliance: number;      // Target: 100%
    auditCoverage: number;                // Target: 100%
  };

  // Access control metrics
  accessControl: {
    privilegedAccountCount: number;       // Target: minimize
    dormantAccounts: number;              // Target: 0
    excessivePermissions: number;         // Target: 0
    accessReviewCoverage: number;         // Target: 100% quarterly
  };
}
```

---

## Conclusion

This security and compliance framework provides a comprehensive foundation for building a secure, compliant multi-tenant SaaS platform. Implementation should be phased according to the checklist, with continuous monitoring and improvement.

**Key Success Factors:**
1. Executive support and resource commitment
2. Security-first culture across the organization
3. Regular training and awareness programs
4. Continuous monitoring and improvement
5. Proactive threat intelligence
6. Strong vendor management
7. Clear incident response procedures

**Next Steps:**
1. Review and approve this security framework
2. Assign ownership for each security domain
3. Create detailed implementation plans
4. Allocate budget and resources
5. Begin Phase 1 implementation
6. Schedule regular security review meetings

For questions or concerns, contact:
- **Security Team**: security@yourdomain.com
- **Data Protection Officer**: dpo@yourdomain.com
- **Compliance Team**: compliance@yourdomain.com

---

*Document Classification: Internal - Confidential*
*Review Frequency: Quarterly*
*Next Review Date: 2026-01-01*
