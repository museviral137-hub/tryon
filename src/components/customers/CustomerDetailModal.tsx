import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, TryOnResult, ShopSettings } from '../../types';
import {
  X,
  Sparkles,
  Phone,
  Calendar,
  Layers,
  History,
  ShieldCheck,
  Trash2,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { formatPrice } from '../../utils/currency';

interface CustomerDetailModalProps {
  isOpen: boolean;
  customer: Customer | null;
  history: TryOnResult[];
  settings: ShopSettings;
  onClose: () => void;
  onStartTryOnWithCustomer: (customer: Customer) => void;
  onOpenResult: (result: TryOnResult) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  customer,
  history,
  settings,
  onClose,
  onStartTryOnWithCustomer,
  onOpenResult,
  onDeleteCustomer,
}) => {
  if (!isOpen || !customer) return null;

  const customerTryOns = history.filter(
    (t) => t.customerId === customer.customerId || t.customerId === customer.id
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-neutral-200 z-10 my-auto max-h-[90vh] flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-neutral-900 text-white px-2 py-0.5 rounded">
                {customer.customerId}
              </span>
              <h3 className="font-display font-black text-base sm:text-lg text-neutral-900">
                {customer.name}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Profile Overview Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-neutral-200 border-2 border-neutral-300 shadow-sm shrink-0 flex items-center justify-center">
                {customer?.imageUrl ? (
                  <img
                    src={customer.imageUrl}
                    alt={customer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h4 className="font-bold text-base text-neutral-900">{customer.name}</h4>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Consent Active</span>
                  </span>
                </div>

                <p className="text-xs text-neutral-600 flex items-center justify-center sm:justify-start gap-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{customer.phone || 'No phone number added'}</span>
                </p>

                <p className="text-[11px] text-neutral-400 flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Profile Created: {new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
                </p>

                {customer.notes && (
                  <p className="text-xs text-neutral-700 bg-white p-2 rounded-xl border border-neutral-200/80 mt-2">
                    <span className="font-bold text-neutral-900">Notes: </span>
                    {customer.notes}
                  </p>
                )}
              </div>

              {/* Action: Quick Try-On */}
              <div className="shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartTryOnWithCustomer(customer);
                  }}
                  className="w-full sm:w-auto py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Try New Garment</span>
                </button>
              </div>
            </div>

            {/* Saved Try-On Looks Gallery */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-display font-bold text-sm text-neutral-900">
                    Previous Try-On Looks ({customerTryOns.length})
                  </h4>
                </div>
              </div>

              {customerTryOns.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {customerTryOns.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onClose();
                        onOpenResult(item);
                      }}
                      className="group cursor-pointer bg-neutral-50 rounded-2xl p-2 border border-neutral-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all"
                    >
                      <div className="relative aspect-4/5 rounded-xl overflow-hidden bg-neutral-900 mb-2 flex items-center justify-center">
                        {item.resultImageUrl ? (
                          <img
                            src={item.resultImageUrl}
                            alt={item.garmentName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="text-xl">✨</span>
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-neutral-950/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {item.garmentProductId}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {item.garmentName}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-0.5">
                          <span className="font-semibold text-emerald-700">
                            {formatPrice(item.garmentPrice, settings.currencySymbol)}
                          </span>
                          <span>{new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-8 bg-neutral-50 rounded-2xl border border-neutral-200">
                  <Layers className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-neutral-700">No try-ons yet for {customer.name}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Click "Try New Garment" to generate the first AI fitting look.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDeleteCustomer(customer.id);
                onClose();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Customer Profile</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-100 text-neutral-700 font-bold text-xs"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
