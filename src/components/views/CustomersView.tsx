import React, { useState } from 'react';
import { Customer, TryOnResult, ShopSettings } from '../../types';
import {
  UserPlus,
  Search,
  Users,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  Phone,
  History,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CustomerDetailModal } from '../customers/CustomerDetailModal';

interface CustomersViewProps {
  customers: Customer[];
  history: TryOnResult[];
  settings: ShopSettings;
  onStartTryOn: (customer: Customer) => void;
  onOpenAddCustomer: () => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onViewCustomerHistory?: (customer: Customer) => void;
  onOpenResult?: (result: TryOnResult) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  history,
  settings,
  onStartTryOn,
  onOpenAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onViewCustomerHistory,
  onOpenResult,
}) => {
  const [search, setSearch] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Customer | null>(null);
  const [selectedDetailCustomer, setSelectedDetailCustomer] = useState<Customer | null>(null);

  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.customerId.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.notes && c.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-xl sm:text-2xl text-neutral-900">
              Customer Profiles
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {customers.length} Saved
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Customer photos are stored securely once and reused for all garment fittings.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddCustomer}
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone number or ID (e.g. C001)..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-hidden focus:bg-white focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl p-4 border border-neutral-200/90 shadow-xs hover:border-emerald-300 transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Top row with avatar, ID, and menu */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div 
                    onClick={() => setSelectedDetailCustomer(c)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 shadow-2xs flex items-center justify-center">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs bg-neutral-900 text-white px-1.5 py-0.5 rounded">
                          {c.customerId}
                        </span>
                        <h3 className="font-bold text-sm sm:text-base text-neutral-900 truncate group-hover:text-emerald-700 transition-colors">
                          {c.name}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-neutral-400" />
                        <span>{c.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* 3-dot Menu */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === c.id ? null : c.id)}
                      className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === c.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setSelectedDetailCustomer(c);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 font-semibold"
                        >
                          <Eye className="w-3 h-3 text-neutral-500" />
                          <span>View Profile</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditCustomer(c);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 font-semibold"
                        >
                          <Edit2 className="w-3 h-3 text-neutral-500" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setDeleteCandidate(c);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 font-semibold"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes or Preferences */}
                {c.notes && (
                  <p className="text-xs text-neutral-600 bg-neutral-50 p-2 rounded-xl mb-3 border border-neutral-100 line-clamp-2">
                    {c.notes}
                  </p>
                )}

                {/* Stats Bar */}
                <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100 mb-3">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Consent Active</span>
                  </span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {c.tryOnCount || 0} Fits
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDetailCustomer(c)}
                  className="py-2 px-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Looks</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartTryOn(c)}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Try On</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={customers.length === 0 ? 'No customers yet' : 'No matching customer'}
          description={
            customers.length === 0
              ? 'Save a customer once to quickly reuse their photo for future garment try-ons.'
              : 'Try searching with a different name, phone or Customer ID (e.g. C001).'
          }
          actionText={customers.length === 0 ? '+ Add Customer' : 'Clear Search'}
          onAction={customers.length === 0 ? onOpenAddCustomer : () => setSearch('')}
          actionIcon={UserPlus}
        />
      )}

      {/* Customer Detail & Look History Modal */}
      <CustomerDetailModal
        isOpen={Boolean(selectedDetailCustomer)}
        customer={selectedDetailCustomer}
        history={history}
        settings={settings}
        onClose={() => setSelectedDetailCustomer(null)}
        onStartTryOnWithCustomer={onStartTryOn}
        onOpenResult={(res) => onOpenResult?.(res)}
        onDeleteCustomer={(id) => {
          onDeleteCustomer(id);
          setSelectedDetailCustomer(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title={`Delete Customer ${deleteCandidate?.name}?`}
        message={`Are you sure you want to delete profile ${deleteCandidate?.customerId}? Their saved photo will no longer be available for quick try-ons.`}
        confirmText="Delete Customer"
        isDestructive
        onConfirm={() => {
          if (deleteCandidate) {
            onDeleteCustomer(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
