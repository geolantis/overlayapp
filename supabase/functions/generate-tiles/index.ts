// Map Tile Generation Edge Function
// Generates map tiles for georeferenced PDF overlays

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TileGenerationRequest {
  overlayId: string;
  organizationId: string;
  zoomLevels?: number[];
  priority?: number;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requestData: TileGenerationRequest = await req.json();
    const { overlayId, organizationId, zoomLevels = [0, 1, 2, 3, 4, 5, 6], priority = 5 } = requestData;

    // Validate access
    const { data: membership, error: membershipError } = await supabaseClient
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check usage limits
    const { data: limitCheck, error: limitError } = await supabaseClient.rpc('check_usage_limit', {
      p_organization_id: organizationId,
      p_usage_type: 'tile_generation',
    });

    if (limitError || !limitCheck) {
      return new Response(JSON.stringify({ error: 'Usage limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get overlay details
    const { data: overlay, error: overlayError } = await supabaseClient
      .from('overlays')
      .select(`
        id,
        name,
        is_georeferenced,
        bounds_north,
        bounds_south,
        bounds_east,
        bounds_west,
        pdf_document_id,
        pdf_documents (
          document_id,
          documents (
            storage_path,
            storage_bucket
          )
        )
      `)
      .eq('id', overlayId)
      .single();

    if (overlayError || !overlay) {
      return new Response(JSON.stringify({ error: 'Overlay not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify overlay is georeferenced
    if (!overlay.is_georeferenced) {
      return new Response(JSON.stringify({ error: 'Overlay must be georeferenced before tile generation' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate total tiles needed
    const totalTiles = zoomLevels.reduce((sum, zoom) => {
      const tilesAtZoom = Math.pow(4, zoom); // Approximate
      return sum + tilesAtZoom;
    }, 0);

    // Create processing job
    const { data: job, error: jobError } = await supabaseClient
      .from('processing_jobs')
      .insert({
        organization_id: organizationId,
        job_type: 'tile_generation',
        status: 'running',
        overlay_id: overlayId,
        priority,
        total_steps: totalTiles,
        current_step: 'Initializing tile generation',
        started_at: new Date().toISOString(),
        metadata: {
          zoom_levels: zoomLevels,
          bounds: {
            north: overlay.bounds_north,
            south: overlay.bounds_south,
            east: overlay.bounds_east,
            west: overlay.bounds_west,
          },
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError) {
      return new Response(JSON.stringify({ error: 'Failed to create tile generation job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Track usage
    await supabaseClient.rpc('track_usage', {
      p_organization_id: organizationId,
      p_usage_type: 'tile_generation',
      p_quantity: totalTiles,
      p_resource_id: overlayId,
      p_metadata: {
        zoom_levels: zoomLevels,
        overlay_name: overlay.name,
      },
    });

    // TODO: Implement actual tile generation
    // This would typically involve:
    // 1. Loading the georeferenced PDF
    // 2. Calculating tile boundaries for each zoom level
    // 3. Rendering tiles using Sharp or similar
    // 4. Applying coordinate transformations
    // 5. Uploading tiles to storage
    // 6. Creating overlay_tiles records

    // For now, return job information
    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        overlay_id: overlayId,
        status: 'processing',
        estimated_tiles: totalTiles,
        zoom_levels: zoomLevels,
        message: 'Tile generation started',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating tiles:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
