import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../../types';
import { Search, X, UserPlus, Phone, Sparkles } from 'lucide-react';

interface CustomerSelectorModalProps {
  isOpen: boolean;
  customers: Customer[];
  selectedCustomerId?: string;
  onSelect: (customer: Customer) => void;
  onAddNewCustomer: () => void;
  onClose: () => void;
}

export const CustomerSelectorModal: React.FC<CustomerSelectorModalProps> = ({
  isOpen,
  customers,
  selectedCustomerId,
  onSelect,
  onAddNewCustomer,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerId.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl z-10 max-h-[88vh] sm:max-h-[85vh] flex flex-col border border-neutral-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base sm:text-lg text-neutral-900">
                Select Customer
              </span>
              <span className="text-xs font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                {customers.length} Profiles
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or Customer ID (C001)..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-hidden focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Customers List (Scrollable) */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.length > 0 ? (
              filtered.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left active:scale-98 group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 flex items-center justify-center">
                        {c.imageUrl ? (
                          <img
                            src={c.imageUrl}
                            alt={c.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">👤</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                            {c.customerId}
                          </span>
                          <h4 className="font-bold text-sm text-neutral-900 truncate">
                            {c.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                          <span>{c.phone}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            {c.tryOnCount || 0} try-ons
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-emerald-700 bg-white border border-neutral-200 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all shadow-2xs">
                      Select
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-neutral-700 mb-1">
                  No customer found for "{search}"
                </p>
                <p className="text-xs text-neutral-400 mb-4">
                  Add this customer once to save their photo for all future try-ons.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddNewCustomer();
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Save New Customer
                </button>
              </div>
            )}
          </div>

          {/* Bottom Action */}
          <div className="pt-3 border-t border-neutral-100 mt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Customer photos can be reused for any garment
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewCustomer();
              }}
              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Add Customer</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
