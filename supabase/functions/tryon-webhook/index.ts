// Supabase Edge Function: tryon-webhook
// Receives asynchronous job completion and failure webhooks from PixelAPI (POST https://api.pixelapi.dev)
// Persists generated try-on imagery into private Supabase Storage ('tryon-results' bucket)
// Enforces atomic refund idempotency on failure

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
    }

    // Log only identifying/status metadata — never the payload verbatim, since it
    // may carry base64 image data or signed URLs.
    console.log('[tryon-webhook] Received:', JSON.stringify({
      job_id: payload.job_id || payload.generation_id || payload.id || null,
      result_id: payload.metadata?.result_id || payload.result_id || null,
      status: payload.status || null,
      phase: payload.phase || payload.progress || null,
      has_output_url: Boolean(payload.output_url || payload.result_url || payload.result_image_url || payload.image_url || (Array.isArray(payload.result_urls) && payload.result_urls.length > 0)),
      has_base64_image: Boolean(payload.result_image_b64 || payload.image_base64),
      error: payload.error || payload.error_message || null,
    }));

    const jobId = payload.job_id || payload.generation_id || payload.id;
    const resultIdFromMeta = payload.metadata?.result_id || payload.result_id;
    const status = (payload.status || '').toLowerCase();
    const resultUrls = Array.isArray(payload.result_urls) ? payload.result_urls : [];
    const outputUrl =
      (resultUrls.length > 0 ? resultUrls[0] : null) ||
      payload.output_url ||
      payload.result_url ||
      payload.result_image_url ||
      payload.image_url;
    const base64Image = payload.result_image_b64 || payload.image_base64;
    const errorMessage = payload.error || payload.error_message || payload.message;

    if (!jobId && !resultIdFromMeta) {
      return new Response(JSON.stringify({ error: 'job_id or result_id required' }), { status: 400 });
    }

    // 1. Locate existing Try-On Result record
    let query = supabaseAdmin.from('try_on_results').select('id, shop_id, status, job_id');
    if (resultIdFromMeta) {
      query = query.eq('id', resultIdFromMeta);
    } else {
      query = query.eq('job_id', jobId);
    }

    const { data: tryOn, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !tryOn) {
      console.warn('Try-On record not found for webhook event:', { jobId, resultIdFromMeta });
      return new Response(JSON.stringify({ error: 'TRY_ON_NOT_FOUND' }), { status: 404 });
    }

    // 2. Enforce Webhook Idempotency: Ignore already finalized records
    if (tryOn.status === 'Completed') {
      return new Response(JSON.stringify({ success: true, message: 'Already processed as Completed' }), { status: 200 });
    }
    if (tryOn.status === 'Failed') {
      return new Response(JSON.stringify({ success: true, message: 'Already processed as Failed' }), { status: 200 });
    }

    // 3. Success Workflow
    if (status === 'completed' || status === 'succeeded' || status === 'success' || outputUrl || base64Image) {
      let finalStoragePath = `tryon-results/${tryOn.shop_id}/${tryOn.id}.png`;
      let imageSaved = false;

      try {
        let imageBlob: Blob | null = null;
        if (outputUrl && outputUrl.startsWith('http')) {
          const imgResponse = await fetch(outputUrl);
          if (imgResponse.ok) {
            imageBlob = await imgResponse.blob();
          }
        } else if (base64Image) {
          const cleanB64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
          const binary = atob(cleanB64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          imageBlob = new Blob([bytes], { type: 'image/png' });
        }

        if (imageBlob && imageBlob.size > 0) {
          const filePath = `${tryOn.shop_id}/${tryOn.id}.png`;
          const { error: uploadError } = await supabaseAdmin.storage
            .from('tryon-results')
            .upload(filePath, imageBlob, {
              contentType: 'image/png',
              upsert: true,
            });

          if (!uploadError) {
            finalStoragePath = `tryon-results/${filePath}`;
            imageSaved = true;
          } else {
            console.error('Storage upload error in webhook:', uploadError.message);
          }
        }
      } catch (dlErr) {
        console.error('Failed to download/persist PixelAPI result image:', (dlErr as Error).message);
      }

      if (!imageSaved) {
        // DO NOT mark completed if image could not be saved!
        // Instead mark as Failed and refund 1 credit.
        await supabaseAdmin
          .from('try_on_results')
          .update({
            status: 'Failed',
            progress_phase: 'failed',
            error_message: 'Generated try-on image could not be retrieved and stored.',
          })
          .eq('id', tryOn.id);

        await supabaseAdmin.rpc('refund_shop_ai_credit', {
          p_shop_id: tryOn.shop_id,
          p_try_on_id: tryOn.id,
          p_reason: 'Image storage persistence failure in webhook',
        });

        return new Response(
          JSON.stringify({ success: false, error: 'IMAGE_SAVE_FAILED' }),
          { status: 500 }
        );
      }

      await supabaseAdmin
        .from('try_on_results')
        .update({
          status: 'Completed',
          progress_phase: 'completed',
          result_image_url: finalStoragePath,
        })
        .eq('id', tryOn.id);

      return new Response(JSON.stringify({ success: true, status: 'Completed' }), { status: 200 });
    }

    // 4. Failure Workflow with Single Idempotent Refund
    if (status === 'failed' || status === 'error') {
      await supabaseAdmin
        .from('try_on_results')
        .update({
          status: 'Failed',
          progress_phase: 'failed',
          error_message: errorMessage || 'PixelAPI generation failed.',
        })
        .eq('id', tryOn.id);

      // Refund 1 credit atomically to the boutique balance
      await supabaseAdmin.rpc('refund_shop_ai_credit', {
        p_shop_id: tryOn.shop_id,
        p_try_on_id: tryOn.id,
        p_reason: `PixelAPI Webhook Failure: ${errorMessage || 'Processing Error'}`,
      });

      return new Response(JSON.stringify({ success: true, status: 'Refunded' }), { status: 200 });
    }

    // 5. Intermediate Progress Update
    if (payload.phase || payload.progress) {
      await supabaseAdmin
        .from('try_on_results')
        .update({
          progress_phase: payload.phase || 'generating',
        })
        .eq('id', tryOn.id);
    }

    return new Response(JSON.stringify({ success: true, received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook execution error:', (error as Error).message);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500 }
    );
  }
});
