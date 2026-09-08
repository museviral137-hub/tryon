import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Store,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  Shirt,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { User, LegalTab, NavTab } from '../../types';
import { authApi, SignupCredentials } from '../../api/auth';
import { LegalNavModal } from '../legal/LegalNavModal';
import { ConsentCheckbox } from '../legal/ConsentCheckbox';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'info' | 'error') => void;
  onOpenLegal?: (tab: NavTab) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-otp';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onShowToast, onOpenLegal }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Legal Consent Checkbox States
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalTab | null>(null);

  // OTP Verification Fields
  const [verificationEmail, setVerificationEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [signupSuccessMessage, setSignupSuccessMessage] = useState<string | null>(null);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const resetFormState = () => {
    setError(null);
    setResetSent(false);
    setSignupSuccessMessage(null);
    setOtpInfoMessage(null);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    resetFormState();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your shop email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({
        email: trimmedEmail,
        password,
      });

      if (res.success && res.user) {
        if (onShowToast) {
          onShowToast('Signed In Successfully', `Welcome to ${res.user.name}'s trial room!`, 'success');
        }
        onAuthSuccess(res.user);
      } else if (res.isUnverified) {
        // User account exists but email is unverified -> switch to OTP verification screen
        setVerificationEmail(trimmedEmail);
        setOtp('');
        setMode('verify-otp');
        setResendCooldown(60);
        setOtpInfoMessage('Email verification is required. We have sent a verification code to your email.');
        if (onShowToast) {
          onShowToast('Email Verification Required', `Verification code sent to ${trimmedEmail}`, 'info');
        }
        // Send fresh OTP code
        authApi.resendVerificationOtp(trimmedEmail).catch(() => {});
      } else {
        setError(res.message || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!ownerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!shopName.trim()) {
      setError('Please enter your shop or boutique name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setConsentError(true);
      setError('Please agree to both the Terms & Conditions and Privacy Policy to create a boutique account.');
      return;
    }

    setConsentError(false);
    setIsLoading(true);
    try {
      const credentials: SignupCredentials = {
        email: email.trim(),
        password,
        ownerName: ownerName.trim(),
        shopName: shopName.trim(),
        phone: phone.trim() || '+91 98765 43210',
      };

      const res = await authApi.signup(credentials);
      if (res.success && res.user) {
        if (onShowToast) {
          onShowToast('Shop Account Created!', `Welcome to VestiAI, ${shopName}!`, 'success');
        }
        onAuthSuccess(res.user);
      } else if (res.needsEmailVerification || (res.success && !res.user)) {
        // Switch to OTP verification screen
        setVerificationEmail(email.trim());
        setOtp('');
        setMode('verify-otp');
        setResendCooldown(60);
        setOtpInfoMessage(`A numeric verification code has been sent to ${email.trim()}.`);
        if (onShowToast) {
          onShowToast('Verification Code Sent', `Enter the code sent to ${email.trim()}`, 'info');
        }
      } else {
        setError(res.message || 'Registration failed. This email may already be registered.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create shop account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setError('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.verifyEmailOtp(verificationEmail, cleanOtp);
      if (res.success && res.user) {
        if (onShowToast) {
          onShowToast('Email Verified!', `Welcome to VestiAI, ${res.user.name}!`, 'success');
        }
        onAuthSuccess(res.user);
      } else {
        setError(res.message || 'Invalid verification code. Please check your email and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Verification service error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending || !verificationEmail) return;
    setError(null);
    setIsResending(true);

    try {
      const res = await authApi.resendVerificationOtp(verificationEmail);
      if (res.success) {
        setResendCooldown(60);
        setOtpInfoMessage(res.message || `A new verification code has been sent to ${verificationEmail}.`);
        if (onShowToast) {
          onShowToast('Code Resent', `Check ${verificationEmail} for your new verification code.`, 'success');
        }
      } else {
        setError(res.message || 'Failed to resend verification code. Please wait a moment.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChangeEmail = () => {
    resetFormState();
    setOtp('');
    setMode('signup');
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your registered boutique email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.requestPasswordReset(email);
      if (res.success) {
        setResetSent(true);
      } else {
        setError(res.message || 'Unable to send password reset link');
      }
    } catch (err: any) {
      setError(err?.message || 'Password reset request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 antialiased selection:bg-emerald-500 selection:text-white">
      <div className="max-w-4xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Boutique Branding & Features (hidden or stacked on mobile) */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span>VestiAI Shop Edition</span>
          </div>

          <div>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-neutral-900 tracking-tight leading-tight">
              AI Virtual Trial Room for <span className="text-emerald-600">Your Shop</span>
            </h1>
            <p className="text-sm text-neutral-600 mt-2.5 leading-relaxed">
              Help your customers virtually try on Sarees, Kurtas, Dresses, and Outfits in seconds. Save garments once with Smart Product IDs.
            </p>
          </div>

          {/* Value Props */}
          <div className="hidden lg:grid gap-3.5 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-neutral-200/80 shadow-2xs backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Shirt className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-neutral-900">One-Time Garment Catalog</h4>
                <p className="text-[11px] text-neutral-500">Assign Product IDs (J001, S102) once. Never re-upload photos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-neutral-200/80 shadow-2xs backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-neutral-900">Instant AI Try-On</h4>
                <p className="text-[11px] text-neutral-500">Fit any outfit to a customer's single photo in under 10 seconds.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-neutral-200/80 shadow-2xs backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-neutral-900">1-Click WhatsApp Sharing</h4>
                <p className="text-[11px] text-neutral-500">Send high-definition try-on previews with custom shop branding.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/70 border border-neutral-200/80 shadow-2xs backdrop-blur-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-bold text-neutral-900">Multi-Tenant Shop Isolation</h4>
                <p className="text-[11px] text-neutral-500">Your boutique catalog and customer data remain 100% private.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-neutral-200/80 relative overflow-hidden">
            
            {/* Top decorative accent */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

            {/* View Switcher Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  {mode === 'verify-otp' ? <ShieldCheck className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-lg text-neutral-900 leading-tight">
                    {mode === 'login' && 'Shop Staff Sign In'}
                    {mode === 'signup' && 'Create Boutique Account'}
                    {mode === 'forgot-password' && 'Reset Shop Password'}
                    {mode === 'verify-otp' && 'Verify Boutique Email'}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {mode === 'login' && 'Access your boutique trial room & catalog'}
                    {mode === 'signup' && 'Start offering virtual try-ons to customers'}
                    {mode === 'forgot-password' && 'Enter your email to receive recovery instructions'}
                    {mode === 'verify-otp' && 'Enter the verification code sent to your email'}
                  </p>
                </div>
              </div>

              {/* Mode Toggle Pills */}
              {mode !== 'forgot-password' && mode !== 'verify-otp' && (
                <div className="flex p-1 bg-neutral-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === 'login'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      mode === 'signup'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}
            </div>

            {/* Error Banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 mb-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}

            {/* Signup Success Banner (if email verification required) */}
            {signupSuccessMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 mb-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium space-y-2"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Registration Initiated</span>
                </div>
                <p>{signupSuccessMessage}</p>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="mt-2 text-xs font-bold text-emerald-700 underline"
                >
                  Go to Sign In
                </button>
              </motion.div>
            )}

            {/* ======================================================== */}
            {/* 1. LOGIN FORM */}
            {/* ======================================================== */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Shop Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="owner@boutique.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-neutral-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot-password')}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="auth-submit-login-btn"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Boutique</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 text-xs text-neutral-500">
                  <span>Don't have a boutique account yet? </span>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('signup')}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Register your shop now
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* 2. SIGN UP FORM */}
            {/* ======================================================== */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Owner / Manager Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Vikram Mehta"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Boutique / Shop Name *
                    </label>
                    <div className="relative">
                      <Store className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Shree Fashion Boutique"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Shop Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="owner@boutique.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Phone / WhatsApp Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Password (min 6 chars) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-800 mb-1">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password match indicator */}
                {password && confirmPassword && (
                  <div className="text-[11px] font-semibold flex items-center gap-1.5">
                    {password === confirmPassword ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Includes free AI Trial Room credits upon boutique registration.</span>
                </div>

                {/* Mandatory Legal & Privacy Consents */}
                <div className={`p-3.5 rounded-2xl border space-y-2.5 transition-all ${
                  consentError && (!agreeTerms || !agreePrivacy)
                    ? 'bg-rose-50/60 border-rose-300'
                    : 'bg-neutral-50/80 border-neutral-200/90'
                }`}>
                  <ConsentCheckbox
                    id="auth-agree-terms"
                    checked={agreeTerms}
                    onChange={(checked) => {
                      setAgreeTerms(checked);
                      if (checked && agreePrivacy) setConsentError(false);
                    }}
                    required
                    error={consentError && !agreeTerms}
                    label={
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onOpenLegal) onOpenLegal('terms');
                            else setActiveLegalModal('terms');
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-800 underline inline"
                        >
                          Terms & Conditions
                        </button>
                      </span>
                    }
                  />

                  <ConsentCheckbox
                    id="auth-agree-privacy"
                    checked={agreePrivacy}
                    onChange={(checked) => {
                      setAgreePrivacy(checked);
                      if (checked && agreeTerms) setConsentError(false);
                    }}
                    required
                    error={consentError && !agreePrivacy}
                    label={
                      <span>
                        I have read and accept the{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (onOpenLegal) onOpenLegal('privacy');
                            else setActiveLegalModal('privacy');
                          }}
                          className="font-bold text-emerald-700 hover:text-emerald-800 underline inline"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    }
                  />

                  <p className="text-[10px] text-neutral-500 pt-0.5 leading-tight">
                    By registering, you also acknowledge the{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        if (onOpenLegal) onOpenLegal('ai-disclaimer');
                        else setActiveLegalModal('ai-disclaimer');
                      }}
                      className="text-neutral-700 underline font-medium"
                    >
                      AI Try-On Disclaimer
                    </button>{' '}
                    and customer photo guidelines.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !agreeTerms || !agreePrivacy}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating boutique trial room...</span>
                    </div>
                  ) : (
                    <>
                      <span>Create Boutique Trial Room</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 text-xs text-neutral-500">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Sign in here
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* 3. FORGOT PASSWORD FORM */}
            {/* ======================================================== */}
            {mode === 'forgot-password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-emerald-950">Password Reset Link Sent</h3>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      We have sent password reset instructions to <b>{email}</b>. Please check your inbox and spam folder.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('login')}
                      className="mt-3 inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition-all"
                    >
                      Back to Sign In
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                        Registered Shop Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="owner@boutique.com"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium outline-hidden transition-all shadow-2xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending recovery link...</span>
                        </div>
                      ) : (
                        <span>Send Password Reset Link</span>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('login')}
                        className="text-xs font-bold text-neutral-600 hover:text-neutral-900"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}

            {/* ======================================================== */}
            {/* 4. VERIFY OTP FORM */}
            {/* ======================================================== */}
            {mode === 'verify-otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {/* Info / instructions card */}
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <Mail className="w-4 h-4 text-emerald-600" />
                      Verification Code Sent
                    </span>
                    <button
                      type="button"
                      onClick={handleChangeEmail}
                      className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                    {otpInfoMessage || 'We have sent a numeric verification code to:'}
                  </p>
                  <div className="inline-block px-2.5 py-1 bg-white/90 rounded-lg border border-emerald-200/80 font-mono font-bold text-emerald-950 text-xs">
                    {verificationEmail || email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.trim())}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border-2 border-neutral-200 focus:border-emerald-500 rounded-xl text-center text-lg font-mono font-bold tracking-widest text-neutral-900 outline-hidden transition-all shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 text-center">
                    Check your email inbox or spam folder for the code from Supabase
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !otp.trim()}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying code...</span>
                    </div>
                  ) : (
                    <>
                      <span>Verify & Continue to Trial Room</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Resend OTP & switch controls */}
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || isResending}
                    className="font-bold text-emerald-700 hover:text-emerald-800 disabled:text-neutral-400 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    {isResending ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resending...
                      </span>
                    ) : resendCooldown > 0 ? (
                      <span>Resend code in {resendCooldown}s</span>
                    ) : (
                      <span>Resend verification code</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMode('login')}
                    className="font-bold text-neutral-500 hover:text-neutral-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>

        {/* Footer Legal & Support Links */}
        <div className="text-center pt-2 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            <button
              type="button"
              onClick={() => {
                if (onOpenLegal) onOpenLegal('terms');
                else setActiveLegalModal('terms');
              }}
              className="hover:text-neutral-800 hover:underline"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenLegal) onOpenLegal('privacy');
                else setActiveLegalModal('privacy');
              }}
              className="hover:text-neutral-800 hover:underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenLegal) onOpenLegal('refund-policy');
                else setActiveLegalModal('refund-policy');
              }}
              className="hover:text-neutral-800 hover:underline"
            >
              Refund Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenLegal) onOpenLegal('ai-disclaimer');
                else setActiveLegalModal('ai-disclaimer');
              }}
              className="hover:text-neutral-800 hover:underline"
            >
              AI Disclaimer
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenLegal) onOpenLegal('contact-support');
                else setActiveLegalModal('contact-support');
              }}
              className="hover:text-neutral-800 hover:underline font-medium text-emerald-700"
            >
              Support
            </button>
          </div>
        </div>

      </div>

      {/* In-Screen Legal Modal Viewer */}
      {activeLegalModal && (
        <LegalNavModal
          isOpen={Boolean(activeLegalModal)}
          initialTab={activeLegalModal}
          onClose={() => setActiveLegalModal(null)}
        />
      )}
    </div>
  );
};
