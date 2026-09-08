// Supabase Edge Function: verify-payment
// Securely verifies signature / payment confirmation and atomically fulfills credits

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      orderId,
      providerPaymentId,
      providerOrderId,
      providerSignature,
    } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'ORDER_ID_REQUIRED' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Fetch the existing order from database
    const { data: order, error: orderFetchError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderFetchError || !order) {
      return new Response(JSON.stringify({ error: 'ORDER_NOT_FOUND', message: 'Payment order does not exist.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enforce Tenant & Order Ownership Isolation: verify caller belongs to this shop
    const { data: member } = await supabaseClient
      .from('shop_members')
      .select('shop_id')
      .eq('user_id', user.id)
      .eq('shop_id', order.shop_id)
      .maybeSingle();

    if (!member && order.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'FORBIDDEN', message: 'Unauthorized order verification attempt.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. HMAC Signature verification with Payment Gateway Secret
    const razorpayKeySecret = Deno.env.get('PAYMENT_GATEWAY_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      // Payment gateway is intentionally unconfigured / pending integration
      return new Response(
        JSON.stringify({
          success: false,
          error: 'GATEWAY_PENDING',
          message: 'Payment gateway is pending configuration. Real payment verification requires active gateway credentials.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!providerOrderId || !providerPaymentId || !providerSignature) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'MISSING_PAYMENT_PROOF',
          message: 'Missing required payment verification parameters from payment gateway.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const payload = `${providerOrderId}|${providerPaymentId}`;
    const isValid = await verifyHmacSha256(payload, providerSignature, razorpayKeySecret);

    if (!isValid) {
      console.error('[verify-payment] Invalid HMAC signature for order:', orderId);
      await supabaseAdmin.rpc('mark_payment_order_failed', {
        p_order_id: orderId,
        p_error_message: 'Invalid payment signature from payment gateway',
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Payment verification failed due to invalid gateway signature.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Call atomic idempotent fulfillment stored procedure
    const { data: fulfillResult, error: fulfillError } = await supabaseAdmin.rpc(
      'fulfill_payment_order',
      {
        p_order_id: orderId,
        p_provider_payment_id: providerPaymentId || null,
        p_provider_signature: providerSignature || null,
      }
    );

    if (fulfillError) {
      console.error('[verify-payment] Stored procedure fulfill error:', fulfillError);
      return new Response(
        JSON.stringify({
          success: false,
          error: fulfillError.message || 'FULFILLMENT_FAILED',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: order.id,
          packageId: order.package_id,
          credits: order.credits,
          amount: order.amount,
          currency: order.currency,
          status: 'paid',
          providerPaymentId: providerPaymentId || null,
          createdAt: order.created_at,
        },
        creditsAdded: order.credits,
        remainingCredits: fulfillResult?.remaining_credits,
        totalCredits: fulfillResult?.total_credits,
        alreadyFulfilled: fulfillResult?.already_fulfilled || false,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[verify-payment] Fatal Exception:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
