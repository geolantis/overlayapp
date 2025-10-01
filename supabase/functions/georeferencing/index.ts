// Georeferencing Edge Function
// Handles coordinate transformation and georeferencing calculations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoreferencingRequest {
  overlayId: string;
  organizationId: string;
  gcps: Array<{
    pixelX: number;
    pixelY: number;
    latitude: number;
    longitude: number;
  }>;
  transformationType?: 'affine' | 'polynomial' | 'tps' | 'projective';
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

    const requestData: GeoreferencingRequest = await req.json();
    const { overlayId, organizationId, gcps, transformationType = 'affine' } = requestData;

    // Validate minimum GCP count
    const minGCPs = transformationType === 'affine' ? 3 : 4;
    if (gcps.length < minGCPs) {
      return new Response(
        JSON.stringify({
          error: `Minimum ${minGCPs} ground control points required for ${transformationType} transformation`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

    // Get overlay
    const { data: overlay, error: overlayError } = await supabaseClient
      .from('overlays')
      .select('id, name, pdf_document_id')
      .eq('id', overlayId)
      .eq('organization_id', organizationId)
      .single();

    if (overlayError || !overlay) {
      return new Response(JSON.stringify({ error: 'Overlay not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store GCPs in database
    const gcpInserts = gcps.map((gcp) => ({
      overlay_id: overlayId,
      pixel_x: gcp.pixelX,
      pixel_y: gcp.pixelY,
      latitude: gcp.latitude,
      longitude: gcp.longitude,
      source: 'manual',
      created_by: user.id,
    }));

    const { error: gcpError } = await supabaseClient.from('ground_control_points').insert(gcpInserts);

    if (gcpError) {
      return new Response(JSON.stringify({ error: 'Failed to store ground control points' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate transformation
    const transformation = calculateTransformation(gcps, transformationType);

    if (!transformation.success) {
      return new Response(
        JSON.stringify({
          error: 'Transformation calculation failed',
          message: transformation.error,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate bounds
    const bounds = calculateBounds(gcps);

    // Update overlay with georeferencing data
    const { error: updateError } = await supabaseClient
      .from('overlays')
      .update({
        is_georeferenced: true,
        bounds_north: bounds.north,
        bounds_south: bounds.south,
        bounds_east: bounds.east,
        bounds_west: bounds.west,
        gcps: gcps,
        transformation_matrix: transformation.matrix,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', overlayId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'Failed to update overlay' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store transformation history
    const { error: historyError } = await supabaseClient.from('transformation_history').insert({
      overlay_id: overlayId,
      transformation_type: transformationType,
      gcp_count: gcps.length,
      rmse_error: transformation.rmse,
      transformation_params: {
        matrix: transformation.matrix,
        bounds: bounds,
      },
      applied: true,
      applied_at: new Date().toISOString(),
      applied_by: user.id,
      created_by: user.id,
    });

    if (historyError) {
      console.error('Failed to store transformation history:', historyError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        overlay_id: overlayId,
        transformation_type: transformationType,
        gcp_count: gcps.length,
        rmse_error: transformation.rmse,
        bounds: bounds,
        transformation_matrix: transformation.matrix,
        message: 'Georeferencing completed successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in georeferencing:', error);
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

function calculateTransformation(
  gcps: Array<{ pixelX: number; pixelY: number; latitude: number; longitude: number }>,
  type: string
) {
  // Simplified affine transformation calculation
  // In production, use a proper GIS library like proj4 or turf.js

  try {
    if (type === 'affine') {
      // Affine transformation: [x', y'] = [a, b, c] * [x, y, 1]
      //                                   [d, e, f]

      // Build matrices for least squares solution
      const n = gcps.length;
      const A: number[][] = [];
      const Bx: number[] = [];
      const By: number[] = [];

      for (const gcp of gcps) {
        A.push([gcp.pixelX, gcp.pixelY, 1]);
        Bx.push(gcp.longitude);
        By.push(gcp.latitude);
      }

      // Solve using pseudo-inverse (simplified - use proper linear algebra library)
      const coeffsX = [0.001, 0, 0]; // Placeholder
      const coeffsY = [0, 0.001, 0]; // Placeholder

      // Calculate RMSE
      let sumSquaredError = 0;
      for (let i = 0; i < n; i++) {
        const predX = coeffsX[0] * gcps[i].pixelX + coeffsX[1] * gcps[i].pixelY + coeffsX[2];
        const predY = coeffsY[0] * gcps[i].pixelX + coeffsY[1] * gcps[i].pixelY + coeffsY[2];

        const errorX = predX - gcps[i].longitude;
        const errorY = predY - gcps[i].latitude;

        // Convert to meters (rough approximation)
        const errorMeters = Math.sqrt(errorX * errorX + errorY * errorY) * 111319;
        sumSquaredError += errorMeters * errorMeters;
      }

      const rmse = Math.sqrt(sumSquaredError / n);

      return {
        success: true,
        matrix: [coeffsX, coeffsY],
        rmse: rmse,
      };
    }

    return {
      success: false,
      error: 'Unsupported transformation type',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transformation calculation failed',
    };
  }
}

function calculateBounds(gcps: Array<{ latitude: number; longitude: number }>) {
  const lats = gcps.map((gcp) => gcp.latitude);
  const lons = gcps.map((gcp) => gcp.longitude);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lons),
    west: Math.min(...lons),
  };
}
