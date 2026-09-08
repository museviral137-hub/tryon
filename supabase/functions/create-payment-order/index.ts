// Supabase Edge Function: create-payment-order
// Creates a secure payment order and prepares Razorpay / Gateway payload

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Approved packages config on backend
const CREDIT_PACKAGES: Record<string, { credits: number; amount: number; name: string }> = {
  starter: { credits: 50, amount: 199, name: 'Starter Tier' },
  popular: { credits: 150, amount: 499, name: 'Popular Boutique Tier' },
  pro: { credits: 500, amount: 1499, name: 'Pro Studio Tier' },
  business: { credits: 1000, amount: 2499, name: 'Enterprise Business Tier' },
};

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

    // 1. Verify authenticated user
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
    const { packageId } = body;

    const pkg = CREDIT_PACKAGES[packageId?.toLowerCase()];
    if (!pkg) {
      return new Response(JSON.stringify({ error: 'INVALID_PACKAGE_ID', message: 'Unknown credit package selected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Resolve active boutique shop
    const { data: member, error: memberError } = await supabaseClient
      .from('shop_members')
      .select('shop_id, role, shop:shops(name, email, phone)')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: 'NO_SHOP_MEMBERSHIP', message: 'No active boutique found for user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const shopId = member.shop_id;
    const shop = Array.isArray(member.shop) ? member.shop[0] : member.shop;

    // 3. Create initial pending payment_orders record in Supabase
    const { data: orderRecord, error: orderInsertError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        user_id: user.id,
        shop_id: shopId,
        package_id: packageId.toLowerCase(),
        credits: pkg.credits,
        amount: pkg.amount,
        currency: 'INR',
        status: 'pending',
        provider: 'razorpay',
        notes: {
          packageName: pkg.name,
          userEmail: user.email,
          shopName: shop?.name || 'VestiAI Boutique',
        },
      })
      .select('*')
      .single();

    if (orderInsertError || !orderRecord) {
      console.error('[create-payment-order] Insert order error:', orderInsertError);
      return new Response(JSON.stringify({ error: 'ORDER_CREATION_FAILED', message: orderInsertError?.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. If Razorpay credentials are configured, create server-side Razorpay Order
    const razorpayKeyId = Deno.env.get('PAYMENT_GATEWAY_KEY_ID') || Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('PAYMENT_GATEWAY_SECRET') || Deno.env.get('RAZORPAY_KEY_SECRET');

    let providerOrderId: string | null = null;

    if (razorpayKeyId && razorpayKeySecret) {
      try {
        const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;
        const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(pkg.amount * 100), // paise
            currency: 'INR',
            receipt: `order_${orderRecord.id.slice(0, 16)}`,
            notes: {
              vestiai_order_id: orderRecord.id,
              shop_id: shopId,
              package_id: packageId,
              credits: pkg.credits.toString(),
            },
          }),
        });

        if (rzpResponse.ok) {
          const rzpData = await rzpResponse.json();
          providerOrderId = rzpData.id;

          // Update DB record with provider_order_id
          await supabaseAdmin
            .from('payment_orders')
            .update({ provider_order_id: providerOrderId, status: 'processing' })
            .eq('id', orderRecord.id);
        } else {
          const errText = await rzpResponse.text();
          console.warn('[create-payment-order] Razorpay API warning:', errText);
        }
      } catch (rzpErr) {
        console.warn('[create-payment-order] Razorpay call failed:', rzpErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: {
          id: orderRecord.id,
          packageId: orderRecord.package_id,
          credits: orderRecord.credits,
          amount: orderRecord.amount,
          currency: orderRecord.currency,
          status: providerOrderId ? 'processing' : 'pending',
          provider: 'razorpay',
          providerOrderId: providerOrderId,
          keyId: razorpayKeyId || null,
          shopName: shop?.name || 'VestiAI Boutique',
          userEmail: user.email,
          userPhone: shop?.phone || '',
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[create-payment-order] Fatal Exception:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
