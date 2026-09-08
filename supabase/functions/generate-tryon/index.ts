// Supabase Edge Function: generate-tryon
// Integrates with the TryOnCloud Developer API.
// Strict production execution pipeline:
// 1. Authenticate user from Bearer Token
// 2. Verify active boutique shop membership
// 3. Validate real customer & garment DB records for this shop
// 4. Validate garment category compatibility before charging credits
// 5. Resolve accessible HTTPS URLs for customer and garment images with pre-flight availability check BEFORE credit deduction
// 6. Verify TRYONCLOUD_API_KEY exists before credit deduction (no fake success fallback)
// 7. Insert Try-On Result row in 'Processing' status FIRST
// 8. Deduct exactly 1 credit atomically via stored procedure deduct_shop_ai_credit
// 9. Call TryOnCloud with verified image files
// 10. On provider/storage failure: refund ONLY if credit was deducted (creditDeducted=true, wasRefunded=true)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type TryOnCategory = 'upperbody' | 'lowerbody' | 'dress';

type TryOnCategoryResult =
  | { success: true; category: TryOnCategory }
  | { success: false; error: string; unsupportedCategory?: string };

/**
 * Centralized Category Mapping Function
 * Maps supported boutique catalog categories to the existing fitting categories:
 * - 'upperbody': shirt, top, t-shirt, tshirt, blouse, jacket, blazer, sweater, hoodie, crop top
 * - 'lowerbody': pant, pants, trouser, trousers, skirt, jeans, shorts, palazzo, leggings, dhoti
 * - 'dress'    : dress, frock, gown, jumpsuit, one-piece, saree, sari, lehenga, kurti, kurta, anarkali, sherwani, achkan, suit
 */
function validateAndMapCategory(category?: string, garmentName?: string): TryOnCategoryResult {
  const catRaw = (category || '').trim();
  const nameRaw = (garmentName || '').trim();
  const raw = catRaw || nameRaw;

  if (!raw) {
    return {
      success: false,
      error: 'Garment category is required for Virtual Try-On generation.',
    };
  }

  const lower = raw.toLowerCase();

  if (
    lower.includes('unstitched') ||
    lower.includes('fabric roll') ||
    lower.includes('dupatta') ||
    lower.includes('shawl') ||
    lower.includes('stole')
  ) {
    return {
      success: false,
      error: `Garment category "${raw}" is not supported for automatic fitting.`,
      unsupportedCategory: raw,
    };
  }

  if (
    lower === 'upperbody' ||
    lower.includes('shirt') ||
    lower.includes('t-shirt') ||
    lower.includes('tshirt') ||
    lower.includes('top') ||
    lower.includes('blouse') ||
    lower.includes('jacket') ||
    lower.includes('blazer') ||
    lower.includes('sweater') ||
    lower.includes('hoodie') ||
    lower.includes('crop top')
  ) {
    return { success: true, category: 'upperbody' };
  }

  if (
    lower === 'lowerbody' ||
    lower.includes('pant') ||
    lower.includes('trouser') ||
    lower.includes('jean') ||
    lower.includes('skirt') ||
    lower.includes('short') ||
    lower.includes('palazzo') ||
    lower.includes('legging') ||
    lower.includes('dhoti')
  ) {
    return { success: true, category: 'lowerbody' };
  }

  if (
    lower === 'dress' ||
    lower === 'dresses' ||
    lower.includes('dress') ||
    lower.includes('frock') ||
    lower.includes('gown') ||
    lower.includes('jumpsuit') ||
    lower.includes('one-piece') ||
    lower.includes('one piece') ||
    lower.includes('saree') ||
    lower.includes('sari') ||
    lower.includes('lehenga') ||
    lower.includes('kurti') ||
    lower.includes('kurta') ||
    lower.includes('anarkali') ||
    lower.includes('sherwani') ||
    lower.includes('achkan') ||
    lower.includes('suit')
  ) {
    return { success: true, category: 'dress' };
  }

  return {
    success: false,
    error: `Garment category "${raw}" is not supported for Virtual Try-On.`,
    unsupportedCategory: raw,
  };
}

/**
 * Strips tokens, query strings, and API keys from URLs/text for safe logging
 */
function sanitizeUrlForLogging(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      const parsed = new URL(rawUrl);
      return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
    }
    return rawUrl
      .replace(/https?:\/\/[^\s"'`<>]+/g, (match) => {
        try {
          const parsed = new URL(match);
          return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
        } catch {
          const qIdx = match.indexOf('?');
          return qIdx !== -1 ? match.substring(0, qIdx) : match;
        }
      })
      .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[REDACTED]')
      .replace(/(pk_[A-Za-z0-9_-]+)/gi, '[REDACTED_API_KEY]');
  } catch {
    const qIdx = rawUrl.indexOf('?');
    return qIdx !== -1 ? rawUrl.substring(0, qIdx) : rawUrl;
  }
}

/**
 * Resolves any image URL (storage path, signed URL, public URL, base64 data, or external URL)
 * into a clean, publicly accessible HTTPS URL suitable for external APIs.
 */
async function resolveAccessibleImageUrl(
  supabaseAdmin: any,
  bucketName: 'customer-photos' | 'garment-images' | 'tryon-results',
  rawUrl: string,
  expiresInSeconds: number = 7200
): Promise<string> {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Handle Base64 data URLs: upload to storage so an external HTTPS URL is generated
  if (trimmed.startsWith('data:')) {
    try {
      const match = trimmed.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const tempPath = `temp/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabaseAdmin.storage
          .from(bucketName)
          .upload(tempPath, bytes, { contentType: mimeType, upsert: true });
        if (!upErr) {
          const { data: signed } = await supabaseAdmin.storage
            .from(bucketName)
            .createSignedUrl(tempPath, expiresInSeconds);
          if (signed?.signedUrl) return signed.signedUrl;
        }
      }
    } catch (e) {
      console.warn(`[ResolveImage] Base64 upload notice:`, (e as Error).message);
    }
    return trimmed;
  }

  // Check if URL belongs to Supabase Storage
  const isSupabaseStorage =
    trimmed.includes(`/storage/v1/object/`) ||
    trimmed.includes(`/${bucketName}/`) ||
    !trimmed.startsWith('http');

  if (isSupabaseStorage) {
    let objectPath = trimmed;

    // Remove query params (such as old ?token=...)
    const questionMarkIdx = objectPath.indexOf('?');
    if (questionMarkIdx !== -1) {
      objectPath = objectPath.substring(0, questionMarkIdx);
    }

    // Extract path after /bucketName/
    const bucketMarker = `/${bucketName}/`;
    const bucketMarkerIdx = objectPath.indexOf(bucketMarker);
    if (bucketMarkerIdx !== -1) {
      objectPath = objectPath.substring(bucketMarkerIdx + bucketMarker.length);
    } else if (objectPath.startsWith(`${bucketName}/`)) {
      objectPath = objectPath.substring(`${bucketName}/`.length);
    }

    // Strip leading slashes
    objectPath = objectPath.replace(/^\/+/, '');

    // For public buckets like garment-images, check public URL first
    if (bucketName === 'garment-images') {
      const { data: pubRes } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(objectPath);
      if (pubRes?.publicUrl) {
        return pubRes.publicUrl;
      }
    }

    // Generate fresh signed URL (2-hour validity) for private or public buckets
    const { data: signedRes, error: signErr } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(objectPath, expiresInSeconds);

    if (!signErr && signedRes?.signedUrl) {
      return signedRes.signedUrl;
    }

    // Fallback to getPublicUrl
    const { data: pubRes } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(objectPath);
    if (pubRes?.publicUrl) {
      return pubRes.publicUrl;
    }
  }

  // Remote URL (e.g. Unsplash or direct HTTPS CDN)
  return trimmed;
}

/**
 * Pre-flight verification that an image URL is accessible via HTTP and returns image content
 */
async function verifyImageAccessible(url: string): Promise<{
  accessible: boolean;
  status: number;
  contentType: string;
  error?: string;
}> {
  if (!url || !url.startsWith('https://') && !url.startsWith('http://')) {
    return { accessible: false, status: 0, contentType: '', error: 'URL must start with http:// or https://' };
  }

  try {
    // Try HEAD request first for efficiency
    let res = await fetch(url, { method: 'HEAD' });

    // If HEAD is not allowed (405), fallback to GET with Range header for first few bytes
    if (res.status === 405 || !res.ok) {
      res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-100' },
      });
    }

    const contentType = res.headers.get('content-type') || '';
    const isSuccess = res.ok || res.status === 206 || res.status === 304;

    return {
      accessible: isSuccess,
      status: res.status,
      contentType,
      error: isSuccess ? undefined : `Image URL returned HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      accessible: false,
      status: 0,
      contentType: '',
      error: `Network error verifying image: ${(err as Error).message}`,
    };
  }
}

type ImagePayload = {
  blob: Blob;
  mimeType: string;
  byteSize: number;
};

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);

/** Downloads an image as a bounded multipart-ready Blob. */
async function imageUrlToBlob(url: string): Promise<ImagePayload> {
  if (!url || typeof url !== 'string') {
    throw new Error('Image URL is required.');
  }

  if (url.startsWith('data:')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx !== -1) {
      const mimeType = url.slice(5, url.indexOf(';')) || 'application/octet-stream';
      if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) throw new Error('Only JPEG and PNG images are supported.');
      const binary = atob(url.substring(commaIdx + 1).replace(/\s/g, ''));
      if (binary.length > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 15 MB size limit.');
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return { blob: new Blob([bytes], { type: mimeType }), mimeType, byteSize: bytes.byteLength };
    }
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download image: HTTP ${response.status}`);
  }

  const mimeType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!SUPPORTED_IMAGE_TYPES.has(mimeType)) throw new Error('Only JPEG and PNG images are supported.');
  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 15 MB size limit.');

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) throw new Error('Image exceeds the 15 MB size limit.');
  return { blob: new Blob([buffer], { type: mimeType }), mimeType, byteSize: buffer.byteLength };
}

function sanitizeProviderResponseBody(rawBody: string): string {
  if (!rawBody.trim()) return '[empty body]';
  try {
    const value = JSON.parse(rawBody);
    const allowed = (input: any): any => {
      if (Array.isArray(input)) return input.slice(0, 10).map(allowed);
      if (!input || typeof input !== 'object') return typeof input === 'string' ? sanitizeUrlForLogging(input) : input;
      const output: Record<string, any> = {};
      for (const key of ['detail', 'error', 'message', 'friendly_message', 'guidance', 'code', 'status', 'received_size', 'loc', 'type']) {
        if (input[key] !== undefined) output[key] = allowed(input[key]);
      }
      return output;
    };
    return JSON.stringify(allowed(value)).slice(0, 1200);
  } catch {
    return sanitizeUrlForLogging(rawBody).slice(0, 1200);
  }
}

function providerResponseStatus(status: number): number {
  if (status === 400 || status === 401 || status === 402 || status === 422 || status === 429) return status;
  return status >= 500 ? 502 : 502;
}

/**
 * Safely parses a provider error without exposing URLs or credentials.
 */
function extractProviderErrorMessage(status: number, errText: string): string {
  const prefix = `TryOnCloud HTTP ${status}`;
  if (!errText || !errText.trim()) {
    return `${prefix}: Provider rejected request with status ${status}`;
  }

  try {
    const json = JSON.parse(errText);
    if (typeof json === 'string') return `${prefix}: ${sanitizeUrlForLogging(json)}`;

    // Handle FastAPI / Pydantic style detail array: [{ loc: ['body', 'category'], msg: '...', type: '...', input: '...' }]
    if (Array.isArray(json.detail)) {
      const details = json.detail
        .map((d: any) => {
          if (typeof d === 'string') return sanitizeUrlForLogging(d);
          const loc = Array.isArray(d.loc) ? d.loc.filter((x: any) => x !== 'body').join('.') : '';
          const msg = d.msg || d.type || 'invalid';
          const inputInfo = d.input !== undefined ? ` (received: "${sanitizeUrlForLogging(String(d.input))}")` : '';
          return loc ? `${loc}: ${msg}${inputInfo}` : `${msg}${inputInfo}`;
        })
        .join('; ');
      return `${prefix}: ${details || 'Validation error'}`;
    }

    if (typeof json.detail === 'string' && json.detail.trim()) {
      return `${prefix}: ${sanitizeUrlForLogging(json.detail)}`;
    }

    if (json.detail && typeof json.detail === 'object' && !Array.isArray(json.detail)) {
      const d = json.detail;
      const parts: string[] = [];
      if (typeof d.error === 'string' && d.error.trim()) parts.push(`[${d.error}]`);
      if (typeof d.message === 'string' && d.message.trim()) parts.push(sanitizeUrlForLogging(d.message));
      if (typeof d.guidance === 'string' && d.guidance.trim()) parts.push(`Guidance: ${sanitizeUrlForLogging(d.guidance)}`);
      if (d.received_size) parts.push(`(received: ${sanitizeUrlForLogging(String(d.received_size))})`);
      if (parts.length > 0) {
        return `${prefix}: ${parts.join(' — ')}`;
      }
    }

    if (typeof json.friendly_message === 'string' && json.friendly_message.trim()) {
      const mainMsg = json.message || json.detail || '';
      return mainMsg
        ? `${prefix}: ${sanitizeUrlForLogging(mainMsg)} - ${sanitizeUrlForLogging(json.friendly_message)}`
        : `${prefix}: ${sanitizeUrlForLogging(json.friendly_message)}`;
    }

    if (typeof json.message === 'string' && json.message.trim()) {
      return `${prefix}: ${sanitizeUrlForLogging(json.message)}`;
    }

    if (typeof json.error === 'string' && json.error.trim()) {
      return `${prefix}: ${sanitizeUrlForLogging(json.error)}`;
    }

    if (json.error && typeof json.error.message === 'string') {
      const codeInfo = json.error.code ? ` (code: ${json.error.code})` : '';
      return `${prefix}: ${sanitizeUrlForLogging(json.error.message)}${codeInfo}`;
    }

    if (json.code && typeof json.code === 'string') {
      return `${prefix}: ${sanitizeUrlForLogging(json.code)}`;
    }

    return `${prefix}: ${sanitizeUrlForLogging(JSON.stringify(json)).slice(0, 300)}`;
  } catch {
    return `${prefix}: ${sanitizeUrlForLogging(errText).slice(0, 300)}`;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: 'SERVER_CONFIGURATION_ERROR',
          message: 'Supabase environment keys are not configured.',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate user from Bearer Token
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Authentication required',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let requestBody: any = {};
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'INVALID_JSON',
          message: 'Invalid JSON request body',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { customerId, garmentId, sessionId } = requestBody;

    if (!customerId || !garmentId) {
      return new Response(
        JSON.stringify({
          error: 'MISSING_REQUIRED_FIELDS',
          message: 'customerId and garmentId are required',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate customerId and garmentId format
    if (!UUID_REGEX.test(customerId) || !UUID_REGEX.test(garmentId)) {
      return new Response(
        JSON.stringify({
          error: 'INVALID_ENTITY_ID',
          message: 'customerId and garmentId must be valid database UUIDs.',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Determine and verify boutique shop membership
    const { data: member, error: memberError } = await supabaseClient
      .from('shop_members')
      .select('shop_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !member?.shop_id) {
      return new Response(
        JSON.stringify({
          error: 'NO_SHOP_MEMBERSHIP',
          message: 'User does not belong to an active boutique',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shopId = member.shop_id;
    console.info(`[GenerateTryOn Diagnostic] User: ${user.id} | Edge Function Shop ID: ${shopId}`);

    // 3. Verify Customer & Garment entity ownership by the shop
    const [{ data: customer, error: cErr }, { data: garment, error: gErr }] = await Promise.all([
      supabaseClient.from('customers').select('*').eq('id', customerId).eq('shop_id', shopId).single(),
      supabaseClient.from('garments').select('*').eq('id', garmentId).eq('shop_id', shopId).single(),
    ]);

    if (cErr || !customer || gErr || !garment) {
      return new Response(
        JSON.stringify({
          error: 'ENTITY_NOT_FOUND',
          message: 'Selected customer or garment not found in your boutique database catalog.',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Verify garment category before deduction
    const categoryMapping = validateAndMapCategory(garment.category, garment.name);
    if (!categoryMapping.success) {
      return new Response(
        JSON.stringify({
          error: 'UNSUPPORTED_CATEGORY',
          message: categoryMapping.error,
          unsupportedCategory: categoryMapping.unsupportedCategory,
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Resolve Accessible Image URLs BEFORE credit deduction
    const [customerPhotoUrl, garmentPhotoUrl] = await Promise.all([
      resolveAccessibleImageUrl(supabaseAdmin, 'customer-photos', customer.image_url, 7200),
      resolveAccessibleImageUrl(supabaseAdmin, 'garment-images', garment.image_url, 7200),
    ]);

    if (!customerPhotoUrl || !garmentPhotoUrl) {
      return new Response(
        JSON.stringify({
          error: 'MISSING_IMAGES',
          message: 'Customer photo and garment image are required for virtual fitting.',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pre-flight verify image accessibility over HTTP
    const [customerImgCheck, garmentImgCheck] = await Promise.all([
      verifyImageAccessible(customerPhotoUrl),
      verifyImageAccessible(garmentPhotoUrl),
    ]);

    if (!customerImgCheck.accessible) {
      return new Response(
        JSON.stringify({
          error: 'CUSTOMER_IMAGE_INACCESSIBLE',
          message: `Customer photo could not be fetched (HTTP ${customerImgCheck.status}). Please update the customer photo.`,
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!garmentImgCheck.accessible) {
      return new Response(
        JSON.stringify({
          error: 'GARMENT_IMAGE_INACCESSIBLE',
          message: `Garment image could not be fetched (HTTP ${garmentImgCheck.status}). Please update the garment image.`,
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SAFE DIAGNOSTICS LOGGING (No secrets or auth tokens logged)
    console.info(
      `[TryOnCloud Diagnostics - Request Prep]\n` +
      `  Customer UUID: ${customer.id}\n` +
      `  Garment UUID: ${garment.id}\n` +
      `  Database Category: "${garment.category}"\n` +
      `  Mapped Category: "${categoryMapping.category}"\n` +
      `  Customer Image Path: ${sanitizeUrlForLogging(customerPhotoUrl)}\n` +
      `  Customer Image HTTP Status: ${customerImgCheck.status} (${customerImgCheck.contentType})\n` +
      `  Garment Image Path: ${sanitizeUrlForLogging(garmentPhotoUrl)}\n` +
      `  Garment Image HTTP Status: ${garmentImgCheck.status} (${garmentImgCheck.contentType})\n` +
      `  TryOnCloud Endpoint: POST https://www.tryoncloud.com/api/v1/generate\n` +
      `  Payload format: multipart/form-data image files`
    );

    // 6. Verify the provider key before credit deduction
    const tryOnCloudApiKey = Deno.env.get('TRYONCLOUD_API_KEY');
    if (!tryOnCloudApiKey || !tryOnCloudApiKey.trim()) {
      return new Response(
        JSON.stringify({
          error: 'TRYONCLOUD_NOT_CONFIGURED',
          message: 'Try-on provider is not configured. Please contact support.',
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Generate Try-On Result UUID
    const resultId = crypto.randomUUID();

    // 8. Insert Try-On Result row in 'Processing' status FIRST
    // (Required by foreign key constraint: ai_credit_transactions.try_on_result_id -> try_on_results.id)
    const { error: insertError } = await supabaseAdmin.from('try_on_results').insert({
      id: resultId,
      shop_id: shopId,
      session_id: sessionId || null,
      customer_id: customer.id,
      garment_id: garment.id,
      customer_name_snapshot: customer.name,
      customer_id_snapshot: customer.customer_id,
      customer_photo_url: customer.image_url,
      customer_phone_snapshot: customer.phone,
      garment_product_id_snapshot: garment.product_id,
      garment_name_snapshot: garment.name,
      garment_photo_url: garment.image_url,
      garment_price_snapshot: garment.price,
      garment_category_snapshot: garment.category,
      status: 'Processing',
      progress_phase: 'preparing',
    });

    if (insertError) {
      console.error('try_on_results insert error:', insertError.message);
      return new Response(
        JSON.stringify({
          error: 'DATABASE_ERROR',
          message: `Database record creation failed: ${insertError.message}`,
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Atomic Credit Deduction via RPC ONLY (Foreign key to try_on_results now safely exists)
    const { data: deduction, error: deductError } = await supabaseAdmin.rpc('deduct_shop_ai_credit', {
      p_shop_id: shopId,
      p_try_on_id: resultId,
    });

    if (deductError) {
      console.error('deduct_shop_ai_credit RPC error:', deductError.message);
      // Clean up the pending try_on_results record if deduction was rejected or failed
      await supabaseAdmin.from('try_on_results').delete().eq('id', resultId);

      const isInsufficient = deductError.message?.includes('INSUFFICIENT_CREDITS');
      const isNotFound = deductError.message?.includes('SHOP_CREDIT_ACCOUNT_NOT_FOUND');

      let errorCode = 'CREDIT_RPC_ERROR';
      let errorMsg = `Credit deduction RPC failed: ${deductError.message}`;
      let statusCode = 500;

      if (isInsufficient) {
        errorCode = 'INSUFFICIENT_CREDITS';
        errorMsg = 'Insufficient AI credits. Please top up your boutique balance in Settings.';
        statusCode = 402;
      } else if (isNotFound) {
        errorCode = 'CREDIT_ACCOUNT_NOT_FOUND';
        errorMsg = 'Boutique AI credit account was not found.';
        statusCode = 404;
      }

      return new Response(
        JSON.stringify({
          error: errorCode,
          message: errorMsg,
          creditDeducted: false,
          wasRefunded: false,
        }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creditRemaining = deduction?.remaining_credits ?? 0;

    // 10. Convert the existing storage images to multipart files and call TryOnCloud.
    try {
      let personImage: ImagePayload;
      let garmentImage: ImagePayload;

      try {
        [personImage, garmentImage] = await Promise.all([
          imageUrlToBlob(customerPhotoUrl),
          imageUrlToBlob(garmentPhotoUrl),
        ]);
      } catch (prepErr) {
        const prepMsg = (prepErr as Error).message || 'Failed to download input images';
        console.error(`[TryOnCloud Image Preparation Error] ${prepMsg}`);

        // Refund credit atomically if image conversion fails after deduction
        await supabaseAdmin.rpc('refund_shop_ai_credit', {
          p_shop_id: shopId,
          p_try_on_id: resultId,
          p_reason: `Image preparation failure: ${prepMsg}`,
        });

        await supabaseAdmin
          .from('try_on_results')
          .update({
            status: 'Failed',
            progress_phase: 'failed',
            error_message: `Virtual Try-On image preparation error: ${prepMsg}.`,
          })
          .eq('id', resultId);

        return new Response(
          JSON.stringify({
            error: 'IMAGE_PREPARATION_ERROR',
            message: `Failed to prepare images for Virtual Try-On: ${prepMsg}`,
            creditDeducted: true,
            wasRefunded: true,
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const formData = new FormData();
      formData.append(
        'person_image',
        personImage.blob,
        `person.${personImage.mimeType === 'image/png' ? 'png' : 'jpg'}`
      );
      formData.append(
        'garment_image',
        garmentImage.blob,
        `garment.${garmentImage.mimeType === 'image/png' ? 'png' : 'jpg'}`
      );

      console.info(
        `[TryOnCloud Request] endpoint=/api/v1/generate method=POST content_type=multipart/form-data ` +
        `user_agent=BoutiqueVirtualTryon/1.0 ` +
        `person_image={format:blob,mime:${personImage.mimeType},bytes:${personImage.byteSize}} ` +
        `garment_image={format:blob,mime:${garmentImage.mimeType},bytes:${garmentImage.byteSize}}`
      );

      const endpoint = 'https://www.tryoncloud.com/api/v1/generate';
      const tryOnResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'X-API-KEY': tryOnCloudApiKey.trim(),
          'User-Agent': 'BoutiqueVirtualTryon/1.0',
        },
        body: formData,
      });

      if (!tryOnResponse.ok) {
        const errorText = await tryOnResponse.text();

        const providerMessage = extractProviderErrorMessage(
          tryOnResponse.status,
          errorText
        );

        console.error(
          `[TryOnCloud Response] status=${tryOnResponse.status} body=${sanitizeProviderResponseBody(errorText)} message=${providerMessage}`
        );

        await supabaseAdmin.rpc('refund_shop_ai_credit', {
          p_shop_id: shopId,
          p_try_on_id: resultId,
          p_reason: `TryOnCloud HTTP ${tryOnResponse.status}: ${providerMessage}`,
        });

        await supabaseAdmin
          .from('try_on_results')
          .update({
            status: 'Failed',
            progress_phase: 'failed',
            error_message: providerMessage,
          })
          .eq('id', resultId);

        return new Response(
          JSON.stringify({
            error: 'TRYONCLOUD_ERROR',
            message: providerMessage,
            providerStatus: tryOnResponse.status,
            creditDeducted: true,
            wasRefunded: true,
          }),
          {
            status: providerResponseStatus(tryOnResponse.status),
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // TryOnCloud returns the generated PNG directly in the response body.
      if (!tryOnResponse.headers.get('content-type')?.includes('image/')) {
        throw new Error('TryOnCloud returned an invalid image response.');
      }

      {
        let storageFilePath = `tryon-results/${shopId}/${resultId}.png`;
        let imageSaved = false;

        try {
          const imageBlob = new Blob([await tryOnResponse.arrayBuffer()], { type: 'image/png' });
          const uploadPath = `${shopId}/${resultId}.png`;
          const { error: uploadErr } = await supabaseAdmin.storage
            .from('tryon-results')
            .upload(uploadPath, imageBlob, { contentType: 'image/png', upsert: true });
          if (!uploadErr && imageBlob.size > 0) {
            storageFilePath = `tryon-results/${uploadPath}`;
            imageSaved = true;
          }
        } catch (saveErr) {
          console.error('Error saving TryOnCloud image to Supabase storage:', (saveErr as Error).message);
        }

        if (!imageSaved) {
          // Do not mark completed if image could not be saved
          await supabaseAdmin.rpc('refund_shop_ai_credit', {
            p_shop_id: shopId,
            p_try_on_id: resultId,
            p_reason: 'Generated image persistence failure',
          });

          await supabaseAdmin
            .from('try_on_results')
            .update({
              status: 'Failed',
              progress_phase: 'failed',
              error_message: 'Generated try-on image could not be stored.',
            })
            .eq('id', resultId);

          return new Response(
            JSON.stringify({
              error: 'IMAGE_SAVE_FAILED',
              message: 'Generated try-on image could not be saved to boutique storage.',
              creditDeducted: true,
              wasRefunded: true,
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Mark as completed only after real image is persisted
        await supabaseAdmin
          .from('try_on_results')
          .update({
            status: 'Completed',
            progress_phase: 'completed',
            result_image_url: storageFilePath,
          })
          .eq('id', resultId);

        // Generate signed URL for immediate frontend display
        const { data: signedRes } = await supabaseAdmin.storage
          .from('tryon-results')
          .createSignedUrl(`${shopId}/${resultId}.png`, 3600);

        return new Response(
          JSON.stringify({
            success: true,
            resultId,
            jobId: null,
            status: 'Completed',
            phase: 'completed',
            resultImageUrl: signedRes?.signedUrl || storageFilePath,
            remainingCredits: creditRemaining,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

    } catch (fetchErr) {
      console.error('Fetch exception communicating with TryOnCloud:', (fetchErr as Error).message);

      // Rollback credit on network failure
      await supabaseAdmin.rpc('refund_shop_ai_credit', {
        p_shop_id: shopId,
        p_try_on_id: resultId,
        p_reason: 'Network failure connecting to TryOnCloud',
      });

      await supabaseAdmin
        .from('try_on_results')
        .update({
          status: 'Failed',
          progress_phase: 'failed',
          error_message: 'Network error connecting to Virtual Try-On provider.',
        })
        .eq('id', resultId);

      return new Response(
        JSON.stringify({
          error: 'PROVIDER_CONNECTION_ERROR',
          message: 'Unable to reach virtual try-on provider.',
          creditDeducted: true,
          wasRefunded: true,
        }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'INTERNAL_SERVER_ERROR',
        message: (error as Error).message,
        creditDeducted: false,
        wasRefunded: false,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
