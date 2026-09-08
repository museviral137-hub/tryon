import React from 'react';
import { NavTab, PaymentOrder, AIUsage, ShopSettings } from '../../types';
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  Coins,
  ShieldCheck,
  Receipt,
  Store,
} from 'lucide-react';

interface PaymentSuccessViewProps {
  order: PaymentOrder | null;
  creditsAdded: number;
  aiUsage: AIUsage | null;
  settings: ShopSettings;
  onNavigate: (tab: NavTab) => void;
  onStartTryOn: () => void;
}

export const PaymentSuccessView: React.FC<PaymentSuccessViewProps> = ({
  order,
  creditsAdded,
  aiUsage,
  settings,
  onNavigate,
  onStartTryOn,
}) => {
  const remainingCredits = aiUsage?.remainingCredits ?? 0;
  const totalCredits = aiUsage?.totalCredits ?? 0;

  const displayCredits = creditsAdded || order?.credits || 50;
  const displayAmount = order?.amount ? `₹${order.amount.toLocaleString('en-IN')}` : '₹499';
  const orderId = order?.id || 'ORD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
  const dateStr = order?.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Success Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl text-center space-y-6">
        {/* Animated Checkmark Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-600/20">
          <CheckCircle className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Transaction Verified & Settled</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
            Payment Successful!
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Your AI credits have been added successfully to your boutique balance.
          </p>
        </div>

        {/* Big Highlight Box: Credits Added & Balance */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-6 border border-neutral-800 text-left space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-xs text-neutral-400 font-semibold block">
                  Credits Granted
                </span>
                <span className="font-display font-black text-xl text-amber-400">
                  +{displayCredits} AI Credits
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-neutral-400 font-semibold block">
                Total Available
              </span>
              <span className="font-display font-black text-2xl text-white">
                {remainingCredits} <span className="text-xs text-neutral-400 font-normal">/ {totalCredits}</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-neutral-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Credits are immediately available for customer try-on sessions across all garment categories.</span>
          </p>
        </div>

        {/* Order Details Receipt Breakdown */}
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/80 text-left space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider">
            <Receipt className="w-4 h-4" />
            <span>Order Summary & Invoice</span>
          </div>

          <div className="grid grid-cols-2 gap-y-2.5 text-xs">
            <span className="text-neutral-500 font-medium">Boutique:</span>
            <span className="font-bold text-neutral-900 text-right truncate">
              {settings?.shopName || 'VestiAI Boutique'}
            </span>

            <span className="text-neutral-500 font-medium">Order ID:</span>
            <span className="font-mono font-bold text-neutral-900 text-right truncate">
              {orderId}
            </span>

            <span className="text-neutral-500 font-medium">Date & Time:</span>
            <span className="font-medium text-neutral-900 text-right">
              {dateStr}
            </span>

            <span className="text-neutral-500 font-medium">Payment Method:</span>
            <span className="font-medium text-neutral-900 text-right">
              Secured Gateway (UPI / Card)
            </span>

            <span className="text-neutral-500 font-medium">Amount Paid:</span>
            <span className="font-bold text-emerald-700 text-right">
              {displayAmount} (Inclusive of all taxes)
            </span>

            <span className="text-neutral-500 font-medium">Status:</span>
            <span className="font-bold text-emerald-700 text-right flex items-center justify-end gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Paid & Fulfilled
            </span>
          </div>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onStartTryOn}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Start Virtual Try-On</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-neutral-600" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
