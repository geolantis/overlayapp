// PDF Processing Edge Function
// Handles PDF upload, extraction, and OCR processing

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PDFProcessRequest {
  documentId: string;
  organizationId: string;
  performOCR?: boolean;
  extractPages?: boolean;
  generateThumbnails?: boolean;
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

    const requestData: PDFProcessRequest = await req.json();
    const { documentId, organizationId, performOCR = true, extractPages = true, generateThumbnails = true } = requestData;

    // Validate access to organization
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
      p_usage_type: 'pdf_upload',
    });

    if (limitError || !limitCheck) {
      return new Response(JSON.stringify({ error: 'Usage limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get document details
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('id, name, storage_path, storage_bucket, file_size')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from(document.storage_bucket)
      .download(document.storage_path);

    if (downloadError || !fileData) {
      return new Response(JSON.stringify({ error: 'Failed to download PDF' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create PDF document record
    const { data: pdfDocument, error: pdfError } = await supabaseClient
      .from('pdf_documents')
      .insert({
        document_id: documentId,
        organization_id: organizationId,
        page_count: 0, // Will be updated after processing
        file_size_bytes: document.file_size,
        processing_status: 'processing',
        processing_started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pdfError) {
      return new Response(JSON.stringify({ error: 'Failed to create PDF record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create processing job
    const { data: job, error: jobError } = await supabaseClient
      .from('processing_jobs')
      .insert({
        organization_id: organizationId,
        job_type: 'pdf_process',
        status: 'running',
        pdf_document_id: pdfDocument.id,
        started_at: new Date().toISOString(),
        metadata: {
          perform_ocr: performOCR,
          extract_pages: extractPages,
          generate_thumbnails: generateThumbnails,
        },
        created_by: user.id,
      })
      .select()
      .single();

    if (jobError) {
      return new Response(JSON.stringify({ error: 'Failed to create processing job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Track usage
    await supabaseClient.rpc('track_usage', {
      p_organization_id: organizationId,
      p_usage_type: 'pdf_upload',
      p_quantity: 1,
      p_resource_id: documentId,
      p_metadata: {
        file_size: document.file_size,
        document_name: document.name,
      },
    });

    // TODO: Implement actual PDF processing
    // This would typically involve:
    // 1. Using pdf-lib or pdfjs to extract metadata
    // 2. Converting pages to images
    // 3. Running OCR with Tesseract
    // 4. Extracting text and searchable content
    // 5. Generating thumbnails
    // 6. Uploading processed assets to storage

    // For now, return job information
    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        pdf_document_id: pdfDocument.id,
        status: 'processing',
        message: 'PDF processing started',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing PDF:', error);
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
