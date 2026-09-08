import { Customer } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadCustomers, saveCustomers } from '../services/storage';
import { storageService } from '../services/storageService';
import { authApi } from './auth';
import { INITIAL_CUSTOMERS } from '../data/initialData';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapDbCustomer(row: any): Customer {
  return {
    id: row.id,
    shopId: row.shop_id,
    customerId: row.customer_id,
    name: row.name,
    phone: row.phone,
    imageUrl: row.image_url,
    gender: row.gender || undefined,
    notes: row.notes || undefined,
    consentAgreed: row.consent_agreed ?? true,
    tryOnCount: row.try_on_count ?? 0,
    createdAt: row.created_at,
  };
}

export const customersApi = {
  /**
   * Fetch all customers for the authenticated boutique
   */
  async getCustomers(): Promise<Customer[]> {
    if (!isSupabaseConfigured()) {
      return loadCustomers();
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to fetch customers from Supabase:', error.message);
        return loadCustomers();
      }

      if (data && data.length > 0) {
        // Resolve private signed URLs if stored as storage paths
        const mapped = await Promise.all(
          data.map(async (row) => {
            const customer = mapDbCustomer(row);
            if (customer.imageUrl && !customer.imageUrl.startsWith('http') && !customer.imageUrl.startsWith('data:')) {
              customer.imageUrl = await storageService.getCustomerPhotoUrl(customer.imageUrl);
            }
            return customer;
          })
        );
        saveCustomers(mapped);
        return mapped;
      }

      // If database is empty, seed initial sample customers for active shop
      const shopId = await authApi.getActiveShopId();
      if (shopId && UUID_REGEX.test(shopId)) {
        try {
          const insertPayloads = INITIAL_CUSTOMERS.map((c) => ({
            shop_id: shopId,
            customer_id: c.customerId,
            name: c.name,
            phone: c.phone,
            image_url: c.imageUrl,
            gender: c.gender || null,
            notes: c.notes || null,
            consent_agreed: c.consentAgreed ?? true,
            try_on_count: c.tryOnCount || 0,
          }));

          const { data: seeded, error: seedErr } = await supabase
            .from('customers')
            .insert(insertPayloads)
            .select();

          if (!seedErr && seeded && seeded.length > 0) {
            const mappedSeeded = seeded.map(mapDbCustomer);
            saveCustomers(mappedSeeded);
            return mappedSeeded;
          }
        } catch (seedEx) {
          console.warn('[CustomersApi] Initial customer seeding notice:', seedEx);
        }
      }

      const cached = loadCustomers();
      return cached;
    } catch (err) {
      console.warn('Customers fetch exception:', err);
      return loadCustomers();
    }
  },

  /**
   * Fetch single customer by internal UUID or formatted Customer ID (e.g. C001)
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    if (!isSupabaseConfigured()) {
      const list = loadCustomers();
      return list.find(c => c.id === id || c.customerId === id) || null;
    }

    try {
      const isUuid = UUID_REGEX.test(id);
      const query = isUuid
        ? supabase.from('customers').select('*').eq('id', id)
        : supabase.from('customers').select('*').eq('customer_id', id);

      const { data, error } = await query.maybeSingle();

      if (error || !data) {
        const list = loadCustomers();
        return list.find(c => c.id === id || c.customerId === id) || null;
      }

      const customer = mapDbCustomer(data);
      if (customer.imageUrl && !customer.imageUrl.startsWith('http') && !customer.imageUrl.startsWith('data:')) {
        customer.imageUrl = await storageService.getCustomerPhotoUrl(customer.imageUrl);
      }
      return customer;
    } catch {
      const list = loadCustomers();
      return list.find(c => c.id === id || c.customerId === id) || null;
    }
  },

  /**
   * Create customer record in Supabase with Storage upload
   */
  async addCustomer(customer: Customer): Promise<Customer> {
    const shopId = await authApi.getActiveShopId();
    let finalImageUrl = customer.imageUrl;

    // If imageUrl is base64 data URL, upload to private customer-photos bucket
    if (customer.imageUrl && customer.imageUrl.startsWith('data:')) {
      try {
        const uploadResult = await storageService.uploadCustomerPhotoDetailed(
          customer.imageUrl,
          shopId || undefined,
          customer.customerId
        );
        finalImageUrl = uploadResult.signedUrl || uploadResult.url;
      } catch (uploadErr) {
        console.warn('[CustomersApi] Storage upload notice:', uploadErr);
      }
    }

    const customerToSave: Customer = {
      ...customer,
      imageUrl: finalImageUrl,
    };

    if (!isSupabaseConfigured() || !shopId) {
      const list = loadCustomers();
      const updated = [customerToSave, ...list];
      saveCustomers(updated);
      return customerToSave;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          id: customerToSave.id && UUID_REGEX.test(customerToSave.id) ? customerToSave.id : undefined,
          shop_id: shopId,
          customer_id: customerToSave.customerId,
          name: customerToSave.name,
          phone: customerToSave.phone,
          image_url: customerToSave.imageUrl,
          gender: customerToSave.gender || null,
          notes: customerToSave.notes || null,
          consent_agreed: customerToSave.consentAgreed ?? true,
          try_on_count: customerToSave.tryOnCount || 0,
        })
        .select()
        .single();

      if (error) {
        console.warn('Customer insert error on Supabase, checking existing:', error.message);
        // If unique constraint violation or existing record
        const { data: existing } = await supabase
          .from('customers')
          .select('*')
          .eq('customer_id', customerToSave.customerId)
          .eq('shop_id', shopId)
          .maybeSingle();

        if (existing) {
          const existingMapped = mapDbCustomer(existing);
          return existingMapped;
        }

        const list = loadCustomers();
        saveCustomers([customerToSave, ...list]);
        return customerToSave;
      }

      const created = mapDbCustomer(data);
      // Keep signed URL for instant UI rendering
      created.imageUrl = customerToSave.imageUrl;
      const list = loadCustomers();
      saveCustomers([created, ...list.filter(c => c.id !== created.id)]);
      return created;
    } catch (err) {
      console.warn('Exception adding customer:', err);
      const list = loadCustomers();
      saveCustomers([customerToSave, ...list]);
      return customerToSave;
    }
  },

  /**
   * Update existing customer
   */
  async updateCustomer(customer: Customer): Promise<Customer> {
    const shopId = await authApi.getActiveShopId();
    let finalImageUrl = customer.imageUrl;

    // If new photo was uploaded as base64 data URL
    if (customer.imageUrl && customer.imageUrl.startsWith('data:')) {
      try {
        const uploadResult = await storageService.uploadCustomerPhotoDetailed(
          customer.imageUrl,
          shopId || undefined,
          customer.customerId
        );
        finalImageUrl = uploadResult.signedUrl || uploadResult.url;
      } catch (uploadErr) {
        console.warn('[CustomersApi] Storage upload notice during update:', uploadErr);
      }
    }

    const customerToSave: Customer = {
      ...customer,
      imageUrl: finalImageUrl,
    };

    if (!isSupabaseConfigured()) {
      const list = loadCustomers();
      const updated = list.map(c => (c.id === customerToSave.id ? customerToSave : c));
      saveCustomers(updated);
      return customerToSave;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          customer_id: customerToSave.customerId,
          name: customerToSave.name,
          phone: customerToSave.phone,
          image_url: customerToSave.imageUrl,
          gender: customerToSave.gender || null,
          notes: customerToSave.notes || null,
          consent_agreed: customerToSave.consentAgreed,
        })
        .eq('id', customerToSave.id)
        .select()
        .single();

      if (error) {
        console.warn('Customer update error on Supabase:', error.message);
        const list = loadCustomers();
        saveCustomers(list.map(c => (c.id === customerToSave.id ? customerToSave : c)));
        return customerToSave;
      }

      const updated = mapDbCustomer(data);
      updated.imageUrl = customerToSave.imageUrl;
      const list = loadCustomers();
      saveCustomers(list.map(c => (c.id === updated.id ? updated : c)));
      return updated;
    } catch {
      const list = loadCustomers();
      saveCustomers(list.map(c => (c.id === customerToSave.id ? customerToSave : c)));
      return customerToSave;
    }
  },

  /**
   * Delete customer from Supabase
   */
  async deleteCustomer(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      const list = loadCustomers();
      saveCustomers(list.filter(c => c.id !== id && c.customerId !== id));
      return true;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .or(`id.eq.${id},customer_id.eq.${id}`);

      if (error) {
        console.warn('Customer delete error on Supabase:', error.message);
      }

      const list = loadCustomers();
      saveCustomers(list.filter(c => c.id !== id && c.customerId !== id));
      return true;
    } catch {
      const list = loadCustomers();
      saveCustomers(list.filter(c => c.id !== id && c.customerId !== id));
      return true;
    }
  },
};
