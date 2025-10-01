-- Migration: PDF Overlay and Map Schema
-- Version: 002
-- Description: PDF processing, map overlays, georeferencing with PostGIS support

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ============================================================================
-- PDF DOCUMENTS
-- ============================================================================

-- PDF documents table (extends documents)
CREATE TABLE pdf_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- PDF metadata
  page_count INTEGER NOT NULL,
  pdf_version TEXT,
  file_size_bytes BIGINT NOT NULL,

  -- Processing status
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    processing_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')
  ),
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  processing_progress INTEGER DEFAULT 0 CHECK (processing_progress >= 0 AND processing_progress <= 100),

  -- Page extraction
  pages_extracted BOOLEAN DEFAULT FALSE,
  thumbnail_generated BOOLEAN DEFAULT FALSE,

  -- OCR
  ocr_completed BOOLEAN DEFAULT FALSE,
  ocr_language TEXT DEFAULT 'eng',
  searchable_text TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(document_id)
);

-- PDF pages table
CREATE TABLE pdf_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_document_id UUID NOT NULL REFERENCES pdf_documents(id) ON DELETE CASCADE,

  -- Page details
  page_number INTEGER NOT NULL,
  width_pixels INTEGER NOT NULL,
  height_pixels INTEGER NOT NULL,
  rotation_degrees INTEGER DEFAULT 0 CHECK (rotation_degrees IN (0, 90, 180, 270)),

  -- Storage
  image_url TEXT,  -- Rendered page image
  thumbnail_url TEXT,
  storage_path TEXT,

  -- OCR
  ocr_text TEXT,
  ocr_confidence NUMERIC(5,2),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(pdf_document_id, page_number)
);

CREATE INDEX idx_pdf_pages_document ON pdf_pages(pdf_document_id, page_number);

-- ============================================================================
-- MAP OVERLAYS
-- ============================================================================

-- Overlays table
CREATE TABLE overlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pdf_document_id UUID NOT NULL REFERENCES pdf_documents(id) ON DELETE CASCADE,

  -- Overlay details
  name TEXT NOT NULL,
  description TEXT,

  -- Map configuration
  map_provider TEXT NOT NULL DEFAULT 'mapbox' CHECK (
    map_provider IN ('mapbox', 'google', 'osm', 'esri')
  ),
  map_style TEXT DEFAULT 'streets',

  -- Georeferencing
  is_georeferenced BOOLEAN DEFAULT FALSE,
  coordinate_system TEXT DEFAULT 'EPSG:4326',  -- WGS84

  -- Bounds (in WGS84)
  bounds_north NUMERIC(10,7),
  bounds_south NUMERIC(10,7),
  bounds_east NUMERIC(10,7),
  bounds_west NUMERIC(10,7),
  bounds_geometry GEOMETRY(POLYGON, 4326),

  -- Transformation parameters
  gcps JSONB,  -- Ground Control Points
  transformation_matrix NUMERIC[][],

  -- Opacity and blending
  opacity NUMERIC(3,2) DEFAULT 0.70 CHECK (opacity >= 0 AND opacity <= 1),
  blend_mode TEXT DEFAULT 'normal' CHECK (
    blend_mode IN ('normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten')
  ),

  -- Visibility
  visible BOOLEAN DEFAULT TRUE,
  z_index INTEGER DEFAULT 0,

  -- Access control
  is_public BOOLEAN DEFAULT FALSE,

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_overlays_organization ON overlays(organization_id);
CREATE INDEX idx_overlays_pdf_document ON overlays(pdf_document_id);
CREATE INDEX idx_overlays_bounds ON overlays USING GIST(bounds_geometry);
CREATE INDEX idx_overlays_created_by ON overlays(created_by);

-- Overlay tiles table (for tile generation)
CREATE TABLE overlay_tiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overlay_id UUID NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,

  -- Tile coordinates
  zoom_level INTEGER NOT NULL CHECK (zoom_level >= 0 AND zoom_level <= 22),
  tile_x INTEGER NOT NULL,
  tile_y INTEGER NOT NULL,

  -- Storage
  tile_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER,

  -- Status
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Cache control
  cache_until TIMESTAMPTZ,

  UNIQUE(overlay_id, zoom_level, tile_x, tile_y)
);

CREATE INDEX idx_overlay_tiles_overlay ON overlay_tiles(overlay_id);
CREATE INDEX idx_overlay_tiles_coordinates ON overlay_tiles(overlay_id, zoom_level, tile_x, tile_y);

-- ============================================================================
-- GEOREFERENCING
-- ============================================================================

-- Ground Control Points
CREATE TABLE ground_control_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overlay_id UUID NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,

  -- PDF coordinates (pixels)
  pixel_x NUMERIC(10,2) NOT NULL,
  pixel_y NUMERIC(10,2) NOT NULL,

  -- Geographic coordinates (WGS84)
  latitude NUMERIC(10,7) NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude NUMERIC(10,7) NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  location_point GEOMETRY(POINT, 4326),

  -- Quality metrics
  accuracy_meters NUMERIC(10,2),
  confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Metadata
  source TEXT,  -- 'manual', 'automated', 'imported'
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_gcp_overlay ON ground_control_points(overlay_id);
CREATE INDEX idx_gcp_location ON ground_control_points USING GIST(location_point);

-- Coordinate transformation history
CREATE TABLE transformation_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  overlay_id UUID NOT NULL REFERENCES overlays(id) ON DELETE CASCADE,

  -- Transformation details
  transformation_type TEXT NOT NULL CHECK (
    transformation_type IN ('affine', 'polynomial', 'tps', 'projective')
  ),
  gcp_count INTEGER NOT NULL,
  rmse_error NUMERIC(10,4),  -- Root Mean Square Error in meters

  -- Parameters
  transformation_params JSONB NOT NULL,

  -- Status
  applied BOOLEAN DEFAULT FALSE,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_transformation_history_overlay ON transformation_history(overlay_id, created_at DESC);

-- ============================================================================
-- MAP FEATURES
-- ============================================================================

-- Custom map features (annotations, markers, polygons)
CREATE TABLE map_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  overlay_id UUID REFERENCES overlays(id) ON DELETE CASCADE,

  -- Feature type
  feature_type TEXT NOT NULL CHECK (
    feature_type IN ('marker', 'line', 'polygon', 'circle', 'annotation')
  ),

  -- Geometry
  geometry GEOMETRY(GEOMETRY, 4326) NOT NULL,

  -- Style
  style JSONB DEFAULT '{
    "color": "#3388ff",
    "weight": 3,
    "opacity": 0.8,
    "fillColor": "#3388ff",
    "fillOpacity": 0.2
  }'::JSONB,

  -- Properties
  properties JSONB DEFAULT '{}'::JSONB,
  name TEXT,
  description TEXT,

  -- Visibility
  visible BOOLEAN DEFAULT TRUE,
  z_index INTEGER DEFAULT 0,

  -- Ownership
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_map_features_organization ON map_features(organization_id);
CREATE INDEX idx_map_features_overlay ON map_features(overlay_id);
CREATE INDEX idx_map_features_geometry ON map_features USING GIST(geometry);
CREATE INDEX idx_map_features_type ON map_features(feature_type);

-- ============================================================================
-- PROCESSING JOBS
-- ============================================================================

-- Background processing jobs
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Job details
  job_type TEXT NOT NULL CHECK (
    job_type IN ('pdf_upload', 'pdf_process', 'tile_generation', 'georeferencing', 'ocr')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'cancelled')
  ),

  -- Related resources
  pdf_document_id UUID REFERENCES pdf_documents(id) ON DELETE CASCADE,
  overlay_id UUID REFERENCES overlays(id) ON DELETE CASCADE,

  -- Progress tracking
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT,
  total_steps INTEGER,

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_completion_at TIMESTAMPTZ,

  -- Results
  result JSONB,
  error_message TEXT,
  error_stack TEXT,

  -- Retry logic
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Priority
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_processing_jobs_status ON processing_jobs(status, priority DESC, created_at);
CREATE INDEX idx_processing_jobs_organization ON processing_jobs(organization_id, created_at DESC);
CREATE INDEX idx_processing_jobs_pdf ON processing_jobs(pdf_document_id);
CREATE INDEX idx_processing_jobs_overlay ON processing_jobs(overlay_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update updated_at trigger
CREATE TRIGGER pdf_documents_updated_at BEFORE UPDATE ON pdf_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER overlays_updated_at BEFORE UPDATE ON overlays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER map_features_updated_at BEFORE UPDATE ON map_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER processing_jobs_updated_at BEFORE UPDATE ON processing_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate bounds geometry from coordinates
CREATE OR REPLACE FUNCTION update_overlay_bounds_geometry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bounds_north IS NOT NULL AND NEW.bounds_south IS NOT NULL
     AND NEW.bounds_east IS NOT NULL AND NEW.bounds_west IS NOT NULL THEN
    NEW.bounds_geometry = ST_MakeEnvelope(
      NEW.bounds_west,
      NEW.bounds_south,
      NEW.bounds_east,
      NEW.bounds_north,
      4326
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER overlays_bounds_geometry BEFORE INSERT OR UPDATE ON overlays
  FOR EACH ROW EXECUTE FUNCTION update_overlay_bounds_geometry();

-- Update GCP location_point from coordinates
CREATE OR REPLACE FUNCTION update_gcp_location_point()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gcp_location_point BEFORE INSERT OR UPDATE ON ground_control_points
  FOR EACH ROW EXECUTE FUNCTION update_gcp_location_point();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlays ENABLE ROW LEVEL SECURITY;
ALTER TABLE overlay_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ground_control_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE transformation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_jobs ENABLE ROW LEVEL SECURITY;

-- PDF documents policies
CREATE POLICY pdf_documents_isolation ON pdf_documents
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- PDF pages policies
CREATE POLICY pdf_pages_isolation ON pdf_pages
  FOR ALL
  USING (
    pdf_document_id IN (
      SELECT id FROM pdf_documents WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Overlays policies
CREATE POLICY overlays_isolation ON overlays
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY overlays_public_read ON overlays
  FOR SELECT
  USING (is_public = TRUE);

-- Overlay tiles policies
CREATE POLICY overlay_tiles_isolation ON overlay_tiles
  FOR ALL
  USING (
    overlay_id IN (
      SELECT id FROM overlays WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY overlay_tiles_public_read ON overlay_tiles
  FOR SELECT
  USING (
    overlay_id IN (SELECT id FROM overlays WHERE is_public = TRUE)
  );

-- Ground control points policies
CREATE POLICY gcp_isolation ON ground_control_points
  FOR ALL
  USING (
    overlay_id IN (
      SELECT id FROM overlays WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Transformation history policies
CREATE POLICY transformation_history_isolation ON transformation_history
  FOR ALL
  USING (
    overlay_id IN (
      SELECT id FROM overlays WHERE organization_id IN (
        SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Map features policies
CREATE POLICY map_features_isolation ON map_features
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Processing jobs policies
CREATE POLICY processing_jobs_isolation ON processing_jobs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE pdf_documents IS 'PDF processing metadata and status tracking';
COMMENT ON TABLE pdf_pages IS 'Individual pages extracted from PDFs with OCR';
COMMENT ON TABLE overlays IS 'Map overlays with georeferencing and transformation data';
COMMENT ON TABLE overlay_tiles IS 'Generated map tiles for overlay rendering';
COMMENT ON TABLE ground_control_points IS 'Georeferencing control points for coordinate transformation';
COMMENT ON TABLE transformation_history IS 'History of coordinate transformation calculations';
COMMENT ON TABLE map_features IS 'Custom annotations and features on map overlays';
COMMENT ON TABLE processing_jobs IS 'Background job queue for PDF and tile processing';
