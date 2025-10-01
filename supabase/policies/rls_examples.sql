-- Row Level Security (RLS) Policy Examples
-- Comprehensive examples for multi-tenant security

-- ============================================================================
-- BASIC TENANT ISOLATION
-- ============================================================================

-- Example 1: Simple organization isolation
-- Users can only see records from their own organization

CREATE POLICY "Users can only access their organization's data"
ON documents
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

-- ============================================================================
-- PERMISSION-BASED ACCESS
-- ============================================================================

-- Example 2: Read access with permission check
-- Users can read if they have the documents.read permission

CREATE POLICY "Read documents with permission"
ON documents
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  AND has_permission('documents.read', organization_id)
);

-- Example 3: Create with permission
-- Users can create documents if they have documents.create permission

CREATE POLICY "Create documents with permission"
ON documents
FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  AND has_permission('documents.create', organization_id)
);

-- Example 4: Update own documents or with permission
-- Users can update their own documents or any if they have permission

CREATE POLICY "Update own documents or with permission"
ON documents
FOR UPDATE
USING (
  created_by = auth.uid() OR
  (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND has_permission('documents.update', organization_id)
  )
)
WITH CHECK (
  created_by = auth.uid() OR
  (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND has_permission('documents.update', organization_id)
  )
);

-- Example 5: Delete only with admin permission
-- Only admins can delete documents

CREATE POLICY "Delete documents - admin only"
ON documents
FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
      AND role IN ('ORG_ADMIN', 'SUPER_ADMIN')
  )
);

-- ============================================================================
-- SHARED RESOURCE ACCESS
-- ============================================================================

-- Example 6: Access shared documents
-- Users can access documents shared with them

CREATE POLICY "Access shared documents"
ON documents
FOR SELECT
USING (
  -- Own organization's documents
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  OR
  -- Shared documents
  id IN (
    SELECT document_id
    FROM document_shares
    WHERE (
      shared_with_user_id = auth.uid() OR
      shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND (expires_at IS NULL OR expires_at > NOW())
    AND revoked_at IS NULL
  )
);

-- Example 7: Manage document shares
-- Only document owner or admins can manage shares

CREATE POLICY "Manage document shares"
ON document_shares
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_shares.document_id
      AND (
        d.created_by = auth.uid() OR
        has_permission('documents.share', d.organization_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_shares.document_id
      AND (
        d.created_by = auth.uid() OR
        has_permission('documents.share', d.organization_id)
      )
  )
);

-- ============================================================================
-- TIME-BASED ACCESS CONTROL
-- ============================================================================

-- Example 8: Access during business hours only
-- Restrict access to business hours for sensitive data

CREATE POLICY "Business hours access for restricted documents"
ON documents
FOR SELECT
USING (
  sensitivity != 'restricted' OR
  (
    sensitivity = 'restricted' AND
    EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17 AND
    EXTRACT(DOW FROM NOW()) BETWEEN 1 AND 5 AND
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('ORG_ADMIN', 'ORG_MANAGER')
    )
  )
);

-- ============================================================================
-- GEOGRAPHIC RESTRICTIONS
-- ============================================================================

-- Example 9: Region-based access control
-- Restrict access based on data residency requirements

CREATE POLICY "Geographic access restrictions"
ON documents
FOR SELECT
USING (
  -- Public documents accessible from anywhere
  sensitivity = 'public' OR
  -- Other documents only accessible from allowed regions
  (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
    AND (
      -- Check if user's region matches document's allowed regions
      (SELECT data_region FROM organizations WHERE id = documents.organization_id)
      IN ('us-east-1', 'eu-west-1')  -- Allowed regions
    )
  )
);

-- ============================================================================
-- HIERARCHICAL ACCESS
-- ============================================================================

-- Example 10: Hierarchical role-based access
-- Higher roles can access lower role's data

CREATE POLICY "Hierarchical role access"
ON documents
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
      AND (
        role = 'SUPER_ADMIN' OR  -- Super admins see all
        role = 'ORG_ADMIN' OR    -- Org admins see all in org
        (role = 'ORG_MANAGER' AND documents.sensitivity IN ('public', 'internal', 'confidential')) OR
        (role = 'ORG_MEMBER' AND documents.sensitivity IN ('public', 'internal')) OR
        (role = 'ORG_VIEWER' AND documents.sensitivity = 'public')
      )
  )
);

-- ============================================================================
-- ATTRIBUTE-BASED ACCESS CONTROL (ABAC)
-- ============================================================================

-- Example 11: Tag-based access control
-- Users can only access documents with tags they're authorized for

CREATE POLICY "Tag-based access control"
ON documents
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  AND (
    -- No tags means accessible to all org members
    tags IS NULL OR
    tags = '{}' OR
    -- Check if user has access to all document tags
    NOT EXISTS (
      SELECT 1 FROM unnest(tags) AS tag
      WHERE tag NOT IN (
        SELECT jsonb_array_elements_text(custom_permissions->'allowed_tags')
        FROM user_organizations
        WHERE user_id = auth.uid()
          AND organization_id = documents.organization_id
      )
    )
  )
);

-- ============================================================================
-- AUDIT LOG ACCESS
-- ============================================================================

-- Example 12: Audit log visibility
-- Users see their own logs, admins see all org logs

CREATE POLICY "Audit log visibility"
ON audit_logs
FOR SELECT
USING (
  user_id = auth.uid() OR
  (
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
        AND (
          role IN ('ORG_ADMIN', 'SUPER_ADMIN', 'EXTERNAL_AUDITOR')
          OR has_permission('audit.view', organization_id)
        )
    )
  )
);

-- ============================================================================
-- API KEY ACCESS
-- ============================================================================

-- Example 13: API key scoped access
-- API keys have limited access based on their scopes

CREATE POLICY "API key scoped document access"
ON documents
FOR SELECT
USING (
  -- Regular user access
  (
    auth.uid() IS NOT NULL AND
    organization_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  )
  OR
  -- API key access (checking custom claim)
  (
    auth.jwt()->>'api_key_id' IS NOT NULL AND
    organization_id = (auth.jwt()->>'organization_id')::UUID AND
    (
      -- Check if API key has required scope
      'documents.read' = ANY(
        SELECT jsonb_array_elements_text(auth.jwt()->'scopes')
      )
    )
  )
);

-- ============================================================================
-- SUPER ADMIN BYPASS (WITH LOGGING)
-- ============================================================================

-- Example 14: Super admin access with mandatory logging
-- Super admins can access everything, but all access is logged

CREATE POLICY "Super admin access with logging"
ON documents
FOR ALL
USING (
  -- Regular access
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  OR
  -- Super admin access (with logging)
  (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
        AND role = 'SUPER_ADMIN'
    )
    AND
    -- Logging function always returns true but logs the access
    log_super_admin_access(auth.uid(), 'documents', documents.id, 'SELECT')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  OR
  (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
        AND role = 'SUPER_ADMIN'
    )
    AND
    log_super_admin_access(auth.uid(), 'documents', documents.id, TG_OP)
  )
);

-- ============================================================================
-- COMPLEX CONDITIONAL ACCESS
-- ============================================================================

-- Example 15: Multi-factor conditional access
-- Combine multiple conditions for complex access control

CREATE POLICY "Complex conditional access"
ON documents
FOR SELECT
USING (
  -- Must be in organization
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  AND
  -- Additional conditions based on document sensitivity
  CASE documents.sensitivity
    WHEN 'public' THEN
      -- Public: anyone in org
      TRUE
    WHEN 'internal' THEN
      -- Internal: any member
      EXISTS (
        SELECT 1 FROM user_organizations
        WHERE user_id = auth.uid()
          AND organization_id = documents.organization_id
          AND role IN ('ORG_ADMIN', 'ORG_MANAGER', 'ORG_MEMBER', 'ORG_VIEWER')
      )
    WHEN 'confidential' THEN
      -- Confidential: manager or above with MFA
      EXISTS (
        SELECT 1 FROM user_organizations uo
        JOIN users u ON u.id = uo.user_id
        WHERE uo.user_id = auth.uid()
          AND uo.organization_id = documents.organization_id
          AND uo.role IN ('ORG_ADMIN', 'ORG_MANAGER')
          AND u.mfa_enabled = TRUE
      )
    WHEN 'restricted' THEN
      -- Restricted: admin only with MFA during business hours
      EXISTS (
        SELECT 1 FROM user_organizations uo
        JOIN users u ON u.id = uo.user_id
        WHERE uo.user_id = auth.uid()
          AND uo.organization_id = documents.organization_id
          AND uo.role = 'ORG_ADMIN'
          AND u.mfa_enabled = TRUE
      )
      AND EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 17
      AND EXTRACT(DOW FROM NOW()) BETWEEN 1 AND 5
  END
);

-- ============================================================================
-- HELPER VIEWS
-- ============================================================================

-- View to check user's effective permissions
CREATE OR REPLACE VIEW user_effective_permissions AS
SELECT
  uo.user_id,
  uo.organization_id,
  uo.role,
  array_agg(DISTINCT rp.permission) AS permissions
FROM user_organizations uo
JOIN role_permissions rp ON rp.role = uo.role
GROUP BY uo.user_id, uo.organization_id, uo.role;

-- View to check document access for current user
CREATE OR REPLACE VIEW accessible_documents AS
SELECT
  d.*,
  CASE
    WHEN d.created_by = auth.uid() THEN 'owner'
    WHEN EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
        AND organization_id = d.organization_id
        AND role IN ('ORG_ADMIN', 'ORG_MANAGER')
    ) THEN 'manager'
    WHEN EXISTS (
      SELECT 1 FROM document_shares
      WHERE document_id = d.id
        AND shared_with_user_id = auth.uid()
    ) THEN 'shared'
    ELSE 'member'
  END AS access_type
FROM documents d
WHERE
  -- In user's organization
  d.organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
  OR
  -- Shared with user
  d.id IN (
    SELECT document_id
    FROM document_shares
    WHERE shared_with_user_id = auth.uid()
      AND (expires_at IS NULL OR expires_at > NOW())
      AND revoked_at IS NULL
  );

COMMENT ON POLICY "Users can only access their organization's data" ON documents IS
  'Basic tenant isolation - users can only access resources from their organization';

COMMENT ON POLICY "Read documents with permission" ON documents IS
  'Permission-based read access using has_permission() function';

COMMENT ON POLICY "Access shared documents" ON documents IS
  'Allow access to documents explicitly shared with user via document_shares table';

COMMENT ON POLICY "Business hours access for restricted documents" ON documents IS
  'Time-based access control - restrict sensitive data access to business hours';

COMMENT ON POLICY "Super admin access with logging" ON documents IS
  'Super admin bypass with mandatory audit logging for compliance';

COMMENT ON VIEW accessible_documents IS
  'Helper view showing all documents accessible to current user with access type';
