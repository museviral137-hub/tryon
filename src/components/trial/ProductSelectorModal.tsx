import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Garment, GarmentCategory } from '../../types';
import { searchGarments } from '../../utils/productUtils';
import { Search, X, Plus, Sparkles } from 'lucide-react';

interface ProductSelectorModalProps {
  isOpen: boolean;
  garments: Garment[];
  selectedGarmentId?: string;
  onSelect: (garment: Garment) => void;
  onAddNewGarment: () => void;
  onClose: () => void;
}

const CATEGORIES: ('All' | GarmentCategory)[] = [
  'All',
  'Sarees',
  'Dresses',
  'Shirts',
  'Kurtas',
  'Lehengas',
  'Suits',
  'Ethnic Wear',
];

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  isOpen,
  garments,
  selectedGarmentId,
  onSelect,
  onAddNewGarment,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | GarmentCategory>('All');

  if (!isOpen) return null;

  const filteredGarments = searchGarments(garments, search, category);

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
          className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl z-10 max-h-[88vh] sm:max-h-[85vh] flex flex-col border border-neutral-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base sm:text-lg text-neutral-900">
                Saved Garment Library
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {garments.length} Available
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar & Category filter */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Product ID (J001), name, or color..."
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-hidden focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Category horizontal pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                    category === cat
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Garments Grid (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredGarments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredGarments.map((g) => {
                  const isSelected = selectedGarmentId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        onSelect(g);
                        onClose();
                      }}
                      className={`relative flex flex-col text-left p-2 rounded-2xl border transition-all active:scale-98 group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60'
                      }`}
                    >
                      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 mb-2 border border-neutral-200 flex items-center justify-center">
                        {g.imageUrl ? (
                          <img
                            src={g.imageUrl}
                            alt={g.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <span className="text-xl">👗</span>
                        )}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-neutral-950/80 text-white font-mono text-[10px] font-bold shadow-2xs">
                          {g.productId}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-neutral-900 truncate leading-tight">
                          {g.name}
                        </h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-extrabold text-neutral-900">
                            ₹{g.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-neutral-500">{g.category}</span>
                        </div>
                        {(g.category.toLowerCase().includes('unstitched') || g.category.toLowerCase().includes('fabric roll')) && (
                          <div className="mt-1 text-[9px] font-semibold text-amber-700 bg-amber-50 rounded px-1 py-0.5 border border-amber-200 truncate">
                            Unstitched Fabric
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-neutral-700 mb-1">
                  No garments match your search
                </p>
                <p className="text-xs text-neutral-400 mb-4">
                  Add a new garment to assign it a unique Product ID.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAddNewGarment();
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Save New Garment
                </button>
              </div>
            )}
          </div>

          {/* Bottom Add Bar */}
          <div className="pt-3 border-t border-neutral-100 mt-2 flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              Select any garment to load in trial room
            </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onAddNewGarment();
              }}
              className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-100 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Add Garment</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
