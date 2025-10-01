-- Migration: Security and Multi-Tenant Foundation
-- Version: 001
-- Description: Core security schema with RLS policies, audit logging, and multi-tenant isolation

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Subscription and tier
  tier TEXT NOT NULL DEFAULT 'standard' CHECK (tier IN ('standard', 'enterprise', 'regulated')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),

  -- Billing
  stripe_customer_id TEXT UNIQUE,

  -- Settings
  settings JSONB DEFAULT '{}'::JSONB,

  -- SSO Configuration
  sso_enabled BOOLEAN DEFAULT FALSE,
  sso_config JSONB,

  -- Security
  mfa_required BOOLEAN DEFAULT FALSE,
  ip_whitelist TEXT[],

  -- Data residency
  data_region TEXT DEFAULT 'us-east-1',

  -- Compliance
  compliance_requirements TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  hard_delete_at TIMESTAMPTZ
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Profile
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,

  -- Contact (encrypted)
  phone_encrypted BYTEA,
  address_encrypted BYTEA,
  encryption_key_id TEXT,

  -- Security
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_method TEXT CHECK (mfa_method IN ('totp', 'sms', 'hardware')),
  mfa_secret_encrypted BYTEA,
  backup_codes_encrypted BYTEA,

  -- Session tracking
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  last_login_user_agent TEXT,

  -- Security events
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Compliance
  consent_version TEXT,
  consent_given_at TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT FALSE,
  analytics_consent BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  hard_delete_at TIMESTAMPTZ
);

-- User organizations relationship
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Role and permissions
  role TEXT NOT NULL DEFAULT 'ORG_MEMBER' CHECK (
    role IN (
      'SUPER_ADMIN',
      'ORG_ADMIN',
      'ORG_MANAGER',
      'ORG_MEMBER',
      'ORG_VIEWER',
      'EXTERNAL_AUDITOR'
    )
  ),
  custom_permissions JSONB DEFAULT '[]'::JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  invited_by UUID REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

-- Role permissions mapping
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(role, permission)
);

-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Document details
  name TEXT NOT NULL,
  description TEXT,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,

  -- Encryption
  encrypted BOOLEAN DEFAULT FALSE,
  encryption_key_id TEXT,
  encryption_algorithm TEXT,

  -- Geographic data
  contains_geographic_data BOOLEAN DEFAULT FALSE,
  geographic_regions TEXT[],

  -- Classification
  sensitivity TEXT DEFAULT 'internal' CHECK (
    sensitivity IN ('public', 'internal', 'confidential', 'restricted')
  ),
  tags TEXT[],

  -- Ownership
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),

  -- Retention
  retention_period_days INTEGER,
  retention_start_date TIMESTAMPTZ DEFAULT NOW(),
  retention_end_date TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  hard_delete_at TIMESTAMPTZ
);

-- Document shares
CREATE TABLE document_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  -- Share target (either user or email)
  shared_with_user_id UUID REFERENCES users(id),
  shared_with_email TEXT,

  -- Permissions
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'comment', 'edit')),

  -- Access control
  expires_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER,
  require_authentication BOOLEAN DEFAULT TRUE,

  -- Status
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  last_accessed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL)
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Key details
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,  -- SHA-256 hash
  key_prefix TEXT NOT NULL,        -- First 8 chars for identification

  -- Permissions
  type TEXT NOT NULL DEFAULT 'read' CHECK (type IN ('read', 'write', 'admin')),
  scopes TEXT[] DEFAULT '{}',

  -- Access control
  ip_whitelist INET[],

  -- Rate limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_hour INTEGER DEFAULT 1000,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ,

  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  last_used_ip INET,
  usage_count BIGINT DEFAULT 0,

  -- Audit
  created_by UUID NOT NULL REFERENCES users(id),
  revoked_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AUDIT LOGGING
-- ============================================================================

-- Audit logs table with partitioning
CREATE TABLE audit_logs (
  id UUID DEFAULT uuid_generate_v4(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),

  -- Actor
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  api_key_id UUID REFERENCES api_keys(id),
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
  context JSONB DEFAULT '{}'::JSONB,
  result JSONB NOT NULL,

  -- Compliance
  data_subject_id UUID,
  legal_basis TEXT,
  retention_days INTEGER DEFAULT 2555,  -- 7 years

  created_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (id, timestamp)
) PARTITION BY RANGE (timestamp);

-- Create first partition (will need to be automated)
CREATE TABLE audit_logs_2025_10 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');

-- Indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id, timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type, timestamp DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity, timestamp DESC)
  WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource, resource_id, timestamp DESC);
CREATE INDEX idx_audit_logs_context ON audit_logs USING GIN(context);

-- Super admin audit log (separate table for extra security)
CREATE TABLE super_admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  table_name TEXT NOT NULL,
  resource_id UUID NOT NULL,
  operation TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_super_admin_audit_admin ON super_admin_audit_log(admin_id, timestamp DESC);
CREATE INDEX idx_super_admin_audit_resource ON super_admin_audit_log(table_name, resource_id);

-- ============================================================================
-- SECURITY MONITORING
-- ============================================================================

-- Security events
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Source
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  ip_address INET,
  user_agent TEXT,

  -- Event details
  description TEXT NOT NULL,
  detection_method TEXT NOT NULL,  -- 'automated', 'manual', 'external'

  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'investigating', 'confirmed', 'false_positive', 'resolved')
  ),
  assigned_to UUID REFERENCES users(id),

  -- Response
  actions_taken TEXT[],
  notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_security_events_status ON security_events(status, severity, created_at DESC);
CREATE INDEX idx_security_events_user ON security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_org ON security_events(organization_id, created_at DESC);

-- Rate limiting tracking
CREATE TABLE rate_limit_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,  -- IP, user ID, or API key
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('ip', 'user', 'api_key')),
  endpoint TEXT NOT NULL,

  violation_count INTEGER DEFAULT 1,
  first_violation_at TIMESTAMPTZ DEFAULT NOW(),
  last_violation_at TIMESTAMPTZ DEFAULT NOW(),

  -- Action taken
  blocked_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_identifier ON rate_limit_violations(identifier, endpoint);

-- ============================================================================
-- COMPLIANCE
-- ============================================================================

-- Consent records
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  purpose TEXT NOT NULL CHECK (purpose IN ('necessary', 'analytics', 'marketing')),
  consent_given BOOLEAN NOT NULL,

  -- Consent details
  consented_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,

  -- Audit trail
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  consent_version TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consent_user ON consent_records(user_id, purpose, created_at DESC);

-- Data subject requests (GDPR/CCPA)
CREATE TABLE data_subject_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Requester
  user_id UUID REFERENCES users(id),
  email TEXT NOT NULL,

  -- Request details
  request_type TEXT NOT NULL CHECK (
    request_type IN ('access', 'rectification', 'erasure', 'portability', 'restriction', 'objection')
  ),
  regulation TEXT NOT NULL CHECK (regulation IN ('GDPR', 'CCPA', 'PIPEDA', 'APP')),

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'verified', 'processing', 'completed', 'rejected')
  ),

  -- Verification
  verification_code TEXT,
  verification_method TEXT CHECK (verification_method IN ('email', 'sms', 'account')),
  verified_at TIMESTAMPTZ,

  -- Processing
  assigned_to UUID REFERENCES users(id),
  processing_notes TEXT,

  -- Response
  response_data JSONB,
  completed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- SLA tracking
  due_date TIMESTAMPTZ,  -- 30 days from request

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dsr_status ON data_subject_requests(status, due_date);
CREATE INDEX idx_dsr_user ON data_subject_requests(user_id, created_at DESC);

-- Data deletion log (for compliance)
CREATE TABLE deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  deleted_count INTEGER NOT NULL,
  deletion_method TEXT NOT NULL CHECK (deletion_method IN ('automatic', 'manual', 'dsr')),

  -- Context
  initiated_by UUID REFERENCES users(id),
  reason TEXT,

  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Encryption helper functions
CREATE OR REPLACE FUNCTION encrypt_field(data TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(data, key);
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_field(data BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(data, key);
$$ LANGUAGE SQL SECURITY DEFINER;

-- Permission check function
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
    AND organization_id = COALESCE(
      target_org_id,
      (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1)
    );

  -- Check if role has required permission
  RETURN EXISTS (
    SELECT 1 FROM role_permissions
    WHERE role = user_role
      AND permission = required_permission
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit logging function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_event_type TEXT,
  p_severity TEXT,
  p_resource TEXT,
  p_resource_id TEXT,
  p_operation TEXT,
  p_result JSONB,
  p_context JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO audit_logs (
    event_type,
    severity,
    user_id,
    organization_id,
    ip_address,
    resource,
    resource_id,
    operation,
    result,
    context
  ) VALUES (
    p_event_type,
    p_severity,
    auth.uid(),
    (SELECT organization_id FROM user_organizations WHERE user_id = auth.uid() LIMIT 1),
    inet_client_addr(),
    p_resource,
    p_resource_id,
    p_operation,
    p_result,
    p_context
  ) RETURNING id INTO audit_id;

  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule hard delete function
CREATE OR REPLACE FUNCTION schedule_hard_delete()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deleted_at = NOW();
  NEW.hard_delete_at = NOW() + INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Execute hard deletes (run via cron)
CREATE OR REPLACE FUNCTION execute_hard_deletes()
RETURNS void AS $$
BEGIN
  -- Delete users
  DELETE FROM users WHERE hard_delete_at < NOW();

  -- Delete documents (triggers storage deletion)
  DELETE FROM documents WHERE hard_delete_at < NOW();

  -- Delete organizations
  DELETE FROM organizations WHERE hard_delete_at < NOW();

  -- Log deletions
  INSERT INTO deletion_audit_log (table_name, deleted_count, deletion_method)
  SELECT 'users', COUNT(*), 'automatic' FROM users WHERE hard_delete_at < NOW()
  UNION ALL
  SELECT 'documents', COUNT(*), 'automatic' FROM documents WHERE hard_delete_at < NOW()
  UNION ALL
  SELECT 'organizations', COUNT(*), 'automatic' FROM organizations WHERE hard_delete_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log super admin access
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
    operation
  ) VALUES (
    admin_id,
    table_name,
    resource_id,
    operation
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

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_organizations_updated_at BEFORE UPDATE ON user_organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER api_keys_updated_at BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Soft delete triggers
CREATE TRIGGER users_soft_delete BEFORE UPDATE OF deleted_at ON users
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION schedule_hard_delete();

CREATE TRIGGER documents_soft_delete BEFORE UPDATE OF deleted_at ON documents
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION schedule_hard_delete();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY organization_isolation ON organizations
  FOR ALL
  USING (
    id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users policies
CREATE POLICY user_isolation ON users
  FOR SELECT
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_organizations uo1
      JOIN user_organizations uo2 ON uo1.organization_id = uo2.organization_id
      WHERE uo1.user_id = auth.uid()
        AND uo2.user_id = users.id
    )
  );

CREATE POLICY user_update_self ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- User organizations policies
CREATE POLICY user_org_read ON user_organizations
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY user_org_manage ON user_organizations
  FOR ALL
  USING (
    has_permission('users.manage', organization_id)
  )
  WITH CHECK (
    has_permission('users.manage', organization_id)
  );

-- Documents policies
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

CREATE POLICY document_shared_access ON documents
  FOR SELECT
  USING (
    id IN (
      SELECT document_id
      FROM document_shares
      WHERE (shared_with_user_id = auth.uid() OR shared_with_email = auth.email())
        AND expires_at > NOW()
        AND revoked_at IS NULL
    )
  );

CREATE POLICY document_create_permission ON documents
  FOR INSERT
  WITH CHECK (has_permission('documents.create', organization_id));

CREATE POLICY document_delete_permission ON documents
  FOR DELETE
  USING (has_permission('documents.delete', organization_id));

-- API Keys policies
CREATE POLICY api_key_isolation ON api_keys
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

-- Audit logs policies
CREATE POLICY audit_log_isolation ON audit_logs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND (
      user_id = auth.uid() OR
      has_permission('audit.view', organization_id)
    )
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default role permissions
INSERT INTO role_permissions (role, permission, description) VALUES
  -- Super Admin (all permissions)
  ('SUPER_ADMIN', '*', 'Full system access'),

  -- Org Admin
  ('ORG_ADMIN', 'documents.*', 'Full document access'),
  ('ORG_ADMIN', 'users.*', 'Full user management'),
  ('ORG_ADMIN', 'billing.*', 'Full billing access'),
  ('ORG_ADMIN', 'settings.*', 'Full settings access'),
  ('ORG_ADMIN', 'audit.*', 'Full audit log access'),
  ('ORG_ADMIN', 'api.*', 'Full API access'),

  -- Org Manager
  ('ORG_MANAGER', 'documents.create', 'Create documents'),
  ('ORG_MANAGER', 'documents.read', 'Read documents'),
  ('ORG_MANAGER', 'documents.update', 'Update documents'),
  ('ORG_MANAGER', 'documents.delete', 'Delete documents'),
  ('ORG_MANAGER', 'documents.share', 'Share documents'),
  ('ORG_MANAGER', 'users.invite', 'Invite users'),
  ('ORG_MANAGER', 'users.read', 'View users'),
  ('ORG_MANAGER', 'billing.view', 'View billing'),
  ('ORG_MANAGER', 'settings.view', 'View settings'),

  -- Org Member
  ('ORG_MEMBER', 'documents.create', 'Create documents'),
  ('ORG_MEMBER', 'documents.read', 'Read documents'),
  ('ORG_MEMBER', 'documents.update', 'Update own documents'),
  ('ORG_MEMBER', 'api.read', 'Read via API'),
  ('ORG_MEMBER', 'api.write', 'Write via API'),

  -- Org Viewer
  ('ORG_VIEWER', 'documents.read', 'Read documents'),
  ('ORG_VIEWER', 'api.read', 'Read via API'),

  -- External Auditor
  ('EXTERNAL_AUDITOR', 'audit.view', 'View audit logs'),
  ('EXTERNAL_AUDITOR', 'audit.export', 'Export audit logs');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organization entities with security and compliance settings';
COMMENT ON TABLE users IS 'User profiles with encrypted PII and security preferences';
COMMENT ON TABLE user_organizations IS 'Many-to-many relationship between users and organizations with RBAC';
COMMENT ON TABLE documents IS 'Secure document storage with encryption and retention policies';
COMMENT ON TABLE api_keys IS 'API key management with scoping and rate limiting';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance (partitioned by month)';
COMMENT ON TABLE security_events IS 'Security incident tracking and monitoring';
COMMENT ON TABLE consent_records IS 'GDPR/CCPA consent management';
COMMENT ON TABLE data_subject_requests IS 'GDPR/CCPA data subject rights requests';

COMMENT ON FUNCTION has_permission IS 'Check if current user has specific permission in organization';
COMMENT ON FUNCTION log_audit_event IS 'Log security/compliance audit event';
COMMENT ON FUNCTION execute_hard_deletes IS 'Permanently delete soft-deleted records after retention period';
