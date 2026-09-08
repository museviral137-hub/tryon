import { ShopSettings, AIUsage } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loadSettings,
  saveSettings,
  loadAIUsage,
  topUpAICredits,
  isOnboardingCompleted,
  setOnboardingCompleted,
} from '../services/storage';
import { storageService } from '../services/storageService';
import { authApi } from './auth';

export const shopApi = {
  /**
   * Fetch boutique configuration & settings
   */
  async getShopSettings(): Promise<ShopSettings> {
    if (!isSupabaseConfigured()) {
      return loadSettings();
    }

    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select(`
          *,
          shop:shops (
            name,
            owner_name,
            phone,
            email,
            address,
            logo_url
          )
        `)
        .maybeSingle();

      if (error || !data) {
        return loadSettings();
      }

      const shop = data.shop || {};
      const settings: ShopSettings = {
        shopName: shop.name || 'VestiAI Boutique',
        ownerName: shop.owner_name || 'Store Owner',
        phone: shop.phone || '+91 98765 43210',
        email: shop.email || 'boutique@vestiai.shop',
        address: shop.address || 'Fashion Street, Mumbai',
        logoUrl: shop.logo_url || undefined,
        productPrefix: data.product_prefix || 'J',
        customerPrefix: data.customer_prefix || 'C',
        productStartNum: data.product_start_num || 1,
        customerStartNum: data.customer_start_num || 1,
        currencySymbol: data.currency_symbol || '₹',
        watermarkEnabled: data.watermark_enabled ?? true,
        autoSaveHistory: data.auto_save_history ?? true,
        theme: data.theme === 'dark' ? 'dark' : 'light',
        isOnboarded: data.is_onboarded ?? true,
      };

      saveSettings(settings);
      return settings;
    } catch (err) {
      console.warn('Exception loading shop settings from Supabase:', err);
      return loadSettings();
    }
  },

  /**
   * Update boutique profile and settings with Shop Logo upload
   */
  async updateShopSettings(settings: ShopSettings): Promise<ShopSettings> {
    const shopId = await authApi.getActiveShopId();
    let finalLogoUrl = settings.logoUrl;

    if (settings.logoUrl && settings.logoUrl.startsWith('data:')) {
      try {
        const uploadResult = await storageService.uploadShopAssetDetailed(
          settings.logoUrl,
          shopId || undefined,
          'boutique_logo'
        );
        finalLogoUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn('[ShopApi] Logo storage upload notice:', uploadErr);
      }
    }

    const settingsToSave: ShopSettings = {
      ...settings,
      logoUrl: finalLogoUrl,
    };

    if (!isSupabaseConfigured()) {
      saveSettings(settingsToSave);
      return settingsToSave;
    }

    try {
      if (shopId) {
        // 1. Update shop entity
        await supabase
          .from('shops')
          .update({
            name: settingsToSave.shopName,
            owner_name: settingsToSave.ownerName,
            phone: settingsToSave.phone,
            email: settingsToSave.email,
            address: settingsToSave.address,
            logo_url: settingsToSave.logoUrl || null,
          })
          .eq('id', shopId);

        // 2. Update shop settings
        await supabase
          .from('shop_settings')
          .upsert({
            shop_id: shopId,
            product_prefix: settingsToSave.productPrefix,
            customer_prefix: settingsToSave.customerPrefix,
            product_start_num: settingsToSave.productStartNum,
            customer_start_num: settingsToSave.customerStartNum,
            currency_symbol: settingsToSave.currencySymbol,
            watermark_enabled: settingsToSave.watermarkEnabled,
            auto_save_history: settingsToSave.autoSaveHistory,
            theme: settingsToSave.theme,
            is_onboarded: settingsToSave.isOnboarded,
          });
      }

      saveSettings(settingsToSave);
      return settingsToSave;
    } catch (err) {
      console.warn('Exception updating settings on Supabase:', err);
      saveSettings(settingsToSave);
      return settingsToSave;
    }
  },

  /**
   * Fetch server-side AI Credit Balance from Supabase ai_credit_accounts
   */
  async getAIUsage(): Promise<AIUsage> {
    if (!isSupabaseConfigured()) {
      return loadAIUsage();
    }

    try {
      const shopId = await authApi.getActiveShopId();
      if (!shopId) {
        return {
          totalCredits: 0,
          usedCredits: 0,
          remainingCredits: 0,
          tryOnsToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        };
      }

      const { data, error } = await supabase
        .from('ai_credit_accounts')
        .select('remaining_credits, total_credits, used_credits, try_ons_today, last_reset_date')
        .eq('shop_id', shopId)
        .maybeSingle();

      if (error) {
        console.error('[ShopApi] Error loading credits from Supabase ai_credit_accounts:', error);
        // Authoritative failure: return 0 remaining credits, do NOT fallback to localStorage
        return {
          totalCredits: 0,
          usedCredits: 0,
          remainingCredits: 0,
          tryOnsToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        };
      }

      if (!data) {
        return {
          totalCredits: 0,
          usedCredits: 0,
          remainingCredits: 0,
          tryOnsToday: 0,
          lastResetDate: new Date().toISOString().split('T')[0],
        };
      }

      const usage: AIUsage = {
        totalCredits: data.total_credits ?? 0,
        usedCredits: data.used_credits ?? 0,
        remainingCredits: data.remaining_credits ?? 0,
        tryOnsToday: data.try_ons_today ?? 0,
        lastResetDate: data.last_reset_date || new Date().toISOString().split('T')[0],
      };

      return usage;
    } catch (err) {
      console.error('[ShopApi] Exception loading credits from Supabase:', err);
      return {
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        tryOnsToday: 0,
        lastResetDate: new Date().toISOString().split('T')[0],
      };
    }
  },

  /**
   * Top up credits atomically via DB RPC or direct DB update on ai_credit_accounts
   */
  async topUpCredits(amount: number = 50): Promise<AIUsage> {
    if (!isSupabaseConfigured()) {
      return topUpAICredits(amount);
    }

    try {
      const shopId = await authApi.getActiveShopId();

      if (!shopId) {
        throw new Error('Active shop ID not found for credit top up');
      }

      const { error: rpcError } = await supabase.rpc('top_up_shop_ai_credit', {
        p_shop_id: shopId,
        p_amount: amount,
      });

      if (rpcError) {
        console.error('[ShopApi] top_up_shop_ai_credit RPC failed:', rpcError.message);
        throw new Error(`Failed to top up AI credits via database RPC: ${rpcError.message}`);
      }

      const updated = await this.getAIUsage();
      return updated;
    } catch (err) {
      console.error('Credit top up exception:', err);
      throw err;
    }
  },

  /**
   * Check if boutique has completed the setup walkthrough
   */
  async checkOnboardingStatus(): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return isOnboardingCompleted();
    }

    try {
      const { data } = await supabase
        .from('shop_settings')
        .select('is_onboarded')
        .maybeSingle();

      if (data) {
        return Boolean(data.is_onboarded);
      }
      return isOnboardingCompleted();
    } catch {
      return isOnboardingCompleted();
    }
  },

  /**
   * Mark onboarding completed and persist initial boutique settings
   */
  async completeOnboarding(settings: ShopSettings): Promise<void> {
    await this.updateShopSettings({ ...settings, isOnboarded: true });
    setOnboardingCompleted(true);
  },
};
