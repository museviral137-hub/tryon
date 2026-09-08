import { paymentsApi } from '../api/payments';
import { PaymentPackage, PaymentVerificationResult, PaymentOrder } from '../types';
import { AI_CREDIT_PACKAGES } from '../constants/pricing';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

let razorpayScriptLoaded = false;

export async function loadRazorpayScript(): Promise<boolean> {
  if (razorpayScriptLoaded && window.Razorpay) return true;

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      razorpayScriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      console.warn('Failed to load Razorpay SDK script');
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export interface CheckoutOptions {
  packageId: string;
  shopName?: string;
  userEmail?: string;
  userPhone?: string;
  onSuccess?: (result: PaymentVerificationResult) => void;
  onFailure?: (error: string, orderId?: string) => void;
  onPending?: (orderId: string) => void;
  onDismiss?: () => void;
}

export const paymentService = {
  getPackage(packageId: string): PaymentPackage | undefined {
    return AI_CREDIT_PACKAGES.find((p) => p.id.toLowerCase() === packageId.toLowerCase());
  },

  /**
   * Orchestrates the complete checkout flow
   */
  async startCheckout(options: CheckoutOptions): Promise<{
    orderId: string;
    action: 'opened_modal' | 'pending' | 'verified' | 'failed';
  }> {
    const pkg = this.getPackage(options.packageId);
    if (!pkg) {
      throw new Error('Invalid package selected');
    }

    // 1. Create order record on backend
    const createResult = await paymentsApi.createOrder(options.packageId);
    const order = createResult.order;
    const keyId = createResult.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;

    // 2. Load Razorpay script if key is available
    const isScriptReady = await loadRazorpayScript();

    if (keyId && isScriptReady && window.Razorpay) {
      // 3. Open Real Gateway Modal
      const rzpOptions = {
        key: keyId,
        amount: Math.round(order.amount * 100), // in paise
        currency: order.currency || 'INR',
        name: 'VestiAI Virtual Try-On',
        description: `${pkg.name} - ${pkg.credits} AI Fitting Credits`,
        order_id: order.providerOrderId || undefined,
        prefill: {
          name: options.shopName || '',
          email: options.userEmail || '',
          contact: options.userPhone || '',
        },
        theme: {
          color: '#059669', // Emerald 600
        },
        modal: {
          ondismiss: () => {
            options.onDismiss?.();
          },
        },
        handler: async (response: any) => {
          try {
            // Verify payment on backend
            const verifyResult = await paymentsApi.verifyPayment({
              orderId: order.id,
              providerPaymentId: response.razorpay_payment_id,
              providerOrderId: response.razorpay_order_id,
              providerSignature: response.razorpay_signature,
            });

            if (verifyResult.success) {
              options.onSuccess?.(verifyResult);
            } else {
              options.onFailure?.(verifyResult.message || 'Payment verification failed', order.id);
            }
          } catch (err: any) {
            options.onFailure?.(err.message || 'Payment verification error', order.id);
          }
        },
      };

      const razorpay = new window.Razorpay(rzpOptions);
      razorpay.on('payment.failed', function (response: any) {
        options.onFailure?.(response.error.description || 'Payment was declined by bank', order.id);
      });
      razorpay.open();

      return { orderId: order.id, action: 'opened_modal' };
    }

    // If Razorpay keys are not yet configured in environment, proceed with gateway setup prompt / test fulfillment
    options.onPending?.(order.id);
    return { orderId: order.id, action: 'pending' };
  },

  /**
   * Verifies manual confirmation / sandbox webhook
   */
  async verifyOrder(orderId: string, paymentId?: string): Promise<PaymentVerificationResult> {
    return paymentsApi.verifyPayment({
      orderId,
      providerPaymentId: paymentId || `pay_${Date.now()}`,
    });
  },

  async getOrder(orderId: string): Promise<PaymentOrder | null> {
    return paymentsApi.getOrder(orderId);
  },
};
