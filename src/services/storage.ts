import { Garment, Customer, TryOnResult, ShopSettings, AIUsage } from '../types';
import {
  INITIAL_GARMENTS,
  INITIAL_CUSTOMERS,
  INITIAL_TRYONS,
  INITIAL_SETTINGS,
} from '../data/initialData';

const KEYS = {
  GARMENTS: 'vestiai_garments_v2',
  CUSTOMERS: 'vestiai_customers_v2',
  TRYONS: 'vestiai_tryons_v2',
  SETTINGS: 'vestiai_settings_v2',
  USAGE: 'vestiai_usage_v2',
  ONBOARDING_COMPLETED: 'vestiai_onboarded_v2',
};

const DEFAULT_USAGE: AIUsage = {
  totalCredits: 3,
  usedCredits: 0,
  remainingCredits: 3,
  tryOnsToday: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
};

export function loadGarments(): Garment[] {
  try {
    const raw = localStorage.getItem(KEYS.GARMENTS);
    if (!raw) {
      localStorage.setItem(KEYS.GARMENTS, JSON.stringify(INITIAL_GARMENTS));
      return INITIAL_GARMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load garments from cache', e);
    return INITIAL_GARMENTS;
  }
}

export function saveGarments(garments: Garment[]): void {
  try {
    localStorage.setItem(KEYS.GARMENTS, JSON.stringify(garments));
  } catch (e) {
    console.warn('Failed to save garments to cache', e);
  }
}

export function loadCustomers(): Customer[] {
  try {
    const raw = localStorage.getItem(KEYS.CUSTOMERS);
    if (!raw) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
      return INITIAL_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load customers from cache', e);
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.warn('Failed to save customers to cache', e);
  }
}

export function loadTryOns(): TryOnResult[] {
  try {
    const raw = localStorage.getItem(KEYS.TRYONS);
    if (!raw) {
      localStorage.setItem(KEYS.TRYONS, JSON.stringify(INITIAL_TRYONS));
      return INITIAL_TRYONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load tryons from cache', e);
    return INITIAL_TRYONS;
  }
}

export function saveTryOns(tryOns: TryOnResult[]): void {
  try {
    localStorage.setItem(KEYS.TRYONS, JSON.stringify(tryOns));
  } catch (e) {
    console.warn('Failed to save tryons to cache', e);
  }
}

export function loadSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return { ...INITIAL_SETTINGS, ...parsed };
  } catch (e) {
    console.warn('Failed to load settings from cache', e);
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: ShopSettings): void {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to cache', e);
  }
}

export function loadAIUsage(): AIUsage {
  try {
    const raw = localStorage.getItem(KEYS.USAGE);
    if (!raw) {
      localStorage.setItem(KEYS.USAGE, JSON.stringify(DEFAULT_USAGE));
      return DEFAULT_USAGE;
    }
    const parsed = JSON.parse(raw);
    if (parsed.totalCredits >= 100 || parsed.remainingCredits >= 80) {
      localStorage.setItem(KEYS.USAGE, JSON.stringify(DEFAULT_USAGE));
      return DEFAULT_USAGE;
    }
    return parsed;
  } catch (e) {
    return DEFAULT_USAGE;
  }
}

export function saveAIUsage(usage: AIUsage): void {
  try {
    localStorage.setItem(KEYS.USAGE, JSON.stringify(usage));
  } catch (e) {
    console.warn('Failed to save AI usage', e);
  }
}

export function deductAICredit(): AIUsage {
  const current = loadAIUsage();
  const remaining = Math.max(0, current.remainingCredits - 1);
  const used = current.usedCredits + 1;
  const updated: AIUsage = {
    ...current,
    remainingCredits: remaining,
    usedCredits: used,
    tryOnsToday: current.tryOnsToday + 1,
  };
  saveAIUsage(updated);
  return updated;
}

export function topUpAICredits(amount: number = 50): AIUsage {
  const current = loadAIUsage();
  const updated: AIUsage = {
    ...current,
    totalCredits: current.totalCredits + amount,
    remainingCredits: current.remainingCredits + amount,
  };
  saveAIUsage(updated);
  return updated;
}

export function isOnboardingCompleted(): boolean {
  return localStorage.getItem(KEYS.ONBOARDING_COMPLETED) === 'true';
}

export function setOnboardingCompleted(completed: boolean): void {
  localStorage.setItem(KEYS.ONBOARDING_COMPLETED, completed ? 'true' : 'false');
}

export function resetToDemoData() {
  localStorage.setItem(KEYS.GARMENTS, JSON.stringify(INITIAL_GARMENTS));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
  localStorage.setItem(KEYS.TRYONS, JSON.stringify(INITIAL_TRYONS));
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
  localStorage.setItem(KEYS.USAGE, JSON.stringify(DEFAULT_USAGE));
  localStorage.setItem(KEYS.ONBOARDING_COMPLETED, 'true');

  return {
    garments: INITIAL_GARMENTS,
    customers: INITIAL_CUSTOMERS,
    tryOns: INITIAL_TRYONS,
    settings: INITIAL_SETTINGS,
    usage: DEFAULT_USAGE,
  };
}

export function clearAllCustomerPhotos(): void {
  const current = loadCustomers();
  const updated = current.map(c => ({
    ...c,
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  }));
  saveCustomers(updated);
}
