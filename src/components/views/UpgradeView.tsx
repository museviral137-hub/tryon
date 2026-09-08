import React, { useState } from 'react';
import { AIUsage, ShopSettings, NavTab, User } from '../../types';
import { AI_CREDIT_PACKAGES, PAYMENT_FAQ } from '../../constants/pricing';
import { paymentService } from '../../services/paymentService';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  History,
  Lock,
  ArrowRight,
  Loader2,
  Coins,
} from 'lucide-react';

interface UpgradeViewProps {
  settings: ShopSettings;
  aiUsage: AIUsage | null;
  currentUser: User | null;
  onNavigate: (tab: NavTab) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onRefreshUsage: () => Promise<void>;
  onOrderCreated?: (orderId: string) => void;
  onPaymentSuccess?: (orderId: string, creditsAdded: number) => void;
  onPaymentFailed?: (orderId: string, reason: string) => void;
}

export const UpgradeView: React.FC<UpgradeViewProps> = ({
  settings,
  aiUsage,
  currentUser,
  onNavigate,
  onShowToast,
  onRefreshUsage,
  onOrderCreated,
  onPaymentSuccess,
  onPaymentFailed,
}) => {
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const remainingCredits = aiUsage?.remainingCredits ?? 0;

  const handleBuyPackage = async (packageId: string) => {
    try {
      setLoadingPackageId(packageId);

      const res = await paymentService.startCheckout({
        packageId,
        shopName: settings?.shopName || 'Boutique',
        userEmail: currentUser?.email || '',
        userPhone: settings?.phone || '',
        onSuccess: async (result) => {
          await onRefreshUsage();
          if (result.order?.id) {
            onPaymentSuccess?.(result.order.id, result.creditsAdded || 0);
          }
          onNavigate('payment-success');
        },
        onFailure: (errorMsg, orderId) => {
          if (orderId) {
            onPaymentFailed?.(orderId, errorMsg);
          }
          onShowToast('Payment Incomplete', errorMsg, 'error');
          onNavigate('payment-failed');
        },
        onPending: (orderId) => {
          onOrderCreated?.(orderId);
          onNavigate('payment-pending');
        },
        onDismiss: () => {
          setLoadingPackageId(null);
          onShowToast('Payment Cancelled', 'You closed the checkout window.', 'info');
        },
      });

      if (res.action === 'pending') {
        onOrderCreated?.(res.orderId);
        onNavigate('payment-pending');
      }
    } catch (err: any) {
      console.error('[UpgradeView] Checkout error:', err);
      onShowToast('Checkout Failed', err.message || 'Unable to start checkout', 'error');
    } finally {
      setLoadingPackageId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Virtual Try-On Power-Up</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 tracking-tight">
            Upgrade AI Credits
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Power more virtual try-ons for your boutique. Credits never expire and include HD Indian drape synthesis.
          </p>
        </div>

        {/* Current Balance Widget */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-4 sm:p-5 border border-neutral-800 shadow-md flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
            <Coins className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-neutral-400 font-semibold block uppercase tracking-wider">
              Current AI Credits
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-display font-black text-2xl text-amber-400">
                {remainingCredits}
              </span>
              <span className="text-xs text-neutral-400 font-bold">
                credits available
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('credit-history')}
            className="ml-2 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
            title="View Credit Transaction History"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>
      </div>

      {/* Credit Pricing Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {AI_CREDIT_PACKAGES.map((pkg) => {
          const isPopular = pkg.popular;
          const isLoading = loadingPackageId === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                isPopular
                  ? 'bg-gradient-to-b from-emerald-900 to-neutral-950 text-white shadow-xl ring-2 ring-emerald-500 scale-[1.02]'
                  : 'bg-white text-neutral-900 border border-neutral-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-emerald-500 text-neutral-950 text-[11px] font-black uppercase tracking-wider shadow-md flex items-center gap-1.5">
                  <Zap className="w-3 h-3 fill-current" />
                  Most Popular
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className={`font-display font-bold text-lg ${isPopular ? 'text-white' : 'text-neutral-900'}`}>
                    {pkg.name}
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isPopular
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {pkg.credits} Credits
                  </span>
                </div>

                <p className={`text-xs mb-5 min-h-[36px] ${isPopular ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {pkg.tagline}
                </p>

                {/* Price Display */}
                <div className="mb-5 pb-5 border-b border-neutral-200/40">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold">{pkg.currency}</span>
                    <span className={`font-display font-black text-3xl sm:text-4xl tracking-tight ${isPopular ? 'text-amber-400' : 'text-neutral-900'}`}>
                      {pkg.price.toLocaleString('en-IN')}
                    </span>
                    <span className={`text-xs font-semibold ${isPopular ? 'text-neutral-400' : 'text-neutral-500'}`}>
                      one-time
                    </span>
                  </div>
                  <div className={`text-xs mt-1 font-semibold ${isPopular ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    ₹{pkg.pricePerCredit.toFixed(2)} per virtual try-on render
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 mb-6">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed">
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isPopular ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      />
                      <span className={isPopular ? 'text-neutral-200' : 'text-neutral-700'}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  disabled={isLoading || loadingPackageId !== null}
                  onClick={() => handleBuyPackage(pkg.id)}
                  className={`w-full py-3.5 px-4 rounded-2xl font-display font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPopular
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-neutral-950 shadow-lg shadow-emerald-400/25'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Buy {pkg.credits} Credits</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust, Payment Methods & Legal Disclosures Box */}
      <div className="bg-neutral-50 rounded-3xl p-6 border border-neutral-200/90 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-neutral-900">
                100% Secure Indian Payment Gateway
              </h4>
              <p className="text-xs text-neutral-500">
                Encrypted 256-bit SSL transaction via Razorpay. Supports UPI, Cards & Net Banking.
              </p>
            </div>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-bold text-neutral-700 shadow-2xs">
              UPI (GPay / PhonePe / Paytm)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-bold text-neutral-700 shadow-2xs">
              RuPay / Visa / Master
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 text-[11px] font-bold text-neutral-700 shadow-2xs">
              Net Banking (50+ Banks)
            </span>
          </div>
        </div>

        {/* Pre-Checkout Legal Consent & Policy Links */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 pt-1">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-neutral-400" />
            <span>By purchasing, you agree to our standard boutique terms:</span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-emerald-700">
            <button
              type="button"
              onClick={() => onNavigate('terms')}
              className="hover:underline hover:text-emerald-900 cursor-pointer"
            >
              Terms & Conditions
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('privacy')}
              className="hover:underline hover:text-emerald-900 cursor-pointer"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('refund-policy')}
              className="hover:underline hover:text-emerald-900 cursor-pointer"
            >
              Refund & Cancellation
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('ai-disclaimer')}
              className="hover:underline hover:text-emerald-900 cursor-pointer"
            >
              AI Try-On Disclaimer
            </button>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5 text-neutral-700" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-neutral-900">
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-neutral-500">
              Everything you need to know about boutique AI virtual try-on credits
            </p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100">
          {PAYMENT_FAQ.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between text-left gap-4 group cursor-pointer"
                >
                  <span className="font-display font-bold text-sm text-neutral-900 group-hover:text-emerald-700 transition-colors">
                    {faq.q}
                  </span>
                  <div className="p-1 rounded-lg text-neutral-400 group-hover:text-neutral-700 group-hover:bg-neutral-100 transition-colors">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <p className="text-xs text-neutral-600 leading-relaxed mt-2.5 pr-8">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
