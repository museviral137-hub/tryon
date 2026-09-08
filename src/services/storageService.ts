import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authApi } from '../api/auth';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface StorageUploadResult {
  storagePath: string;
  url: string;
  signedUrl?: string;
  bucket: string;
}

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ASSET_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export const MAX_CUSTOMER_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_GARMENT_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
export const MAX_SHOP_ASSET_SIZE = 5 * 1024 * 1024;      // 5MB
export const MAX_TRYON_RESULT_SIZE = 15 * 1024 * 1024;   // 15MB

// PixelAPI (the Virtual Try-On provider) rejects requests with HTTP 400 when input
// images are very high-resolution / large, since person+garment images are sent as
// base64 JSON. Full-resolution phone camera photos (12MP+, several MB) routinely
// trip this. We downscale + compress on upload so nothing oversized ever reaches it.
export const MAX_UPLOAD_DIMENSION = 1600; // longest edge, in px
export const UPLOAD_JPEG_QUALITY = 0.88;

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image for resizing'));
    img.src = dataUrl;
  });
}

/**
 * Downscales and re-compresses an image (File/Blob/data URL) so its longest edge is
 * capped at `maxDimension` and it's encoded as JPEG at `quality`. Images already
 * within bounds, remote URLs, and SVGs pass through untouched. On any failure this
 * falls back to the original input rather than blocking the upload.
 */
export async function normalizeImageForUpload(
  fileInput: File | Blob | string,
  maxDimension: number = MAX_UPLOAD_DIMENSION,
  quality: number = UPLOAD_JPEG_QUALITY
): Promise<File | Blob | string> {
  // Remote URLs (e.g. already-hosted sample images) pass through untouched
  if (typeof fileInput === 'string' && !fileInput.startsWith('data:')) {
    return fileInput;
  }

  const mimeType =
    typeof fileInput === 'string' ? fileInput.match(/^data:([^;]+);/)?.[1] || '' : fileInput.type;
  if (mimeType === 'image/svg+xml') {
    return fileInput;
  }

  try {
    const dataUrl = typeof fileInput === 'string' ? fileInput : await fileToDataUrl(fileInput);
    const img = await loadImageElement(dataUrl);

    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) return fileInput;

    // Already small enough — skip re-encoding to avoid unnecessary quality loss
    if (width <= maxDimension && height <= maxDimension) {
      return fileInput;
    }

    const scale = maxDimension / Math.max(width, height);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return fileInput;

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL('image/jpeg', quality);
  } catch (err) {
    console.warn('[StorageService] Image normalization skipped, using original:', (err as Error).message);
    return fileInput;
  }
}

/**
 * Sanitizes an ID or string for use in S3/Supabase Storage folder/file paths.
 * Prevents path traversal and unwanted characters.
 */
export function sanitizePathSegment(segment: string): string {
  if (!segment) return 'item';
  return segment
    .replace(/\.\./g, '')
    .replace(/[/\\]/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 80);
}

/**
 * Converts a base64 data URL string into a native Blob with MIME type detection.
 */
export function dataUrlToBlob(dataUrl: string): { blob: Blob; mimeType: string; extension: string } {
  if (!dataUrl.startsWith('data:')) {
    throw new Error('Invalid data URL format');
  }

  const matches = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    throw new Error('Failed to parse base64 image data');
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2];
  const byteCharacters = atob(base64Data);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  const blob = new Blob(byteArrays, { type: mimeType });
  const extension =
    mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
      ? 'webp'
      : mimeType === 'image/svg+xml'
      ? 'svg'
      : 'jpg';

  return { blob, mimeType, extension };
}

/**
 * Validates image file type and maximum size constraints.
 */
export function validateImageFile(
  file: File | Blob | string,
  maxSize: number = MAX_GARMENT_IMAGE_SIZE,
  allowedMimeTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES
): FileValidationResult {
  if (typeof file === 'string') {
    if (file.startsWith('data:')) {
      try {
        const { blob, mimeType } = dataUrlToBlob(file);
        if (!allowedMimeTypes.includes(mimeType)) {
          return {
            valid: false,
            error: `Unsupported image format (${mimeType}). Allowed: JPG, PNG, WEBP.`,
          };
        }
        if (blob.size > maxSize) {
          return {
            valid: false,
            error: `Image size (${(blob.size / (1024 * 1024)).toFixed(1)}MB) exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit.`,
          };
        }
        return { valid: true };
      } catch (err: any) {
        return { valid: false, error: err.message || 'Invalid image data' };
      }
    }
    // Remote HTTP URL (e.g. Unsplash sample)
    return { valid: true };
  }

  const mimeType = file.type.toLowerCase();
  if (mimeType && !allowedMimeTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `Unsupported image format (${mimeType || 'unknown'}). Allowed: JPG, PNG, WEBP.`,
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds ${(maxSize / (1024 * 1024)).toFixed(0)}MB limit.`,
    };
  }

  return { valid: true };
}

/**
 * Prepares a File, Blob, or Data URL for upload.
 */
function prepareUploadPayload(fileInput: File | Blob | string): {
  data: Blob | File;
  extension: string;
  contentType: string;
} {
  if (typeof fileInput === 'string') {
    if (fileInput.startsWith('data:')) {
      const { blob, mimeType, extension } = dataUrlToBlob(fileInput);
      return { data: blob, extension, contentType: mimeType };
    }
    throw new Error('Direct URL strings cannot be uploaded directly as raw payloads');
  }

  const contentType = fileInput.type || 'image/jpeg';
  const extension =
    contentType === 'image/png'
      ? 'png'
      : contentType === 'image/webp'
      ? 'webp'
      : contentType === 'image/svg+xml'
      ? 'svg'
      : 'jpg';

  return { data: fileInput, extension, contentType };
}

export const storageService = {
  /**
   * Upload customer standing photo to private customer-photos bucket
   * Target Path: customer-photos/{shop_id}/{customer_id}/{timestamp}_{random}.{ext}
   */
  async uploadCustomerPhoto(
    fileInput: File | Blob | string,
    shopId?: string,
    customerId?: string
  ): Promise<string> {
    const res = await this.uploadCustomerPhotoDetailed(fileInput, shopId, customerId);
    return res.signedUrl || res.url;
  },

  async uploadCustomerPhotoDetailed(
    fileInput: File | Blob | string,
    shopId?: string,
    customerId?: string
  ): Promise<StorageUploadResult> {
    fileInput = await normalizeImageForUpload(fileInput);
    const validation = validateImageFile(fileInput, MAX_CUSTOMER_PHOTO_SIZE);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid customer photo');
    }

    // If it's already an external HTTP link, keep as is
    if (typeof fileInput === 'string' && !fileInput.startsWith('data:')) {
      return {
        storagePath: fileInput,
        url: fileInput,
        signedUrl: fileInput,
        bucket: 'customer-photos',
      };
    }

    if (!isSupabaseConfigured()) {
      if (typeof fileInput === 'string') {
        return {
          storagePath: `local/customer_${Date.now()}`,
          url: fileInput,
          signedUrl: fileInput,
          bucket: 'customer-photos',
        };
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve({
            storagePath: `local/customer_${Date.now()}`,
            url: dataUrl,
            signedUrl: dataUrl,
            bucket: 'customer-photos',
          });
        };
        reader.readAsDataURL(fileInput);
      });
    }

    const activeShopId = shopId || (await authApi.getActiveShopId());
    if (!activeShopId) {
      throw new Error('Authentication required: Missing shop authorization for customer photo upload.');
    }

    const cleanShopId = sanitizePathSegment(activeShopId);
    const cleanCustomerId = sanitizePathSegment(customerId || 'c_portrait');
    const { data: payloadData, extension, contentType } = prepareUploadPayload(fileInput);

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const filePath = `${cleanShopId}/${cleanCustomerId}/${timestamp}_${randomHex}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('customer-photos')
      .upload(filePath, payloadData, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageService] Customer photo upload error:', uploadError.message);
      throw new Error(`Failed to upload customer photo: ${uploadError.message}`);
    }

    // Generate signed URL (expires in 24 hours / 86400s) for private bucket display
    const { data: signedData, error: signError } = await supabase.storage
      .from('customer-photos')
      .createSignedUrl(filePath, 86400);

    const signedUrl = signError || !signedData ? filePath : signedData.signedUrl;

    return {
      storagePath: filePath,
      url: signedUrl,
      signedUrl,
      bucket: 'customer-photos',
    };
  },

  /**
   * Upload garment catalog image to garment-images bucket (Public read catalog)
   * Target Path: garment-images/{shop_id}/{garment_id}/{timestamp}_{random}.{ext}
   */
  async uploadGarmentImage(
    fileInput: File | Blob | string,
    shopId?: string,
    productId?: string
  ): Promise<string> {
    const res = await this.uploadGarmentImageDetailed(fileInput, shopId, productId);
    return res.url;
  },

  async uploadGarmentImageDetailed(
    fileInput: File | Blob | string,
    shopId?: string,
    productId?: string
  ): Promise<StorageUploadResult> {
    fileInput = await normalizeImageForUpload(fileInput);
    const validation = validateImageFile(fileInput, MAX_GARMENT_IMAGE_SIZE);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid garment image');
    }

    if (typeof fileInput === 'string' && !fileInput.startsWith('data:')) {
      return {
        storagePath: fileInput,
        url: fileInput,
        bucket: 'garment-images',
      };
    }

    if (!isSupabaseConfigured()) {
      if (typeof fileInput === 'string') {
        return {
          storagePath: `local/garment_${Date.now()}`,
          url: fileInput,
          bucket: 'garment-images',
        };
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve({
            storagePath: `local/garment_${Date.now()}`,
            url: dataUrl,
            bucket: 'garment-images',
          });
        };
        reader.readAsDataURL(fileInput);
      });
    }

    const activeShopId = shopId || (await authApi.getActiveShopId());
    if (!activeShopId) {
      throw new Error('Authentication required: Missing shop authorization for garment upload.');
    }

    const cleanShopId = sanitizePathSegment(activeShopId);
    const cleanProductId = sanitizePathSegment(productId || 'garment');
    const { data: payloadData, extension, contentType } = prepareUploadPayload(fileInput);

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const filePath = `${cleanShopId}/${cleanProductId}/${timestamp}_${randomHex}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('garment-images')
      .upload(filePath, payloadData, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageService] Garment upload error:', uploadError.message);
      throw new Error(`Failed to upload garment image: ${uploadError.message}`);
    }

    const { data: publicData } = supabase.storage.from('garment-images').getPublicUrl(filePath);

    return {
      storagePath: filePath,
      url: publicData.publicUrl,
      bucket: 'garment-images',
    };
  },

  /**
   * Upload boutique logo or asset to shop-assets bucket
   * Target Path: shop-assets/{shop_id}/{filename}
   */
  async uploadShopAsset(
    fileInput: File | Blob | string,
    shopId?: string,
    assetName: string = 'logo'
  ): Promise<string> {
    const res = await this.uploadShopAssetDetailed(fileInput, shopId, assetName);
    return res.url;
  },

  async uploadShopLogo(fileInput: File | Blob | string, shopId?: string): Promise<string> {
    return this.uploadShopAsset(fileInput, shopId, 'logo');
  },

  async uploadShopAssetDetailed(
    fileInput: File | Blob | string,
    shopId?: string,
    assetName: string = 'asset'
  ): Promise<StorageUploadResult> {
    const validation = validateImageFile(fileInput, MAX_SHOP_ASSET_SIZE, ASSET_ALLOWED_MIME_TYPES);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid shop asset');
    }

    if (typeof fileInput === 'string' && !fileInput.startsWith('data:')) {
      return {
        storagePath: fileInput,
        url: fileInput,
        bucket: 'shop-assets',
      };
    }

    if (!isSupabaseConfigured()) {
      if (typeof fileInput === 'string') {
        return {
          storagePath: `local/asset_${Date.now()}`,
          url: fileInput,
          bucket: 'shop-assets',
        };
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve({
            storagePath: `local/asset_${Date.now()}`,
            url: dataUrl,
            bucket: 'shop-assets',
          });
        };
        reader.readAsDataURL(fileInput);
      });
    }

    const activeShopId = shopId || (await authApi.getActiveShopId());
    if (!activeShopId) {
      throw new Error('Authentication required: Missing shop authorization for asset upload.');
    }

    const cleanShopId = sanitizePathSegment(activeShopId);
    const cleanAssetName = sanitizePathSegment(assetName);
    const { data: payloadData, extension, contentType } = prepareUploadPayload(fileInput);

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const filePath = `${cleanShopId}/${cleanAssetName}_${timestamp}_${randomHex}.${extension}`;

    const { error } = await supabase.storage.from('shop-assets').upload(filePath, payloadData, {
      contentType,
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.error('[StorageService] Shop asset upload error:', error.message);
      throw new Error(`Failed to upload shop asset: ${error.message}`);
    }

    const { data } = supabase.storage.from('shop-assets').getPublicUrl(filePath);

    return {
      storagePath: filePath,
      url: data.publicUrl,
      bucket: 'shop-assets',
    };
  },

  /**
   * Upload AI Try-On result render to private tryon-results bucket
   * Target Path: tryon-results/{shop_id}/{result_id}/{timestamp}_{random}.{ext}
   */
  async uploadTryOnResult(
    fileInput: File | Blob | string,
    shopId?: string,
    resultId?: string,
    sessionId?: string
  ): Promise<string> {
    const res = await this.uploadTryOnResultDetailed(fileInput, shopId, resultId, sessionId);
    return res.signedUrl || res.url;
  },

  async uploadTryOnResultDetailed(
    fileInput: File | Blob | string,
    shopId?: string,
    resultId?: string,
    sessionId?: string
  ): Promise<StorageUploadResult> {
    const validation = validateImageFile(fileInput, MAX_TRYON_RESULT_SIZE);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid try-on image');
    }

    if (typeof fileInput === 'string' && !fileInput.startsWith('data:')) {
      return {
        storagePath: fileInput,
        url: fileInput,
        signedUrl: fileInput,
        bucket: 'tryon-results',
      };
    }

    if (!isSupabaseConfigured()) {
      if (typeof fileInput === 'string') {
        return {
          storagePath: `local/tryon_${Date.now()}`,
          url: fileInput,
          signedUrl: fileInput,
          bucket: 'tryon-results',
        };
      }
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          resolve({
            storagePath: `local/tryon_${Date.now()}`,
            url: dataUrl,
            signedUrl: dataUrl,
            bucket: 'tryon-results',
          });
        };
        reader.readAsDataURL(fileInput);
      });
    }

    const activeShopId = shopId || (await authApi.getActiveShopId());
    if (!activeShopId) {
      throw new Error('Authentication required: Missing shop authorization for try-on upload.');
    }

    const cleanShopId = sanitizePathSegment(activeShopId);
    const cleanSessionOrResultId = sanitizePathSegment(sessionId || resultId || 'tryon');
    const { data: payloadData, extension, contentType } = prepareUploadPayload(fileInput);

    const timestamp = Date.now();
    const randomHex = Math.random().toString(36).substring(2, 8);
    const filePath = `${cleanShopId}/${cleanSessionOrResultId}/${timestamp}_${randomHex}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from('tryon-results')
      .upload(filePath, payloadData, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageService] Try-on upload error:', uploadError.message);
      throw new Error(`Failed to upload try-on result: ${uploadError.message}`);
    }

    // Generate signed URL (expires in 24 hours / 86400s) for private bucket display
    const { data: signedData, error: signError } = await supabase.storage
      .from('tryon-results')
      .createSignedUrl(filePath, 86400);

    const signedUrl = signError || !signedData ? filePath : signedData.signedUrl;

    return {
      storagePath: filePath,
      url: signedUrl,
      signedUrl,
      bucket: 'tryon-results',
    };
  },

  /**
   * Generates a signed URL for private bucket objects (customer-photos, tryon-results).
   * Enforces short expiration (1 hour / 3600s) and multi-tenant shop isolation.
   */
  async getSignedUrl(bucket: string, pathOrUrl: string, expiresIn: number = 3600): Promise<string> {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('data:')) return pathOrUrl;
    if (!isSupabaseConfigured()) return pathOrUrl;

    try {
      // 1. Resolve and verify active shop authorization
      const activeShopId = await authApi.getActiveShopId();
      if (!activeShopId) {
        return '';
      }

      // 2. Extract clean relative storage path
      let cleanPath = pathOrUrl;

      // If a full Supabase URL is passed, extract the object path inside the bucket
      const bucketMarker = `/${bucket}/`;
      if (cleanPath.includes(bucketMarker)) {
        const afterBucket = cleanPath.split(bucketMarker)[1];
        cleanPath = afterBucket ? afterBucket.split('?')[0] : cleanPath;
      } else if (cleanPath.startsWith(`${bucket}/`)) {
        cleanPath = cleanPath.replace(`${bucket}/`, '').split('?')[0];
      }

      // 3. Multi-tenant path verification: Ensure file path belongs to current authenticated boutique
      const pathSegments = cleanPath.split('/');
      const pathShopId = pathSegments[0];

      if (pathShopId && pathShopId !== activeShopId) {
        // Prevent IDOR: User cannot request signed URLs for another boutique's objects
        console.warn('[StorageService] Access denied: Object path belongs to different boutique.');
        return '';
      }

      // 4. Create signed URL with short expiration (default 3600s / 1 hour)
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(cleanPath, expiresIn);
      if (error || !data) {
        return '';
      }

      return data.signedUrl;
    } catch {
      return '';
    }
  },

  /**
   * Helper to retrieve or refresh a customer portrait URL (short 1-hour expiration)
   */
  async getCustomerPhotoUrl(pathOrUrl: string, expiresIn: number = 3600): Promise<string> {
    return this.getSignedUrl('customer-photos', pathOrUrl, expiresIn);
  },

  /**
   * Helper to retrieve or refresh a private try-on result URL (short 1-hour expiration)
   */
  async getTryOnResultUrl(pathOrUrl: string, expiresIn: number = 3600): Promise<string> {
    return this.getSignedUrl('tryon-results', pathOrUrl, expiresIn);
  },

  /**
   * Helper to retrieve public garment image URL
   */
  getGarmentImageUrl(pathOrUrl: string): string {
    if (!pathOrUrl) return '';
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('data:')) {
      return pathOrUrl;
    }
    if (!isSupabaseConfigured()) {
      return pathOrUrl;
    }
    const cleanPath = pathOrUrl.startsWith('garment-images/')
      ? pathOrUrl.replace('garment-images/', '')
      : pathOrUrl;
    const { data } = supabase.storage.from('garment-images').getPublicUrl(cleanPath);
    return data.publicUrl;
  },
};
