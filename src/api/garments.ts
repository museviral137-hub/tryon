import { Garment, GarmentCategory, StockStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadGarments, saveGarments } from '../services/storage';
import { storageService } from '../services/storageService';
import { authApi } from './auth';
import { INITIAL_GARMENTS } from '../data/initialData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapDbGarment(row: any): Garment {
  return {
    id: row.id,
    shopId: row.shop_id,
    productId: row.product_id,
    name: row.name,
    category: row.category as GarmentCategory,
    price: Number(row.price) || 0,
    imageUrl: row.image_url,
    brand: row.brand || undefined,
    size: row.size || undefined,
    color: row.color || undefined,
    stockStatus: (row.stock_status as StockStatus) || 'Available',
    notes: row.notes || undefined,
    tryOnCount: row.try_on_count ?? 0,
    createdAt: row.created_at,
  };
}

export const garmentsApi = {
  /**
   * Fetch garments catalog from Supabase
   */
  async getGarments(): Promise<Garment[]> {
    if (!isSupabaseConfigured()) {
      return loadGarments();
    }

    try {
      const { data, error } = await supabase
        .from('garments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch garments from Supabase:', error.message);
        return loadGarments();
      }

      if (data && data.length > 0) {
        const mapped = data.map((row) => {
          const garment = mapDbGarment(row);
          if (garment.imageUrl && !garment.imageUrl.startsWith('http') && !garment.imageUrl.startsWith('data:')) {
            garment.imageUrl = storageService.getGarmentImageUrl(garment.imageUrl);
          }
          return garment;
        });
        saveGarments(mapped);
        return mapped;
      }

      // If database is empty, seed initial sample garments for active shop
      const shopId = await authApi.getActiveShopId();
      if (shopId && UUID_REGEX.test(shopId)) {
        try {
          const insertPayloads = INITIAL_GARMENTS.map((g) => ({
            shop_id: shopId,
            product_id: g.productId,
            name: g.name,
            category: g.category,
            price: g.price,
            image_url: g.imageUrl,
            brand: g.brand || null,
            size: g.size || 'Free Size',
            color: g.color || null,
            stock_status: g.stockStatus || 'Available',
            notes: g.notes || null,
            try_on_count: g.tryOnCount || 0,
          }));

          const { data: seeded, error: seedErr } = await supabase
            .from('garments')
            .insert(insertPayloads)
            .select();

          if (!seedErr && seeded && seeded.length > 0) {
            const mappedSeeded = seeded.map(mapDbGarment);
            saveGarments(mappedSeeded);
            return mappedSeeded;
          }
        } catch (seedEx) {
          console.warn('[GarmentsApi] Initial garment seeding notice:', seedEx);
        }
      }

      return loadGarments();
    } catch (err) {
      console.warn('Garments fetch exception:', err);
      return loadGarments();
    }
  },

  /**
   * Fetch single garment by internal UUID or SKU (e.g. J001)
   */
  async getGarmentById(id: string): Promise<Garment | null> {
    if (!isSupabaseConfigured()) {
      const list = loadGarments();
      return list.find(g => g.id === id || g.productId.toUpperCase() === id.toUpperCase()) || null;
    }

    try {
      const isUuid = UUID_REGEX.test(id);
      const query = isUuid
        ? supabase.from('garments').select('*').eq('id', id)
        : supabase.from('garments').select('*').eq('product_id', id.toUpperCase());

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        const list = loadGarments();
        return list.find(g => g.id === id || g.productId.toUpperCase() === id.toUpperCase()) || null;
      }

      const garment = mapDbGarment(data);
      if (garment.imageUrl && !garment.imageUrl.startsWith('http') && !garment.imageUrl.startsWith('data:')) {
        garment.imageUrl = storageService.getGarmentImageUrl(garment.imageUrl);
      }
      return garment;
    } catch {
      const list = loadGarments();
      return list.find(g => g.id === id || g.productId.toUpperCase() === id.toUpperCase()) || null;
    }
  },

  /**
   * Add a new garment to catalog with Storage upload
   */
  async addGarment(garment: Garment): Promise<Garment> {
    const shopId = await authApi.getActiveShopId();
    let finalImageUrl = garment.imageUrl;

    // If imageUrl is base64 data URL, upload to public garment-images bucket
    if (garment.imageUrl && garment.imageUrl.startsWith('data:')) {
      try {
        const uploadResult = await storageService.uploadGarmentImageDetailed(
          garment.imageUrl,
          shopId || undefined,
          garment.productId
        );
        finalImageUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('[GarmentsApi] Storage upload notice:', uploadErr);
      }
    }

    const garmentToSave: Garment = {
      ...garment,
      imageUrl: finalImageUrl,
    };

    if (!isSupabaseConfigured() || !shopId) {
      const list = loadGarments();
      const updated = [garmentToSave, ...list];
      saveGarments(updated);
      return garmentToSave;
    }

    try {
      const { data, error } = await supabase
        .from('garments')
        .insert({
          id: garmentToSave.id && UUID_REGEX.test(garmentToSave.id) ? garmentToSave.id : undefined,
          shop_id: shopId,
          product_id: garmentToSave.productId,
          name: garmentToSave.name,
          category: garmentToSave.category,
          price: garmentToSave.price,
          image_url: garmentToSave.imageUrl,
          brand: garmentToSave.brand || null,
          size: garmentToSave.size || 'Free Size',
          color: garmentToSave.color || null,
          stock_status: garmentToSave.stockStatus || 'Available',
          notes: garmentToSave.notes || null,
          try_on_count: garmentToSave.tryOnCount || 0,
        })
        .select()
        .single();

      if (error) {
        console.warn('Garment insert error on Supabase, checking existing:', error.message);
        // If unique constraint violation or existing record
        const { data: existing } = await supabase
          .from('garments')
          .select('*')
          .eq('product_id', garmentToSave.productId)
          .eq('shop_id', shopId)
          .maybeSingle();

        if (existing) {
          const existingMapped = mapDbGarment(existing);
          return existingMapped;
        }

        const list = loadGarments();
        saveGarments([garmentToSave, ...list]);
        return garmentToSave;
      }

      const created = mapDbGarment(data);
      created.imageUrl = garmentToSave.imageUrl;
      const list = loadGarments();
      saveGarments([created, ...list.filter(g => g.id !== created.id)]);
      return created;
    } catch (err) {
      console.warn('Exception adding garment:', err);
      const list = loadGarments();
      saveGarments([garmentToSave, ...list]);
      return garmentToSave;
    }
  },

  /**
   * Update existing garment
   */
  async updateGarment(garment: Garment): Promise<Garment> {
    const shopId = await authApi.getActiveShopId();
    let finalImageUrl = garment.imageUrl;

    if (garment.imageUrl && garment.imageUrl.startsWith('data:')) {
      try {
        const uploadResult = await storageService.uploadGarmentImageDetailed(
          garment.imageUrl,
          shopId || undefined,
          garment.productId
        );
        finalImageUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('[GarmentsApi] Storage upload notice during update:', uploadErr);
      }
    }

    const garmentToSave: Garment = {
      ...garment,
      imageUrl: finalImageUrl,
    };

    if (!isSupabaseConfigured()) {
      const list = loadGarments();
      const updated = list.map(g => (g.id === garmentToSave.id ? garmentToSave : g));
      saveGarments(updated);
      return garmentToSave;
    }

    try {
      const { data, error } = await supabase
        .from('garments')
        .update({
          product_id: garmentToSave.productId,
          name: garmentToSave.name,
          category: garmentToSave.category,
          price: garmentToSave.price,
          image_url: garmentToSave.imageUrl,
          brand: garmentToSave.brand || null,
          size: garmentToSave.size || 'Free Size',
          color: garmentToSave.color || null,
          stock_status: garmentToSave.stockStatus || 'Available',
          notes: garmentToSave.notes || null,
        })
        .eq('id', garmentToSave.id)
        .select()
        .single();

      if (error) {
        console.warn('Garment update error on Supabase:', error.message);
        const list = loadGarments();
        saveGarments(list.map(g => (g.id === garmentToSave.id ? garmentToSave : g)));
        return garmentToSave;
      }

      const updated = mapDbGarment(data);
      updated.imageUrl = garmentToSave.imageUrl;
      const list = loadGarments();
      saveGarments(list.map(g => (g.id === updated.id ? updated : g)));
      return updated;
    } catch {
      const list = loadGarments();
      saveGarments(list.map(g => (g.id === garmentToSave.id ? garmentToSave : g)));
      return garmentToSave;
    }
  },

  /**
   * Delete garment from catalog
   */
  async deleteGarment(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = loadGarments();
      saveGarments(list.filter(g => g.id !== id && g.productId.toUpperCase() !== id.toUpperCase()));
      return true;
    }

    try {
      const { error } = await supabase
        .from('garments')
        .delete()
        .or(`id.eq.${id},product_id.eq.${id}`);

      if (error) {
        console.warn('Garment delete error on Supabase:', error.message);
      }

      const list = loadGarments();
      saveGarments(list.filter(g => g.id !== id && g.productId.toUpperCase() !== id.toUpperCase()));
      return true;
    } catch {
      const list = loadGarments();
      saveGarments(list.filter(g => g.id !== id && g.productId.toUpperCase() !== id.toUpperCase()));
      return true;
    }
  },
};
