import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Shirt, UserCheck, Wand2, X, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { Customer, Garment } from '../../types';
import { TryOnProgressPhase } from '../../services/tryOnService';

interface ProcessingModalProps {
  isOpen: boolean;
  customer: Customer | null;
  garment: Garment | null;
  onCancel?: () => void;
  hasError?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onTopUpCredits?: () => Promise<void> | void;
  phase?: TryOnProgressPhase;
  phaseMessage?: string | null;
  wasRefunded?: boolean;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({
  isOpen,
  customer,
  garment,
  onCancel,
  hasError = false,
  errorMessage,
  onRetry,
  onTopUpCredits,
  phase = 'preparing',
  phaseMessage,
  wasRefunded,
}) => {
  const [isToppingUp, setIsToppingUp] = useState(false);

  if (!isOpen) return null;

  const phaseStepMap: Record<TryOnProgressPhase, number> = {
    idle: 0,
    preparing: 0,
    detecting_pose: 1,
    aligning_fabric: 2,
    generating: 3,
    finalizing: 3,
    completed: 3,
    failed: 0,
  };

  const stepIndex = phaseStepMap[phase] ?? 0;

  const steps = [
    { title: 'Validating photo coordinates & pose', icon: UserCheck },
    { title: `Aligning ${garment?.name || 'garment'} silhouette & drape`, icon: Shirt },
    { title: 'Synthesizing neural virtual fitting preview', icon: Wand2 },
    { title: 'Finalizing high-resolution boutique card', icon: Sparkles },
  ];

  const CurrentIcon = steps[stepIndex]?.icon || Sparkles;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 text-center overflow-hidden"
      >
        {/* Cancel button */}
        {!hasError && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Cancel Generation"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Visual Pair Floating Avatars */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md flex items-center justify-center bg-neutral-100">
            {customer?.imageUrl ? (
              <img
                src={customer.imageUrl}
                alt={customer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">👤</span>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>

          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-md flex items-center justify-center bg-neutral-100">
            {garment?.imageUrl ? (
              <img
                src={garment.imageUrl}
                alt={garment.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl">👗</span>
            )}
          </div>
        </div>

        {hasError ? (
          /* Error & Retry view */
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-neutral-900">
                Fitting Generation Failed
              </h3>
              <p className="text-xs text-neutral-600 mt-1.5 max-w-xs mx-auto">
                {errorMessage || 'Unable to synthesize try-on preview. Please verify photos and retry.'}
              </p>
              {wasRefunded === true && (
                <p className="text-[11px] text-emerald-700 font-semibold mt-2 bg-emerald-50 py-1 px-2.5 rounded-lg border border-emerald-200 inline-block">
                  ✓ AI credit has been refunded to your boutique balance.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              {errorMessage?.toLowerCase().includes('credit') && onTopUpCredits && (
                <button
                  type="button"
                  disabled={isToppingUp}
                  onClick={async () => {
                    try {
                      setIsToppingUp(true);
                      await onTopUpCredits();
                      if (onRetry) {
                        onRetry();
                      }
                    } catch (err) {
                      console.error('Failed to top up credits:', err);
                    } finally {
                      setIsToppingUp(false);
                    }
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isToppingUp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding Credits & Retrying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Top Up 50 Credits & Retry</span>
                    </>
                  )}
                </button>
              )}

              <div className="flex gap-2">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-300 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                  >
                    Close
                  </button>
                )}
                {onRetry && !errorMessage?.toLowerCase().includes('saree') && !errorMessage?.toLowerCase().includes('unstitched') && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Fit</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Normal Animated Progress View */
          <>
            <h3 className="font-display font-black text-lg sm:text-xl text-neutral-900 mb-1">
              Virtual Try-On in Progress
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Fitting <span className="font-bold text-neutral-800">{garment?.productId} ({garment?.category})</span> on{' '}
              <span className="font-bold text-neutral-800">{customer?.name}</span>
            </p>

            {/* Dynamic Step Status */}
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 py-3 px-4 rounded-2xl border border-emerald-200/80 mb-5">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />
              <span className="truncate">{phaseMessage || steps[stepIndex]?.title}</span>
            </div>

            {/* Step Pills */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx <= stepIndex ? 'bg-emerald-600' : 'bg-neutral-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
              <span>Boutique AI Engine</span>
              <span>Step {stepIndex + 1} of 4</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
