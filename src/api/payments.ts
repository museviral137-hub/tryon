import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PaymentOrder, PaymentVerificationResult } from '../types';
import { authApi } from './auth';

const STORAGE_ORDERS_KEY = 'vestiai_payment_orders_cache_v2';

function loadCachedOrders(): PaymentOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCachedOrders(orders: PaymentOrder[]): void {
  try {
    localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('Failed to cache orders locally', e);
  }
}

export const paymentsApi = {
  /**
   * Initiates a secure payment order via backend Edge Function or authenticated Supabase client
   */
  async createOrder(packageId: string): Promise<{
    success: boolean;
    order: PaymentOrder;
    keyId?: string;
    error?: string;
    message?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase backend is not configured. Please check your environment.');
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('You must be signed in to purchase AI credits.');
    }

    const shopId = await authApi.getActiveShopId();
    if (!shopId) {
      throw new Error('No active boutique found for current user.');
    }

    // Try calling Edge Function create-payment-order
    try {
      const response = await supabase.functions.invoke('create-payment-order', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { packageId },
      });

      if (response.data && response.data.success && response.data.order) {
        const orderData: PaymentOrder = {
          id: response.data.order.id,
          userId: session.user.id,
          shopId: shopId,
          packageId: response.data.order.packageId,
          credits: response.data.order.credits,
          amount: response.data.order.amount,
          currency: response.data.order.currency || 'INR',
          status: response.data.order.status || 'pending',
          provider: 'razorpay',
          providerOrderId: response.data.order.providerOrderId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const existing = loadCachedOrders();
        saveCachedOrders([orderData, ...existing.filter((o) => o.id !== orderData.id)]);

        return {
          success: true,
          order: orderData,
          keyId: response.data.order.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || '',
        };
      }
    } catch (edgeErr) {
      console.warn('[paymentsApi] Edge function invocation fallback to direct Supabase query:', edgeErr);
    }

    // Fallback: Direct insert into public.payment_orders with RLS
    const packageInfoMap: Record<string, { credits: number; amount: number }> = {
      starter: { credits: 50, amount: 199 },
      popular: { credits: 150, amount: 499 },
      pro: { credits: 500, amount: 1499 },
      business: { credits: 1000, amount: 2499 },
    };

    const pkg = packageInfoMap[packageId.toLowerCase()] || { credits: 50, amount: 199 };

    const { data: dbOrder, error: dbError } = await supabase
      .from('payment_orders')
      .insert({
        user_id: session.user.id,
        shop_id: shopId,
        package_id: packageId.toLowerCase(),
        credits: pkg.credits,
        amount: pkg.amount,
        currency: 'INR',
        status: 'pending',
        provider: 'razorpay',
      })
      .select('*')
      .single();

    if (dbError || !dbOrder) {
      throw new Error(dbError?.message || 'Failed to initialize payment order');
    }

    const createdOrder: PaymentOrder = {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      shopId: dbOrder.shop_id,
      packageId: dbOrder.package_id,
      credits: dbOrder.credits,
      amount: Number(dbOrder.amount),
      currency: dbOrder.currency,
      status: dbOrder.status,
      provider: dbOrder.provider || 'razorpay',
      providerOrderId: dbOrder.provider_order_id,
      createdAt: dbOrder.created_at,
      updatedAt: dbOrder.updated_at,
    };

    const existing = loadCachedOrders();
    saveCachedOrders([createdOrder, ...existing.filter((o) => o.id !== createdOrder.id)]);

    return {
      success: true,
      order: createdOrder,
      keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
    };
  },

  /**
   * Verifies payment completion and triggers atomic credit addition
   */
  async verifyPayment(payload: {
    orderId: string;
    providerPaymentId?: string;
    providerOrderId?: string;
    providerSignature?: string;
  }): Promise<PaymentVerificationResult> {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Supabase backend is not configured.');
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new Error('You must be signed in to verify payment.');
    }

    // Try calling Edge Function verify-payment
    try {
      const response = await supabase.functions.invoke('verify-payment', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: payload,
      });

      if (response.data && response.data.success) {
        return {
          success: true,
          order: response.data.order,
          creditsAdded: response.data.creditsAdded,
          remainingCredits: response.data.remainingCredits,
          totalCredits: response.data.totalCredits,
          alreadyFulfilled: response.data.alreadyFulfilled,
        };
      } else if (response.data && response.data.error) {
        return {
          success: false,
          error: response.data.error,
          message: response.data.message || 'Payment verification failed',
        };
      }
    } catch (edgeErr: any) {
      console.warn('[paymentsApi] Edge function verification notice:', edgeErr);
      return {
        success: false,
        error: 'VERIFICATION_UNAVAILABLE',
        message: edgeErr?.message || 'Payment verification service is currently unavailable. Order remains pending.',
      };
    }

    // Never perform client-side fulfillment. Payment fulfillment is strictly authoritative on server.
    return {
      success: false,
      error: 'PAYMENT_PENDING',
      message: 'Payment verification is pending gateway processing.',
    };
  },

  /**
   * Fetches single payment order by ID
   */
  async getOrder(orderId: string): Promise<PaymentOrder | null> {
    if (!isSupabaseConfigured() || !supabase) {
      const cached = loadCachedOrders();
      return cached.find((o) => o.id === orderId) || null;
    }

    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      const cached = loadCachedOrders();
      return cached.find((o) => o.id === orderId) || null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      shopId: data.shop_id,
      packageId: data.package_id,
      credits: data.credits,
      amount: Number(data.amount),
      currency: data.currency,
      status: data.status,
      provider: data.provider,
      providerOrderId: data.provider_order_id,
      providerPaymentId: data.provider_payment_id,
      errorMessage: data.error_message,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Fetches all payment orders for the active boutique
   */
  async getOrders(): Promise<PaymentOrder[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return loadCachedOrders();
    }

    const shopId = await authApi.getActiveShopId();
    if (!shopId) {
      return loadCachedOrders();
    }

    const { data, error } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return loadCachedOrders();
    }

    const formatted: PaymentOrder[] = data.map((d) => ({
      id: d.id,
      userId: d.user_id,
      shopId: d.shop_id,
      packageId: d.package_id,
      credits: d.credits,
      amount: Number(d.amount),
      currency: d.currency,
      status: d.status,
      provider: d.provider,
      providerOrderId: d.provider_order_id,
      providerPaymentId: d.provider_payment_id,
      errorMessage: d.error_message,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));

    saveCachedOrders(formatted);
    return formatted;
  },
};
