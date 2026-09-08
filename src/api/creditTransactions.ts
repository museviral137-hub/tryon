import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CreditTransaction } from '../types';
import { authApi } from './auth';

const STORAGE_TXS_KEY = 'vestiai_credit_transactions_cache_v2';

const INITIAL_FALLBACK_TRANSACTIONS: CreditTransaction[] = [
  {
    id: 'tx_welcome_grant',
    shopId: 'default_shop',
    amount: 100,
    type: 'grant',
    description: 'Welcome boutique trial grant (100 free credits)',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function loadCachedTransactions(): CreditTransaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_TXS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_FALLBACK_TRANSACTIONS;
  } catch {
    return INITIAL_FALLBACK_TRANSACTIONS;
  }
}

function saveCachedTransactions(txs: CreditTransaction[]): void {
  try {
    localStorage.setItem(STORAGE_TXS_KEY, JSON.stringify(txs));
  } catch (e) {
    console.warn('Failed to cache credit transactions', e);
  }
}

export const creditTransactionsApi = {
  /**
   * Fetches the complete ledger of AI credit transactions for the active boutique
   */
  async getTransactions(): Promise<CreditTransaction[]> {
    if (!isSupabaseConfigured() || !supabase) {
      return loadCachedTransactions();
    }

    try {
      const shopId = await authApi.getActiveShopId();
      if (!shopId) {
        return loadCachedTransactions();
      }

      const { data, error } = await supabase
        .from('ai_credit_transactions')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        console.warn('[creditTransactionsApi] Failed to fetch transactions from DB:', error);
        return loadCachedTransactions();
      }

      const formatted: CreditTransaction[] = data.map((d) => ({
        id: d.id,
        shopId: d.shop_id,
        tryOnResultId: d.try_on_result_id,
        amount: d.amount,
        type: d.type,
        description: d.description,
        createdAt: d.created_at,
      }));

      saveCachedTransactions(formatted);
      return formatted;
    } catch (e) {
      console.warn('[creditTransactionsApi] Exception fetching transactions:', e);
      return loadCachedTransactions();
    }
  },

  /**
   * Appends a local transaction for immediate UI feedback
   */
  addLocalTransaction(tx: Omit<CreditTransaction, 'id' | 'createdAt'>): CreditTransaction {
    const newTx: CreditTransaction = {
      ...tx,
      id: `tx_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const current = loadCachedTransactions();
    const updated = [newTx, ...current];
    saveCachedTransactions(updated);
    return newTx;
  },
};
