import { TryOnResult } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadTryOns, saveTryOns } from '../services/storage';
import { storageService } from '../services/storageService';
import { authApi } from './auth';

function mapDbTryOn(row: any): TryOnResult {
  return {
    id: row.id,
    shopId: row.shop_id,
    customerId: row.customer_id,
    customerName: row.customer_name_snapshot || row.customer_name || 'Customer',
    customerPhoto: row.customer_photo_url || row.customer_photo || '',
    customerPhone: row.customer_phone_snapshot || row.customer_phone || undefined,
    garmentId: row.garment_id,
    garmentProductId: row.garment_product_id_snapshot || row.garment_product_id || 'J001',
    garmentName: row.garment_name_snapshot || row.garment_name || 'Garment',
    garmentPhoto: row.garment_photo_url || row.garment_photo || '',
    garmentPrice: Number(row.garment_price_snapshot ?? row.garment_price) || 0,
    garmentCategory: row.garment_category_snapshot || row.garment_category || 'Dresses',
    resultImageUrl: row.result_image_url || row.result_image || '',
    createdAt: row.created_at || new Date().toISOString(),
    status: (row.status as 'Completed' | 'Processing' | 'Failed') || 'Completed',
    notes: row.notes || undefined,
    sessionId: row.session_id || undefined,
    errorMessage: row.error_message || undefined,
    progressPhase: row.progress_phase || undefined,
  };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const tryOnsApi = {
  /**
   * Fetch try-on history from Supabase for current shop only
   */
  async getTryOns(): Promise<TryOnResult[]> {
    if (!isSupabaseConfigured()) {
      return loadTryOns();
    }

    try {
      const shopId = await authApi.getActiveShopId();
      let query = supabase.from('try_on_results').select('*');
      if (shopId && UUID_REGEX.test(shopId)) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch tryons from Supabase:', error.message);
        return loadTryOns();
      }

      if (data && data.length > 0) {
        const mapped = await Promise.all(
          data.map(async (row) => {
            const tryon = mapDbTryOn(row);
            if (tryon.resultImageUrl && !tryon.resultImageUrl.startsWith('http') && !tryon.resultImageUrl.startsWith('data:')) {
              tryon.resultImageUrl = await storageService.getTryOnResultUrl(tryon.resultImageUrl);
            }
            if (tryon.customerPhoto && !tryon.customerPhoto.startsWith('http') && !tryon.customerPhoto.startsWith('data:')) {
              tryon.customerPhoto = await storageService.getCustomerPhotoUrl(tryon.customerPhoto);
            }
            return tryon;
          })
        );
        saveTryOns(mapped);
        return mapped;
      }

      return [];
    } catch (err) {
      console.warn('Tryons fetch exception:', err);
      return loadTryOns();
    }
  },

  /**
   * Fetch try-on history for a specific customer
   */
  async getCustomerTryOns(customerId: string): Promise<TryOnResult[]> {
    if (!isSupabaseConfigured()) {
      const list = loadTryOns();
      return list.filter(t => t.customerId === customerId);
    }

    try {
      const shopId = await authApi.getActiveShopId();
      let query = supabase
        .from('try_on_results')
        .select('*')
        .eq('customer_id', customerId);

      if (shopId && UUID_REGEX.test(shopId)) {
        query = query.eq('shop_id', shopId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error || !data) {
        const list = loadTryOns();
        return list.filter(t => t.customerId === customerId);
      }

      const mapped = await Promise.all(
        data.map(async (row) => {
          const tryon = mapDbTryOn(row);
          if (tryon.resultImageUrl && !tryon.resultImageUrl.startsWith('http') && !tryon.resultImageUrl.startsWith('data:')) {
            tryon.resultImageUrl = await storageService.getTryOnResultUrl(tryon.resultImageUrl);
          }
          if (tryon.customerPhoto && !tryon.customerPhoto.startsWith('http') && !tryon.customerPhoto.startsWith('data:')) {
            tryon.customerPhoto = await storageService.getCustomerPhotoUrl(tryon.customerPhoto);
          }
          return tryon;
        })
      );
      return mapped;
    } catch {
      const list = loadTryOns();
      return list.filter(t => t.customerId === customerId);
    }
  },

  /**
   * Fetch a single try-on by ID with fresh resolved URLs
   */
  async getTryOnById(id: string): Promise<TryOnResult | null> {
    if (!isSupabaseConfigured()) {
      const list = loadTryOns();
      return list.find((t) => t.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('try_on_results')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;

      const tryon = mapDbTryOn(data);
      if (tryon.resultImageUrl && !tryon.resultImageUrl.startsWith('http') && !tryon.resultImageUrl.startsWith('data:')) {
        tryon.resultImageUrl = await storageService.getTryOnResultUrl(tryon.resultImageUrl);
      }
      if (tryon.customerPhoto && !tryon.customerPhoto.startsWith('http') && !tryon.customerPhoto.startsWith('data:')) {
        tryon.customerPhoto = await storageService.getCustomerPhotoUrl(tryon.customerPhoto);
      }
      return tryon;
    } catch {
      return null;
    }
  },

  /**
   * Save a completed or updated try-on record with private Storage upload
   */
  async saveTryOn(result: TryOnResult): Promise<TryOnResult> {
    const shopId = await authApi.getActiveShopId();
    let finalResultImageUrl = result.resultImageUrl;

    // If resultImageUrl is base64 data URL, upload to private tryon-results bucket
    if (result.resultImageUrl && result.resultImageUrl.startsWith('data:')) {
      try {
        const uploadRes = await storageService.uploadTryOnResultDetailed(
          result.resultImageUrl,
          shopId || undefined,
          result.id,
          result.sessionId
        );
        finalResultImageUrl = uploadRes.signedUrl || uploadRes.url;
      } catch (uploadErr) {
        console.warn('[TryOnsApi] Storage upload notice:', uploadErr);
      }
    }

    const resultToSave: TryOnResult = {
      ...result,
      shopId: shopId || result.shopId,
      resultImageUrl: finalResultImageUrl,
    };

    if (!isSupabaseConfigured()) {
      const list = loadTryOns();
      const exists = list.some(t => t.id === resultToSave.id);
      if (!exists) {
        saveTryOns([resultToSave, ...list]);
      } else {
        saveTryOns(list.map(t => t.id === resultToSave.id ? resultToSave : t));
      }
      return resultToSave;
    }

    try {
      const { data, error } = await supabase
        .from('try_on_results')
        .upsert({
          id: resultToSave.id.includes('-') && resultToSave.id.length > 30 ? resultToSave.id : undefined,
          shop_id: shopId || null,
          session_id: resultToSave.sessionId || null,
          customer_id: resultToSave.customerId,
          garment_id: resultToSave.garmentId,
          customer_name_snapshot: resultToSave.customerName,
          customer_id_snapshot: resultToSave.customerId,
          customer_photo_url: resultToSave.customerPhoto,
          customer_phone_snapshot: resultToSave.customerPhone || null,
          garment_product_id_snapshot: resultToSave.garmentProductId,
          garment_name_snapshot: resultToSave.garmentName,
          garment_photo_url: resultToSave.garmentPhoto,
          garment_price_snapshot: resultToSave.garmentPrice,
          garment_category_snapshot: resultToSave.garmentCategory,
          result_image_url: resultToSave.resultImageUrl,
          status: resultToSave.status,
          error_message: resultToSave.errorMessage || null,
          progress_phase: resultToSave.progressPhase || null,
          notes: resultToSave.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.warn('TryOn upsert error on Supabase:', error.message);
        const list = loadTryOns();
        if (!list.some(t => t.id === resultToSave.id)) {
          saveTryOns([resultToSave, ...list]);
        } else {
          saveTryOns(list.map(t => t.id === resultToSave.id ? resultToSave : t));
        }
        return resultToSave;
      }

      const saved = mapDbTryOn(data);
      saved.resultImageUrl = resultToSave.resultImageUrl;
      const list = loadTryOns();
      saveTryOns([saved, ...list.filter(t => t.id !== saved.id)]);
      return saved;
    } catch (err) {
      console.warn('Exception saving tryon:', err);
      const list = loadTryOns();
      if (!list.some(t => t.id === resultToSave.id)) {
        saveTryOns([resultToSave, ...list]);
      } else {
        saveTryOns(list.map(t => t.id === resultToSave.id ? resultToSave : t));
      }
      return resultToSave;
    }
  },

  /**
   * Delete a try-on record
   */
  async deleteTryOn(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = loadTryOns();
      const updated = list.filter(t => t.id !== id);
      saveTryOns(updated);
      return true;
    }

    try {
      const { error } = await supabase
        .from('try_on_results')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Try-on delete error on Supabase:', error.message);
      }

      const list = loadTryOns();
      saveTryOns(list.filter(t => t.id !== id));
      return true;
    } catch {
      const list = loadTryOns();
      saveTryOns(list.filter(t => t.id !== id));
      return true;
    }
  },
};
