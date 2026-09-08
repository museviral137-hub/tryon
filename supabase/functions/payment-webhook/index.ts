// Supabase Edge Function: payment-webhook
// Securely receives asynchronous webhook events from payment gateway (e.g. Razorpay, Cashfree)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

async function verifyHmacSha256(data: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', key, msgData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedSignature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return expectedSignature.toLowerCase() === signature.toLowerCase();
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('PAYMENT_WEBHOOK_SECRET') || Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    // 1. Mandatory HMAC Signature Verification
    if (!webhookSecret) {
      console.warn('[payment-webhook] Payment webhook received but PAYMENT_WEBHOOK_SECRET is not configured on server.');
      return new Response(JSON.stringify({ error: 'WEBHOOK_NOT_CONFIGURED', message: 'Payment gateway webhook is pending configuration.' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!signature) {
      console.error('[payment-webhook] Unauthorized webhook call: missing signature header');
      return new Response(JSON.stringify({ error: 'MISSING_SIGNATURE', message: 'Missing webhook signature header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isValid = await verifyHmacSha256(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('[payment-webhook] Unauthorized webhook call: signature mismatch');
      return new Response(JSON.stringify({ error: 'INVALID_SIGNATURE', message: 'HMAC signature verification failed' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log('[payment-webhook] Received event:', event);

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Handle payment captured or order paid events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const providerOrderId = paymentEntity?.order_id || orderEntity?.id;
      const providerPaymentId = paymentEntity?.id;
      const notes = paymentEntity?.notes || orderEntity?.notes;
      const vestiaiOrderId = notes?.vestiai_order_id;

      let orderRecord: any = null;

      if (vestiaiOrderId) {
        const { data } = await supabaseAdmin
          .from('payment_orders')
          .select('*')
          .eq('id', vestiaiOrderId)
          .single();
        orderRecord = data;
      } else if (providerOrderId) {
        const { data } = await supabaseAdmin
          .from('payment_orders')
          .select('*')
          .eq('provider_order_id', providerOrderId)
          .single();
        orderRecord = data;
      }

      if (orderRecord) {
        // Execute atomic, idempotent fulfillment
        const { data: fulfillResult, error: fulfillError } = await supabaseAdmin.rpc(
          'fulfill_payment_order',
          {
            p_order_id: orderRecord.id,
            p_provider_payment_id: providerPaymentId || null,
            p_provider_signature: signature || null,
          }
        );

        if (fulfillError) {
          console.error('[payment-webhook] Fulfill RPC error:', fulfillError);
        } else {
          console.log('[payment-webhook] Order successfully fulfilled:', orderRecord.id, fulfillResult);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const vestiaiOrderId = paymentEntity?.notes?.vestiai_order_id;
      const errorDesc = paymentEntity?.error_description || 'Payment failed at gateway';

      if (vestiaiOrderId) {
        await supabaseAdmin.rpc('mark_payment_order_failed', {
          p_order_id: vestiaiOrderId,
          p_error_message: errorDesc,
        });
      }
    }

    return new Response(JSON.stringify({ status: 'ok', received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[payment-webhook] Exception:', err);
    return new Response(JSON.stringify({ error: err.message || 'Webhook Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
