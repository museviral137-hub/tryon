import React, { useState, useEffect } from 'react';
import { NavTab, PaymentOrder } from '../../types';
import { paymentsApi } from '../../api/payments';
import {
  Clock,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface PaymentPendingViewProps {
  orderId: string | null;
  onNavigate: (tab: NavTab) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  onRefreshUsage: () => Promise<void>;
  onPaymentSuccess?: (orderId: string, creditsAdded: number) => void;
}

export const PaymentPendingView: React.FC<PaymentPendingViewProps> = ({
  orderId,
  onNavigate,
  onShowToast,
  onRefreshUsage,
  onPaymentSuccess,
}) => {
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (orderId) {
      paymentsApi.getOrder(orderId).then((ord) => {
        if (ord) setOrder(ord);
      });
    }
  }, [orderId]);

  const handleCheckStatus = async () => {
    if (!orderId) return;
    try {
      setIsChecking(true);
      const ord = await paymentsApi.getOrder(orderId);
      if (ord) {
        setOrder(ord);
        if (ord.status === 'paid') {
          await onRefreshUsage();
          onPaymentSuccess?.(ord.id, ord.credits);
          onNavigate('payment-success');
          return;
        } else if (ord.status === 'failed') {
          onNavigate('payment-failed');
          return;
        }
      }
      onShowToast('Payment Still Pending', 'Gateway verification is still in progress.', 'info');
    } catch (e: any) {
      onShowToast('Status Check Failed', e.message || 'Unable to fetch status', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  const displayOrderId = orderId || order?.id || 'ORD-PENDING';
  const displayAmount = order ? `₹${order.amount.toLocaleString('en-IN')}` : '₹499';
  const displayCredits = order ? `${order.credits} AI Credits` : 'Credits Package';

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-xl text-center space-y-6">
        {/* Pending Clock Icon */}
        <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-lg shadow-amber-600/15">
          <Clock className="w-10 h-10 stroke-[2.5] animate-pulse" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Awaiting Gateway Confirmation</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
            Payment Processing
          </h1>
          <p className="text-sm text-neutral-600 mt-1">
            Your payment is being verified with the payment gateway. <strong>Your AI credits will be added automatically once payment is confirmed.</strong>
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200 text-left space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Transaction Details
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-xs">
            <span className="text-neutral-500">Order ID:</span>
            <span className="font-mono font-bold text-neutral-900 text-right truncate">
              {displayOrderId}
            </span>

            <span className="text-neutral-500">Package:</span>
            <span className="font-bold text-neutral-900 text-right">
              {displayCredits}
            </span>

            <span className="text-neutral-500">Amount:</span>
            <span className="font-bold text-neutral-900 text-right">
              {displayAmount}
            </span>

            <span className="text-neutral-500">Current Status:</span>
            <span className="font-bold text-amber-600 text-right flex items-center justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Pending Verification
            </span>
          </div>
        </div>

        {/* Informative Notice */}
        <div className="bg-blue-50/70 rounded-2xl p-4 border border-blue-200 text-left flex items-start gap-3 text-xs text-blue-900">
          <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Bank authorizations may take up to a few minutes. You can safely check back anytime or review your balance in <strong>Credit History</strong>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            disabled={isChecking}
            onClick={handleCheckStatus}
            className="w-full py-3.5 px-6 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white font-display font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Status...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Refresh & Check Status</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full py-2.5 text-xs text-neutral-500 hover:text-neutral-900 font-semibold cursor-pointer"
          >
            Return to Boutique Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
