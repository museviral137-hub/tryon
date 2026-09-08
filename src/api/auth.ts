import { User } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  email: string;
  password: string;
  shopName: string;
  ownerName: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  needsEmailVerification?: boolean;
  isUnverified?: boolean;
  email?: string;
}

let inMemoryCurrentUser: User | null = null;

function formatSupabaseAuthError(error: any): string {
  if (!error) return 'An unexpected authentication error occurred.';
  const msg = typeof error === 'string' ? error : error.message || String(error);
  const lower = msg.toLowerCase();

  if (lower.includes('invalid path specified') || lower.includes('invalid path')) {
    return 'Invalid Supabase request path. Please verify that VITE_SUPABASE_URL is the root project URL (https://icitrokvcadoctqkrigu.supabase.co).';
  }
  if (lower.includes('invalid api key') || lower.includes('apikey') || lower.includes('invalid api-key')) {
    return 'Supabase authentication is not configured correctly. Please check that VITE_SUPABASE_PUBLISHABLE_KEY is configured in project settings.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Invalid email or password. Please verify your credentials or register a new account.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email verification is required. Please enter the verification code sent to your email address.';
  }
  if (lower.includes('token has expired') || lower.includes('expired')) {
    return 'The verification code has expired. Please click "Resend code" to get a new one.';
  }
  if (lower.includes('invalid token') || lower.includes('token is invalid') || lower.includes('token not found') || lower.includes('otp')) {
    return 'Invalid verification code. Please check the code in your email and try again.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'An account with this email address already exists. Please sign in instead.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || lower.includes('too many requests')) {
    return 'Too many requests. Please wait a moment before requesting another verification code.';
  }
  return msg;
}

export const authApi = {
  /**
   * Get active cached User in memory
   */
  getCachedUser(): User | null {
    return inMemoryCurrentUser;
  },

  /**
   * Get active shop ID for authenticated database operations strictly from shop_members
   */
  async getActiveShopId(): Promise<string | undefined> {
    if (!isSupabaseConfigured()) {
      return undefined;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return undefined;

      const { data: member } = await supabase
        .from('shop_members')
        .select('shop_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (member?.shop_id) {
        if (inMemoryCurrentUser) {
          inMemoryCurrentUser.shopId = member.shop_id;
        }
        return member.shop_id;
      }

      // If no membership record exists yet for this authenticated user, provision via secure server RPC
      try {
        const shopName = session.user.user_metadata?.shop_name || 'VestiAI Boutique';
        const ownerName = session.user.user_metadata?.full_name || session.user.user_metadata?.owner_name || 'Shop Owner';

        const { data: ensuredShopId, error: rpcErr } = await supabase.rpc('ensure_user_shop', {
          p_shop_name: shopName,
          p_owner_name: ownerName,
        });

        if (!rpcErr && ensuredShopId) {
          if (inMemoryCurrentUser) {
            inMemoryCurrentUser.shopId = ensuredShopId;
          }
          return ensuredShopId;
        }
      } catch (provisionErr) {
        console.warn('[AuthApi] ensure_user_shop RPC notice:', provisionErr);
      }

      return undefined;
    } catch {
      return undefined;
    }
  },

  /**
   * Get currently authenticated session user from Supabase Auth
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      inMemoryCurrentUser = null;
      return null;
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user) {
        inMemoryCurrentUser = null;
        return null;
      }

      // Fetch shop association strictly from PostgreSQL shop_members
      try {
        const { data: member } = await supabase
          .from('shop_members')
          .select('shop_id, name, role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        let resolvedShopId = member?.shop_id;
        if (!resolvedShopId) {
          resolvedShopId = await this.getActiveShopId();
        }

        const user: User = {
          id: session.user.id,
          email: session.user.email || '',
          name:
            member?.name ||
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.owner_name ||
            session.user.email?.split('@')[0] ||
            'Shop Owner',
          role: (member?.role as 'owner' | 'admin' | 'staff') || 'owner',
          shopId: resolvedShopId || '',
        };

        inMemoryCurrentUser = user;
        return user;
      } catch {
        const resolvedShopId = await this.getActiveShopId();
        const fallbackUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.owner_name ||
            session.user.email?.split('@')[0] ||
            'Shop Owner',
          role: 'owner',
          shopId: resolvedShopId || '',
        };
        inMemoryCurrentUser = fallbackUser;
        return fallbackUser;
      }
    } catch (err) {
      console.warn('[Supabase Auth] Session verification notice:', err);
      inMemoryCurrentUser = null;
      return null;
    }
  },

  /**
   * Real Supabase Sign-in with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const email = credentials.email.trim();
    const password = credentials.password || '';

    if (!email) {
      return { success: false, message: 'Please enter your boutique email address' };
    }
    if (!password) {
      return { success: false, message: 'Please enter your password' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase authentication is not configured correctly. Please configure VITE_SUPABASE_PUBLISHABLE_KEY in project settings.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.warn('[Supabase Auth] signInWithPassword notice:', {
          message: error.message,
          status: error.status,
        });

        const isUnconfirmed = error.message?.toLowerCase().includes('email not confirmed');
        if (isUnconfirmed) {
          return {
            success: false,
            isUnverified: true,
            email,
            message: 'Email verification is required before signing in. A verification code has been sent to your email.',
          };
        }

        return { success: false, message: formatSupabaseAuthError(error) };
      }

      if (!data.user) {
        return { success: false, message: 'No user account found with these credentials' };
      }

      try {
        const { data: member } = await supabase
          .from('shop_members')
          .select('shop_id, name, role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: member?.name || data.user.user_metadata?.full_name || data.user.user_metadata?.owner_name || email.split('@')[0] || 'Shop Owner',
          role: (member?.role as 'owner' | 'admin' | 'staff') || 'owner',
          shopId: member?.shop_id || data.user.id,
        };

        inMemoryCurrentUser = user;
        return { success: true, user, message: 'Signed in successfully' };
      } catch {
        const user: User = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.owner_name || email.split('@')[0] || 'Shop Owner',
          role: 'owner',
          shopId: data.user.id,
        };
        inMemoryCurrentUser = user;
        return { success: true, user, message: 'Signed in successfully' };
      }
    } catch (err: any) {
      console.warn('[Supabase Auth] Sign in notice:', err);
      const isUnconfirmed = err?.message?.toLowerCase?.()?.includes('email not confirmed');
      if (isUnconfirmed) {
        return {
          success: false,
          isUnverified: true,
          email,
          message: 'Email verification is required before signing in. A verification code has been sent to your email.',
        };
      }
      return { success: false, message: formatSupabaseAuthError(err) };
    }
  },

  /**
   * Real Supabase Registration with options.data metadata
   */
  async signup(credentials: SignupCredentials): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase authentication is not configured correctly. Please configure VITE_SUPABASE_PUBLISHABLE_KEY in project settings.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email.trim(),
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.ownerName.trim(),
            shop_name: credentials.shopName.trim(),
            owner_name: credentials.ownerName.trim(),
            phone: credentials.phone.trim(),
          },
        },
      });

      if (error) {
        console.warn('[Supabase Auth] supabase.auth.signUp notice:', {
          message: error.message,
          status: error.status,
        });
        return { success: false, message: formatSupabaseAuthError(error) };
      }

      if (data.user) {
        if (data.session) {
          // Direct login when email confirmation is disabled in Supabase project
          try {
            const { data: member } = await supabase
              .from('shop_members')
              .select('shop_id, name, role')
              .eq('user_id', data.user.id)
              .maybeSingle();

            const user: User = {
              id: data.user.id,
              email: data.user.email || credentials.email,
              name: member?.name || credentials.ownerName.trim(),
              role: (member?.role as 'owner' | 'admin' | 'staff') || 'owner',
              shopId: member?.shop_id || data.user.id,
            };
            inMemoryCurrentUser = user;
            return { success: true, user, message: 'Shop account registered successfully' };
          } catch {
            const user: User = {
              id: data.user.id,
              email: data.user.email || credentials.email,
              name: credentials.ownerName.trim(),
              role: 'owner',
              shopId: data.user.id,
            };
            inMemoryCurrentUser = user;
            return { success: true, user, message: 'Shop account registered successfully' };
          }
        } else {
          // User created in Supabase Authentication -> Users table, awaiting numeric email OTP verification
          return {
            success: true,
            needsEmailVerification: true,
            email: credentials.email.trim(),
            message: 'Verification code sent to your email. Please enter the numeric code to verify your account.',
          };
        }
      }

      return { success: false, message: 'Sign up failed - no user returned from Supabase.' };
    } catch (err: any) {
      console.warn('[Supabase Auth] Uncaught signup notice:', err);
      return { success: false, message: formatSupabaseAuthError(err) };
    }
  },

  /**
   * Verify Email Signup with Supabase numeric OTP code
   */
  async verifyEmailOtp(email: string, token: string): Promise<AuthResponse> {
    const cleanEmail = email.trim();
    const cleanToken = token.trim();

    if (!cleanEmail) {
      return { success: false, message: 'Please provide the registered boutique email address.' };
    }
    if (!cleanToken) {
      return { success: false, message: 'Please enter the verification code sent to your email.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase authentication is not configured correctly. Please configure VITE_SUPABASE_PUBLISHABLE_KEY.',
      };
    }

    try {
      // 1. Primary verification attempt with type: 'signup'
      let { data, error } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'signup',
      });

      // 2. Fallback attempt with type: 'email' if token was generated as generic email token
      if (error && (error.message?.toLowerCase().includes('type') || error.message?.toLowerCase().includes('invalid token'))) {
        const fallbackRes = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        });
        if (!fallbackRes.error && fallbackRes.data?.user) {
          data = fallbackRes.data;
          error = null;
        }
      }

      if (error) {
        console.warn('[Supabase Auth] verifyOtp error notice:', error);
        return { success: false, message: formatSupabaseAuthError(error) };
      }

      if (!data?.user) {
        return { success: false, message: 'Verification was not completed. Please try again.' };
      }

      // Fetch or build the authorized user profile
      try {
        const { data: member } = await supabase
          .from('shop_members')
          .select('shop_id, name, role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const user: User = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: member?.name || data.user.user_metadata?.full_name || data.user.user_metadata?.owner_name || cleanEmail.split('@')[0] || 'Shop Owner',
          role: (member?.role as 'owner' | 'admin' | 'staff') || 'owner',
          shopId: member?.shop_id || data.user.id,
        };

        inMemoryCurrentUser = user;
        return { success: true, user, message: 'Email verified successfully!' };
      } catch {
        const user: User = {
          id: data.user.id,
          email: data.user.email || cleanEmail,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.owner_name || cleanEmail.split('@')[0] || 'Shop Owner',
          role: 'owner',
          shopId: data.user.id,
        };
        inMemoryCurrentUser = user;
        return { success: true, user, message: 'Email verified successfully!' };
      }
    } catch (err: any) {
      console.warn('[Supabase Auth] verifyOtp exception notice:', err);
      return { success: false, message: formatSupabaseAuthError(err) };
    }
  },

  /**
   * Resend Verification OTP code via Supabase Auth
   */
  async resendVerificationOtp(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, message: 'Please provide your registered email address.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        message: 'Supabase authentication is not configured correctly.',
      };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
      });

      if (error) {
        console.warn('[Supabase Auth] resend verification notice:', error);
        return { success: false, message: formatSupabaseAuthError(error) };
      }

      return {
        success: true,
        message: `A new verification code has been sent to ${cleanEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      console.warn('[Supabase Auth] resend exception notice:', err);
      return { success: false, message: formatSupabaseAuthError(err) };
    }
  },

  /**
   * Sign out and clear session state from Supabase
   */
  async logout(): Promise<void> {
    inMemoryCurrentUser = null;
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Supabase Auth] Signout notice:', err);
      }
    }
  },

  /**
   * Password reset via Supabase Auth
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      return { success: false, message: 'Please enter your registered email' };
    }

    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase authentication is not configured correctly.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        console.warn('[Supabase Auth] resetPasswordForEmail notice:', error);
        return { success: false, message: formatSupabaseAuthError(error) };
      }

      return {
        success: true,
        message: `Password reset link sent to ${cleanEmail}. Check your inbox.`,
      };
    } catch (err: any) {
      console.warn('[Supabase Auth] Password reset notice:', err);
      return { success: false, message: formatSupabaseAuthError(err) };
    }
  },

  /**
   * Listen to auth state changes from Supabase
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    if (isSupabaseConfigured()) {
      return supabase.auth.onAuthStateChange(callback);
    }
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
};
