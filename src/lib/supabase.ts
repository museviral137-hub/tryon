import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Normalizes the Supabase Project URL to its base origin (https://<project-ref>.supabase.co).
 * Strips any accidental /rest/v1, /auth/v1, /v1, quotes, subpaths, or trailing slashes.
 */
function normalizeSupabaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^["']|["']$/g, '').trim();
  if (!url) return '';

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.supabase.co')) {
      url = `https://${url}`;
    } else if (/^[a-z0-9-]+$/i.test(url)) {
      url = `https://${url}.supabase.co`;
    } else {
      url = `https://${url}`;
    }
  }

  try {
    const parsed = new URL(url);
    // Keep strictly the origin (protocol + hostname + port if any)
    // Example: "https://icitrokvcadoctqkrigu.supabase.co/rest/v1" -> "https://icitrokvcadoctqkrigu.supabase.co"
    return parsed.origin;
  } catch {
    return url
      .replace(/\/+(rest|auth|graphql|storage|functions)\/v[0-9]+.*$/i, '')
      .replace(/\/+$/, '');
  }
}

/**
 * Normalizes the Supabase Publishable Key, stripping surrounding quotes or whitespace.
 */
function normalizeSupabaseKey(rawKey: string | undefined): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']|["']$/g, '').trim();
}

export const supabaseUrl: string = normalizeSupabaseUrl(
  import.meta.env.VITE_SUPABASE_URL || 'https://icitrokvcadoctqkrigu.supabase.co'
);

export const supabasePublishableKey: string = normalizeSupabaseKey(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_KEY
);

/**
 * Returns true if a valid Supabase publishable API key is configured.
 * Accepts modern sb_publishable_... keys as well as standard public keys.
 */
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabasePublishableKey) return false;
  const key = supabasePublishableKey.toLowerCase();
  if (
    key === 'undefined' ||
    key === 'null' ||
    key.startsWith('your_') ||
    key.startsWith('your-') ||
    key.startsWith('placeholder') ||
    key.length < 15
  ) {
    return false;
  }
  return true;
};

/**
 * Safe diagnostics report (never logs or exposes actual keys).
 */
export const getSupabaseDiagnostics = () => {
  return {
    supabaseUrlConfigured: Boolean(supabaseUrl),
    supabasePublishableKeyConfigured: Boolean(supabasePublishableKey),
    publishableKeyFormatValid: isSupabaseConfigured(),
  };
};

// Singleton browser Supabase client using the normalized origin URL
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://icitrokvcadoctqkrigu.supabase.co',
  supabasePublishableKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'vestiai-supabase-auth-token',
    },
  }
);
