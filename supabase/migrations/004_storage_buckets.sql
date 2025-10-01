-- Migration: Storage Buckets and Policies
-- Version: 004
-- Description: Storage bucket configuration and RLS policies for file uploads

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create storage buckets (skip if they already exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- PDF documents bucket (private)
  (
    'pdf-documents',
    'pdf-documents',
    false,
    104857600, -- 100 MB
    ARRAY['application/pdf']::text[]
  ),
  -- PDF page images bucket (private)
  (
    'pdf-pages',
    'pdf-pages',
    false,
    10485760, -- 10 MB per page
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  -- Map tiles bucket (can be public for caching)
  (
    'map-tiles',
    'map-tiles',
    true,
    2097152, -- 2 MB per tile
    ARRAY['image/png', 'image/jpeg', 'image/webp']::text[]
  ),
  -- User avatars bucket (public)
  (
    'avatars',
    'avatars',
    true,
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
  ),
  -- Export files bucket (private)
  (
    'exports',
    'exports',
    false,
    104857600, -- 100 MB
    ARRAY['application/json', 'text/csv', 'application/zip', 'application/x-zip-compressed']::text[]
  ),
  -- Organization assets bucket (private)
  (
    'organization-assets',
    'organization-assets',
    false,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']::text[]
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- PDF Documents Bucket Policies
-- Users can read PDFs from their organization
CREATE POLICY "Users can read own org PDF documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pdf-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can upload PDFs to their organization folder
CREATE POLICY "Users can upload org PDF documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'pdf-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can update their organization's PDFs
CREATE POLICY "Users can update org PDF documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'pdf-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users can delete their organization's PDFs (with permission check)
CREATE POLICY "Users can delete org PDF documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'pdf-documents' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations uo
    JOIN role_permissions rp ON rp.role = uo.role
    WHERE uo.user_id = auth.uid()
      AND rp.permission IN ('documents.delete', 'documents.*', '*')
  )
);

-- PDF Pages Bucket Policies
-- Similar to PDF documents but for extracted pages
CREATE POLICY "Users can read own org PDF pages"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'pdf-pages' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can manage PDF pages"
ON storage.objects FOR ALL
USING (
  bucket_id = 'pdf-pages' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Map Tiles Bucket Policies
-- Tiles are public for caching, but only org members can create them
CREATE POLICY "Anyone can read map tiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'map-tiles');

CREATE POLICY "Users can create org map tiles"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'map-tiles' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete org map tiles"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'map-tiles' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Avatars Bucket Policies
-- Anyone can read avatars (public bucket)
CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Exports Bucket Policies
-- Users can read their own exports
CREATE POLICY "Users can read own exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'exports' AND
  (
    -- User's own exports
    (storage.foldername(name))[1]::uuid = auth.uid()
    OR
    -- Organization exports (if user has permission)
    (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id
      FROM user_organizations uo
      JOIN role_permissions rp ON rp.role = uo.role
      WHERE uo.user_id = auth.uid()
        AND rp.permission IN ('audit.export', 'audit.*', '*')
    )
  )
);

-- System can create exports
CREATE POLICY "System can create exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'exports' AND
  (
    (storage.foldername(name))[1]::uuid = auth.uid()
    OR
    (storage.foldername(name))[1]::uuid IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  )
);

-- Organization Assets Bucket Policies
-- Organization members can read assets
CREATE POLICY "Members can read org assets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Org admins can manage assets
CREATE POLICY "Admins can manage org assets"
ON storage.objects FOR ALL
USING (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT organization_id
    FROM user_organizations uo
    WHERE uo.user_id = auth.uid()
      AND uo.role IN ('ORG_ADMIN', 'SUPER_ADMIN')
  )
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get organization storage usage
CREATE OR REPLACE FUNCTION get_organization_storage_usage(org_id UUID)
RETURNS TABLE (
  bucket_name TEXT,
  file_count BIGINT,
  total_size_bytes BIGINT,
  total_size_gb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.bucket_id as bucket_name,
    COUNT(*)::BIGINT as file_count,
    COALESCE(SUM((o.metadata->>'size')::BIGINT), 0) as total_size_bytes,
    ROUND(COALESCE(SUM((o.metadata->>'size')::BIGINT), 0) / 1073741824.0, 2) as total_size_gb
  FROM storage.objects o
  WHERE (storage.foldername(o.name))[1]::uuid = org_id
    AND o.bucket_id IN ('pdf-documents', 'pdf-pages', 'map-tiles', 'exports', 'organization-assets')
  GROUP BY o.bucket_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old tiles (for cache management)
CREATE OR REPLACE FUNCTION cleanup_old_tiles(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete tile records older than specified days
  WITH deleted AS (
    DELETE FROM overlay_tiles
    WHERE generated_at < NOW() - (days_old || ' days')::INTERVAL
    RETURNING storage_path
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;

  -- Note: Actual file deletion from storage would need to be handled separately
  -- via a scheduled job that uses the storage API

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Note: Comments on storage.objects policies require ownership privileges
-- These are handled by Supabase dashboard or service role key
-- COMMENT ON POLICY "Users can read own org PDF documents" ON storage.objects
--   IS 'Allow users to read PDF documents from their organizations';
--
-- COMMENT ON POLICY "Users can upload org PDF documents" ON storage.objects
--   IS 'Allow users to upload PDF documents to their organizations';
--
-- COMMENT ON POLICY "Anyone can read map tiles" ON storage.objects
--   IS 'Map tiles are public for efficient caching and delivery';

COMMENT ON FUNCTION get_organization_storage_usage
  IS 'Calculate total storage usage per bucket for an organization';

COMMENT ON FUNCTION cleanup_old_tiles
  IS 'Clean up old cached map tiles to manage storage costs';
