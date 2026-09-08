import React from 'react';
import { NavTab, PaymentOrder } from '../../types';
import {
  AlertTriangle,
  RotateCcw,
  Headphones,
  ArrowLeft,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';

interface PaymentFailedViewProps {
  order: PaymentOrder | null;
  errorMessage?: string;
  onNavigate: (tab: NavTab) => void;
}

export const PaymentFailedView: React.FC<PaymentFailedViewProps> = ({
  order,
  errorMessage,
  onNavigate,
}) => {
  const orderId = order?.id || 'ORD-FAILED';
  const displayError =
    errorMessage ||
    order?.errorMessage ||
    'The transaction could not be completed. Your bank or payment method may have declined the request or the session timed out.';

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl text-center space-y-6">
        {/* Failed Icon */}
        <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-lg shadow-rose-600/15">
          <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Transaction Incomplete</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
            Payment Failed
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            We were unable to complete your AI credit purchase. <strong>No charges were deducted and no AI credits were added to your boutique account.</strong>
          </p>
        </div>

        {/* Failure Details Box */}
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 text-left space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Failure Details
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-500">Order Reference:</span>
              <span className="font-mono font-bold text-neutral-900">{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Status:</span>
              <span className="font-bold text-rose-600">Failed / Unfulfilled</span>
            </div>
            <div className="pt-2 border-t border-neutral-200">
              <span className="text-neutral-500 block mb-1">Reason:</span>
              <span className="text-neutral-700 bg-white p-2.5 rounded-xl border border-neutral-200 block text-xs leading-relaxed">
                {displayError}
              </span>
            </div>
          </div>
        </div>

        {/* Helpful Tips */}
        <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 text-left flex items-start gap-3">
          <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            If money was debited from your bank account or UPI app, it will be automatically reversed back to your account within 3–5 business days as per standard banking protocol.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('upgrade')}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('contact-support')}
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Headphones className="w-4 h-4 text-neutral-600" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};
