import React, { useState } from 'react';
import { Customer } from '../../types';
import { UserPlus, Users, Camera, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface CustomerSelectorCardProps {
  selectedCustomer: Customer | null;
  onBrowseCustomers: () => void;
  onAddNewCustomer: () => void;
  onCaptureCamera: () => void;
  onClearCustomer: () => void;
  consentAgreed?: boolean;
  onConsentChange?: (agreed: boolean) => void;
}

export const CustomerSelectorCard: React.FC<CustomerSelectorCardProps> = ({
  selectedCustomer,
  onBrowseCustomers,
  onAddNewCustomer,
  onCaptureCamera,
  onClearCustomer,
  consentAgreed = true,
  onConsentChange,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs transition-all hover:border-neutral-300">
      {/* Card Step Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
            1
          </span>
          <h3 className="font-display font-bold text-sm sm:text-base text-neutral-900">
            Customer Photo
          </h3>
        </div>
        {selectedCustomer && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Selected
          </span>
        )}
      </div>

      {/* Selected Customer View */}
      {selectedCustomer ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3.5 p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 shadow-2xs flex items-center justify-center">
              {selectedCustomer?.imageUrl ? (
                <img
                  src={selectedCustomer.imageUrl}
                  alt={selectedCustomer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">👤</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 rounded-md bg-neutral-900 text-white text-[11px] font-mono font-bold tracking-tight">
                  {selectedCustomer.customerId}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 truncate">
                  {selectedCustomer.name}
                </h4>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">{selectedCustomer.phone}</p>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                ✓ Saved customer ({selectedCustomer.tryOnCount || 0} try-ons)
              </p>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onBrowseCustomers}
                className="p-2 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 text-xs font-semibold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                title="Change Customer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
                <span className="hidden sm:inline">Change</span>
              </button>
              <button
                type="button"
                onClick={onClearCustomer}
                className="text-[11px] text-neutral-400 hover:text-rose-600 font-semibold text-center"
              >
                Remove
              </button>
            </div>
          </div>

          {/* Privacy / Photo Consent Checkbox */}
          <label className="flex items-center gap-2 px-1 text-[11px] text-neutral-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => onConsentChange?.(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
            />
            <span className="flex items-center gap-1 text-neutral-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
              Customer has agreed to photo processing and boutique fitting storage.
            </span>
          </label>
        </div>
      ) : (
        /* Empty / Selection Options */
        <div className="space-y-3">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Select an existing customer or upload a new photo. Saved photos are reusable for all garments.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Choose Saved Customer */}
            <button
              type="button"
              onClick={onBrowseCustomers}
              className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-emerald-50/50 hover:border-emerald-300 text-neutral-800 text-xs font-bold active:scale-98 transition-all shadow-2xs group"
            >
              <Users className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              <span>Select Customer</span>
            </button>

            {/* Take Camera Photo */}
            <button
              type="button"
              onClick={onCaptureCamera}
              className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold active:scale-98 transition-all shadow-2xs"
            >
              <Camera className="w-4 h-4 text-neutral-600" />
              <span>Take Photo</span>
            </button>

            {/* New Customer */}
            <button
              type="button"
              onClick={onAddNewCustomer}
              className="flex items-center justify-center gap-2 py-3 px-3.5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-emerald-800 text-xs font-bold active:scale-98 transition-all"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>+ New Customer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
