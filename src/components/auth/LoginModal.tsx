import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  User as UserIcon,
  Phone,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { User, LegalTab } from '../../types';
import { authApi, SignupCredentials } from '../../api/auth';
import { ConsentCheckbox } from '../legal/ConsentCheckbox';
import { LegalNavModal } from '../legal/LegalNavModal';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess?: (user: User) => void;
  onSuccess?: (user: User) => void;
  onClose?: () => void;
  allowClose?: boolean;
}

type ModalAuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-otp';

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  onSuccess,
  onClose,
  allowClose = false,
}) => {
  const [mode, setMode] = useState<ModalAuthMode>('login');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Consent states
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

  // Statuses
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);

  // Countdown timer for OTP resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleModeChange = (newMode: ModalAuthMode) => {
    setError(null);
    setResetSent(false);
    setSignupSuccessMsg(null);
    setOtpInfoMessage(null);
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanEmail = email.trim();
      const res = await authApi.login({ email: cleanEmail, password });
      if (res.success && res.user) {
        if (onSuccess) onSuccess(res.user);
        if (onLoginSuccess) onLoginSuccess(res.user);
        if (onClose) onClose();
      } else if (res.isUnverified) {
        setVerificationEmail(cleanEmail);
        setOtp('');
        setMode('verify-otp');
        setResendCooldown(60);
        setOtpInfoMessage('Email verification is required. We have sent a verification code to your email.');
        authApi.resendVerificationOtp(cleanEmail).catch(() => {});
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ownerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!shopName.trim()) {
      setError('Please enter your boutique/shop name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeTerms || !agreePrivacy) {
      setConsentError(true);
      setError('Please agree to both Terms & Conditions and Privacy Policy.');
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
        if (onSuccess) onSuccess(res.user);
        if (onLoginSuccess) onLoginSuccess(res.user);
        if (onClose) onClose();
      } else if (res.needsEmailVerification || (res.success && !res.user)) {
        setVerificationEmail(email.trim());
        setOtp('');
        setMode('verify-otp');
        setResendCooldown(60);
        setOtpInfoMessage(`A numeric verification code has been sent to ${email.trim()}.`);
      } else {
        setError(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
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
        if (onSuccess) onSuccess(res.user);
        if (onLoginSuccess) onLoginSuccess(res.user);
        if (onClose) onClose();
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
      } else {
        setError(res.message || 'Failed to resend verification code. Please wait a moment.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter your shop email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.requestPasswordReset(email.trim());
      if (res.success) {
        setResetSent(true);
      } else {
        setError(res.message || 'Failed to send reset link.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
          onClick={allowClose && onClose ? onClose : undefined}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {allowClose && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Brand Header */}
          <div className="text-center mb-5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-emerald-600/20">
              <Store className="w-5 h-5" />
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold mb-1 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Boutique & Retail Portal</span>
            </div>
            <h2 className="font-display font-black text-xl text-neutral-900">
              {mode === 'login' && 'Shop Staff Login'}
              {mode === 'signup' && 'Register Boutique Account'}
              {mode === 'forgot-password' && 'Reset Shop Password'}
              {mode === 'verify-otp' && 'Verify Boutique Email'}
            </h2>
            <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
              {mode === 'login' && 'Sign in to access your saved garments, customers, and AI trial room.'}
              {mode === 'signup' && 'Create your boutique account with 100 free AI try-on credits.'}
              {mode === 'forgot-password' && 'Enter your registered shop email to receive a recovery link.'}
              {mode === 'verify-otp' && 'Enter the verification code sent to your registered email.'}
            </p>
          </div>

          {/* Error Message Banner */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Signup Success Banner */}
          {signupSuccessMsg && (
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Account Created!</span>
              </div>
              <p>{signupSuccessMsg}</p>
            </div>
          )}

          {/* 1. LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Shop Email / Staff ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="demo@vestiai.shop"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-neutral-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot-password')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline"
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
                    className="w-full pl-10 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden transition-all"
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
                id="modal-submit-login-btn"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <span>Enter Shop Trial Room</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1 text-xs text-neutral-500">
                <span>New boutique? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('signup')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Create shop account
                </button>
              </div>
            </form>
          )}

          {/* 2. SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3">
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
                    placeholder="Vikram Mehta"
                    className="w-full pl-10 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
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
                    placeholder="Shree Fashion Boutique"
                    className="w-full pl-10 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Shop Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@boutique.com"
                    className="w-full pl-10 pr-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Confirm *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Consent Checkboxes */}
              <div className={`p-3 rounded-xl border space-y-2 text-xs transition-all ${
                consentError && (!agreeTerms || !agreePrivacy)
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-neutral-50 border-neutral-200'
              }`}>
                <ConsentCheckbox
                  id="modal-agree-terms"
                  checked={agreeTerms}
                  onChange={(checked) => {
                    setAgreeTerms(checked);
                    if (checked && agreePrivacy) setConsentError(false);
                  }}
                  required
                  error={consentError && !agreeTerms}
                  label={
                    <span>
                      I agree to{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveLegalModal('terms');
                        }}
                        className="font-bold text-emerald-700 underline"
                      >
                        Terms & Conditions
                      </button>
                    </span>
                  }
                />

                <ConsentCheckbox
                  id="modal-agree-privacy"
                  checked={agreePrivacy}
                  onChange={(checked) => {
                    setAgreePrivacy(checked);
                    if (checked && agreeTerms) setConsentError(false);
                  }}
                  required
                  error={consentError && !agreePrivacy}
                  label={
                    <span>
                      I agree to{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveLegalModal('privacy');
                        }}
                        className="font-bold text-emerald-700 underline"
                      >
                        Privacy Policy
                      </button>
                    </span>
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !agreeTerms || !agreePrivacy}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </div>
                ) : (
                  <>
                    <span>Create Shop Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1 text-xs text-neutral-500">
                <span>Already registered? </span>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="font-bold text-emerald-700 hover:underline"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD */}
          {mode === 'forgot-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetSent ? (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-emerald-900">Reset Email Sent</h4>
                  <p className="text-[11px] text-emerald-700">
                    We sent password recovery instructions to <b>{email}</b>.
                  </p>
                </div>
              ) : (
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
                      className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {!resetSent && (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-60"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs transition-all"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {/* 4. VERIFY OTP */}
          {mode === 'verify-otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center justify-between font-bold text-emerald-800">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" /> Code Sent
                  </span>
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Edit Email
                  </button>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-snug">
                  {otpInfoMessage || 'Verification code sent to:'}
                </p>
                <div className="font-mono font-bold text-emerald-950 text-xs bg-white/80 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                  {verificationEmail || email}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Verification Code
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
                    className="w-full pl-10 pr-3.5 py-2.5 bg-neutral-50 border-2 border-neutral-200 focus:border-emerald-500 rounded-xl text-center text-base font-mono font-bold tracking-widest text-neutral-900 outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !otp.trim()}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </div>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-xs">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isResending}
                  className="font-bold text-emerald-700 hover:underline disabled:text-neutral-400 disabled:no-underline"
                >
                  {isResending
                    ? 'Resending...'
                    : resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('login')}
                  className="font-bold text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* In-Modal Legal Document Viewer */}
      {activeLegalModal && (
        <LegalNavModal
          isOpen={Boolean(activeLegalModal)}
          initialTab={activeLegalModal}
          onClose={() => setActiveLegalModal(null)}
        />
      )}
    </AnimatePresence>
  );
};
