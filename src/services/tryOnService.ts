import { Customer, Garment, TryOnResult, ShopSettings } from '../types';
import { createDownloadableCanvas } from '../utils/tryOnGenerator';
import { loadAIUsage } from './storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { shopApi } from '../api/shop';
import { authApi } from '../api/auth';
import { storageService } from './storageService';

export class TryOnError extends Error {
  wasRefunded: boolean;
  creditDeducted: boolean;
  code?: string;

  constructor(message: string, options?: { wasRefunded?: boolean; creditDeducted?: boolean; code?: string }) {
    super(message);
    this.name = 'TryOnError';
    this.creditDeducted = options?.creditDeducted ?? false;
    this.wasRefunded = Boolean(options?.wasRefunded && options?.creditDeducted);
    this.code = options?.code;
  }
}

export type TryOnProgressPhase =
  | 'idle'
  | 'preparing'
  | 'detecting_pose'
  | 'aligning_fabric'
  | 'generating'
  | 'finalizing'
  | 'completed'
  | 'failed';

export interface TryOnGenerationOptions {
  customer: Customer;
  garment: Garment;
  settings: ShopSettings;
  sessionId?: string;
  onPhaseChange?: (phase: TryOnProgressPhase, message: string) => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate customer category and compatibility
 * Supported PixelAPI categories: upperbody, lowerbody, dress, saree, lehenga, kurti, sherwani
 */
function validateCategoryClient(category?: string): { valid: boolean; error?: string } {
  if (!category || !category.trim()) {
    return { valid: false, error: 'Garment category is required for Virtual Try-On.' };
  }
  const lower = category.toLowerCase().trim();
  if (
    lower.includes('unstitched') ||
    lower.includes('fabric roll') ||
    lower.includes('dupatta') ||
    lower.includes('shawl') ||
    lower.includes('stole')
  ) {
    return {
      valid: false,
      error:
        `Unstitched drapes and fabric rolls cannot be fitted automatically. Please select a stitched garment (Dresses, Lehengas, Kurtis, Sarees, Tops, or Bottoms).`,
    };
  }
  return { valid: true };
}

/**
 * Validate that customer is a real Supabase database record belonging to active shop
 */
async function validateCustomerRecord(customer: Customer, shopId?: string): Promise<Customer> {
  if (!isSupabaseConfigured()) return customer;

  if (customer.id && UUID_REGEX.test(customer.id)) {
    let query = supabase.from('customers').select('*').eq('id', customer.id);
    if (shopId && UUID_REGEX.test(shopId)) {
      query = query.eq('shop_id', shopId);
    }
    const { data: existing, error } = await query.maybeSingle();
    if (existing && !error) {
      return {
        ...customer,
        id: existing.id,
        shopId: existing.shop_id,
        imageUrl: existing.image_url || customer.imageUrl,
      };
    }
  }

  // Check by customerId code
  if (customer.customerId) {
    let query = supabase.from('customers').select('*').eq('customer_id', customer.customerId);
    if (shopId && UUID_REGEX.test(shopId)) {
      query = query.eq('shop_id', shopId);
    }
    const { data: existing, error } = await query.maybeSingle();
    if (existing && !error) {
      return {
        ...customer,
        id: existing.id,
        shopId: existing.shop_id,
        imageUrl: existing.image_url || customer.imageUrl,
      };
    }
  }

  throw new TryOnError(
    `Selected customer "${customer.name || customer.customerId}" is not a registered database record. Please select or create a real customer in your boutique catalog.`,
    { creditDeducted: false, wasRefunded: false, code: 'ENTITY_NOT_FOUND' }
  );
}

/**
 * Validate that garment is a real Supabase database record belonging to active shop
 */
async function validateGarmentRecord(garment: Garment, shopId?: string): Promise<Garment> {
  if (!isSupabaseConfigured()) return garment;

  if (garment.id && UUID_REGEX.test(garment.id)) {
    let query = supabase.from('garments').select('*').eq('id', garment.id);
    if (shopId && UUID_REGEX.test(shopId)) {
      query = query.eq('shop_id', shopId);
    }
    const { data: existing, error } = await query.maybeSingle();
    if (existing && !error) {
      return {
        ...garment,
        id: existing.id,
        shopId: existing.shop_id,
        imageUrl: existing.image_url || garment.imageUrl,
      };
    }
  }

  // Check by product_id SKU
  if (garment.productId) {
    let query = supabase.from('garments').select('*').eq('product_id', garment.productId.toUpperCase());
    if (shopId && UUID_REGEX.test(shopId)) {
      query = query.eq('shop_id', shopId);
    }
    const { data: existing, error } = await query.maybeSingle();
    if (existing && !error) {
      return {
        ...garment,
        id: existing.id,
        shopId: existing.shop_id,
        imageUrl: existing.image_url || garment.imageUrl,
      };
    }
  }

  throw new TryOnError(
    `Selected garment "${garment.name || garment.productId}" is not a registered database record. Please select or create a real garment in your boutique catalog.`,
    { creditDeducted: false, wasRefunded: false, code: 'ENTITY_NOT_FOUND' }
  );
}

export const tryOnService = {
  /**
   * Check if the shop has available server-side AI credits
   */
  async checkCredits(): Promise<{ hasCredits: boolean; remaining: number }> {
    if (!isSupabaseConfigured()) {
      const local = loadAIUsage();
      return {
        hasCredits: local.remainingCredits > 0,
        remaining: local.remainingCredits,
      };
    }

    try {
      const usage = await shopApi.getAIUsage();
      return {
        hasCredits: usage.remainingCredits > 0,
        remaining: usage.remainingCredits,
      };
    } catch (err) {
      console.warn('[TryOnService] Credit pre-check notice:', err);
      // If we cannot pre-fetch usage, do not falsely assume 0 credits; allow Edge Function to be authoritative
      return {
        hasCredits: true,
        remaining: -1,
      };
    }
  },

  /**
   * Run real AI Try-On generation pipeline
   */
  async generateTryOn({
    customer,
    garment,
    settings,
    sessionId,
    onPhaseChange,
  }: TryOnGenerationOptions): Promise<TryOnResult> {
    if (!isSupabaseConfigured()) {
      onPhaseChange?.('failed', 'Supabase backend is not configured.');
      throw new TryOnError('Supabase backend is not configured. Please configure your Supabase settings.', {
        creditDeducted: false,
        wasRefunded: false,
        code: 'SUPABASE_NOT_CONFIGURED',
      });
    }

    // 2. Validate category compatibility (PRE-DEDUCTION: No credit deducted, no refund)
    const catCheck = validateCategoryClient(garment.category);
    if (!catCheck.valid) {
      const err = catCheck.error || 'Garment category is not supported for AI virtual try-on.';
      onPhaseChange?.('failed', err);
      throw new TryOnError(err, {
        creditDeducted: false,
        wasRefunded: false,
        code: 'UNSUPPORTED_GARMENT_CATEGORY',
      });
    }

    // 3. Check user authentication session
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      const authErr = 'Please sign in to your boutique account to use AI Virtual Try-On.';
      onPhaseChange?.('failed', authErr);
      throw new TryOnError(authErr, { creditDeducted: false, wasRefunded: false, code: 'UNAUTHORIZED' });
    }

    onPhaseChange?.('preparing', 'Validating customer photo and garment catalog coordinates...');

    // 4. Fetch active boutique shop ID
    const shopId = await authApi.getActiveShopId();
    if (!shopId) {
      const shopErr = 'Your account is not linked to an active boutique shop.';
      onPhaseChange?.('failed', shopErr);
      throw new TryOnError(shopErr, { creditDeducted: false, wasRefunded: false, code: 'NO_SHOP_MEMBERSHIP' });
    }

    // 5. Validate customer and garment exist in Supabase database tables (no fake/mock records)
    const [realCustomer, realGarment] = await Promise.all([
      validateCustomerRecord(customer, shopId),
      validateGarmentRecord(garment, shopId),
    ]);

    onPhaseChange?.('preparing', 'Initiating boutique try-on request with PixelAPI backend...');

    // 6. Call Supabase Edge Function: generate-tryon
    let edgeData: any = null;
    let edgeError: any = null;

    try {
      const headers: Record<string, string> = {};
      if (session.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await supabase.functions.invoke('generate-tryon', {
        headers,
        body: {
          customerId: realCustomer.id,
          garmentId: realGarment.id,
          sessionId: sessionId || null,
        },
      });
      edgeData = response.data;
      edgeError = response.error;
    } catch (invokeErr: any) {
      console.error('[TryOnService] Edge Function invoke exception:', invokeErr);
      onPhaseChange?.('failed', 'Virtual Try-On service is temporarily unavailable. Please try again later.');
      throw new TryOnError('Virtual Try-On service is temporarily unavailable. Please try again later.', {
        creditDeducted: false,
        wasRefunded: false,
      });
    }

    if (edgeError) {
      let errorMsg = 'Virtual Try-On service is temporarily unavailable. Please try again later.';
      let wasRefunded = false;
      let creditDeducted = false;
      let errorCode = '';
      let errorJson: any = null;

      try {
        if ('context' in edgeError && (edgeError as any).context) {
          const ctx = (edgeError as any).context;
          if (typeof ctx.clone === 'function') {
            try {
              const text = await ctx.clone().text();
              if (text) {
                try {
                  errorJson = JSON.parse(text);
                } catch {
                  errorJson = { message: text };
                }
              }
            } catch {
              // Ignore clone error
            }
          }
          if (!errorJson && typeof ctx.json === 'function') {
            try {
              errorJson = await ctx.json();
            } catch {
              try {
                const text = await ctx.text();
                errorJson = JSON.parse(text);
              } catch {
                // Ignore text parse error
              }
            }
          } else if (!errorJson && typeof ctx.text === 'function') {
            try {
              const text = await ctx.text();
              errorJson = JSON.parse(text);
            } catch {
              // Ignore text parse error
            }
          } else if (!errorJson && typeof ctx === 'object') {
            errorJson = ctx;
          }
        }

        if (errorJson) {
          if (errorJson.message) {
            errorMsg = errorJson.message;
          } else if (errorJson.error) {
            errorMsg = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
          }
          if (errorJson.creditDeducted === true) {
            creditDeducted = true;
          }
          if (errorJson.wasRefunded === true && creditDeducted) {
            wasRefunded = true;
          }
          if (errorJson.error && typeof errorJson.error === 'string') {
            errorCode = errorJson.error;
          }
        }
      } catch (parseEx) {
        console.warn('[TryOnService] Could not parse Edge Function error context payload:', parseEx);
      }

      if (
        errorMsg === 'Virtual Try-On service is temporarily unavailable. Please try again later.' &&
        edgeError.message
      ) {
        if (
          edgeError.message !== 'Edge Function returned a non-2xx status code' &&
          !edgeError.message.includes('Failed to send a request to the Edge Function')
        ) {
          errorMsg = edgeError.message;
        }
      }

      if (errorCode !== 'INSUFFICIENT_CREDITS' && !errorMsg.includes('Insufficient AI credits')) {
        console.warn('[TryOnService] Edge Function notice:', { errorCode, errorMsg, edgeError: edgeError.message });
      }

      // Map backend error codes to clear user-friendly guidance
      if (
        errorCode === 'UNAUTHORIZED' ||
        errorMsg === 'Authentication required' ||
        errorMsg.includes('Missing authorization header')
      ) {
        errorMsg = 'Please sign in to your boutique account to generate virtual try-ons.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'NO_SHOP_MEMBERSHIP' || errorMsg.includes('does not belong to an active boutique')) {
        errorMsg = 'Your account is not linked to an active boutique shop.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'PIXELAPI_NOT_CONFIGURED' || errorMsg.includes('PIXELAPI_API_KEY')) {
        errorMsg = 'PixelAPI is not configured. Please add PIXELAPI_API_KEY to your Supabase Edge Function environment variables.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'ENTITY_NOT_FOUND' || errorMsg.includes('not found in boutique catalog')) {
        errorMsg = 'Selected customer or garment was not found in the database. Please ensure both are saved to your boutique catalog.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (
        errorCode === 'UNSUPPORTED_CATEGORY' ||
        errorCode === 'UNSUPPORTED_GARMENT_CATEGORY'
      ) {
        errorMsg = errorJson?.message || 'Garment category is not supported for Virtual Try-On.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorMsg.includes('unstitched drapes') || errorMsg.includes('fabric roll')) {
        errorMsg = errorJson?.message || 'Virtual Try-On for unstitched drapes or fabrics is not supported. Please select a stitched garment.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'INSUFFICIENT_CREDITS') {
        errorMsg = 'Insufficient AI credits. Please top up your boutique balance in Settings.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'CREDIT_ACCOUNT_NOT_FOUND') {
        errorMsg = 'Boutique AI credit account was not found.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'CREDIT_RPC_ERROR') {
        errorMsg = 'Credit deduction service encountered a database error. Please try again.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'MISSING_IMAGES' || errorMsg.includes('Customer photo and garment image are required')) {
        errorMsg = 'Customer photo and garment image are required for virtual fitting.';
        creditDeducted = false;
        wasRefunded = false;
      } else if (errorCode === 'IMAGE_PREPARATION_ERROR') {
        errorMsg = errorJson?.message || 'Failed to prepare images for Virtual Try-On.';
        creditDeducted = errorJson?.creditDeducted === true;
        wasRefunded = errorJson?.wasRefunded === true && creditDeducted;
      } else if (
        errorCode === 'PIXELAPI_ERROR' ||
        errorMsg.includes('PixelAPI') ||
        errorMsg.includes('Virtual Try-On provider')
      ) {
        errorMsg = errorJson?.message || errorJson?.pixelApiError || errorMsg;
        creditDeducted = errorJson?.creditDeducted === true;
        wasRefunded = errorJson?.wasRefunded === true && creditDeducted;
      } else if (errorCode === 'IMAGE_SAVE_FAILED') {
        errorMsg = 'Generated try-on image could not be saved to boutique storage.';
        creditDeducted = errorJson?.creditDeducted === true;
        wasRefunded = errorJson?.wasRefunded === true && creditDeducted;
      } else if (errorCode === 'PROVIDER_CONNECTION_ERROR') {
        errorMsg = 'Unable to reach virtual try-on provider.';
        creditDeducted = errorJson?.creditDeducted === true;
        wasRefunded = errorJson?.wasRefunded === true && creditDeducted;
      }

      onPhaseChange?.('failed', errorMsg);
      throw new TryOnError(errorMsg, { wasRefunded, creditDeducted, code: errorCode });
    }

    if (!edgeData || !edgeData.success) {
      const errMsg = edgeData?.message || edgeData?.error || 'Virtual Try-On request was rejected by provider.';
      onPhaseChange?.('failed', errMsg);
      throw new TryOnError(errMsg, { wasRefunded: false, creditDeducted: false });
    }

    // Handle immediate synchronous completion from PixelAPI
    if (edgeData.status === 'Completed' && edgeData.resultImageUrl) {
      onPhaseChange?.('completed', 'Try-On generation complete!');

      let finalResultUrl = edgeData.resultImageUrl;
      if (finalResultUrl && !finalResultUrl.startsWith('http') && !finalResultUrl.startsWith('data:')) {
        finalResultUrl = await storageService.getTryOnResultUrl(finalResultUrl);
      }

      let finalCustomerPhoto = realCustomer.imageUrl;
      if (finalCustomerPhoto && !finalCustomerPhoto.startsWith('http') && !finalCustomerPhoto.startsWith('data:')) {
        finalCustomerPhoto = await storageService.getCustomerPhotoUrl(finalCustomerPhoto);
      }

      return {
        id: edgeData.resultId,
        customerId: realCustomer.id,
        customerName: realCustomer.name,
        customerPhoto: finalCustomerPhoto,
        customerPhone: realCustomer.phone,
        garmentId: realGarment.id,
        garmentProductId: realGarment.productId,
        garmentName: realGarment.name,
        garmentPhoto: realGarment.imageUrl,
        garmentPrice: realGarment.price,
        garmentCategory: realGarment.category,
        resultImageUrl: finalResultUrl,
        createdAt: new Date().toISOString(),
        status: 'Completed',
        sessionId: sessionId || undefined,
      };
    }

    // Handle asynchronous queued job via polling real try_on_results
    if (edgeData.resultId) {
      const resultId = edgeData.resultId;
      onPhaseChange?.('detecting_pose', 'AI model detecting body contours & pose alignment...');

      let attempts = 0;
      const maxAttempts = 40; // 40 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1000));
        attempts++;

        if (attempts === 4) {
          onPhaseChange?.('aligning_fabric', `Adapting ${realGarment.name} silhouette & drape texture...`);
        } else if (attempts === 8) {
          onPhaseChange?.('generating', 'Synthesizing neural virtual fitting preview...');
        } else if (attempts === 14) {
          onPhaseChange?.('finalizing', 'Finalizing high-resolution boutique fitting card...');
        }

        const { data: row, error: pollError } = await supabase
          .from('try_on_results')
          .select('*')
          .eq('id', resultId)
          .maybeSingle();

        if (row && !pollError) {
          if (row.status === 'Completed' && row.result_image_url) {
            onPhaseChange?.('completed', 'Try-On generation complete!');

            let finalResultUrl = row.result_image_url;
            if (finalResultUrl && !finalResultUrl.startsWith('http') && !finalResultUrl.startsWith('data:')) {
              finalResultUrl = await storageService.getTryOnResultUrl(finalResultUrl);
            }

            let finalCustomerPhoto = row.customer_photo_url;
            if (finalCustomerPhoto && !finalCustomerPhoto.startsWith('http') && !finalCustomerPhoto.startsWith('data:')) {
              finalCustomerPhoto = await storageService.getCustomerPhotoUrl(finalCustomerPhoto);
            }

            return {
              id: row.id,
              customerId: row.customer_id,
              customerName: row.customer_name_snapshot,
              customerPhoto: finalCustomerPhoto,
              customerPhone: row.customer_phone_snapshot || undefined,
              garmentId: row.garment_id,
              garmentProductId: row.garment_product_id_snapshot,
              garmentName: row.garment_name_snapshot,
              garmentPhoto: row.garment_photo_url,
              garmentPrice: Number(row.garment_price_snapshot) || 0,
              garmentCategory: row.garment_category_snapshot,
              resultImageUrl: finalResultUrl,
              createdAt: row.created_at,
              status: 'Completed',
              notes: row.notes || undefined,
              sessionId: row.session_id || undefined,
            };
          } else if (row.status === 'Failed') {
            const errMsg =
              row.error_message ||
              'Virtual Try-On generation failed at provider.';
            onPhaseChange?.('failed', errMsg);
            throw new TryOnError(errMsg, {
              wasRefunded: false,
              creditDeducted: false,
            });
          }
        }
      }

      // If polling timed out
      onPhaseChange?.('failed', 'Try-on processing timed out.');
      throw new TryOnError('Try-on processing timed out. Please check try-on history in a moment.', {
        wasRefunded: false,
        creditDeducted: true,
      });
    }

    throw new TryOnError('Virtual Try-On service did not return a valid result identifier.', {
      wasRefunded: false,
      creditDeducted: false,
    });
  },

  /**
   * Export fitting card to downloadable canvas
   */
  async exportDownloadableImage(result: TryOnResult, shopName: string): Promise<string> {
    return createDownloadableCanvas(result, shopName);
  },

  /**
   * Generate direct WhatsApp fitting card message link
   */
  getWhatsAppLink(
    phone: string | undefined,
    customerName: string,
    garmentName: string,
    productId: string,
    price: number,
    shopName: string,
    customMessage?: string
  ): string {
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    let msgText = customMessage;
    if (!msgText) {
      msgText = `Hi ${customerName}, here is your VestiAI try-on for ${garmentName} (ID: ${productId}). Price: ₹${price.toLocaleString('en-IN')}.\n\nFrom ${shopName}`;
    }
    const message = encodeURIComponent(msgText);
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${message}`;
    }
    return `https://wa.me/?text=${message}`;
  },
};
