import React, { useState, useMemo } from 'react';
import { Garment, GarmentCategory } from '../../types';
import { searchGarments } from '../../utils/productUtils';
import { formatPrice } from '../../utils/currency';
import {
  Plus,
  Search,
  Sparkles,
  MoreVertical,
  Edit2,
  Trash2,
  Shirt,
  Tag,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface GarmentsViewProps {
  garments: Garment[];
  currencySymbol?: string;
  onStartTryOn: (garment: Garment) => void;
  onOpenAddGarment: () => void;
  onEditGarment: (garment: Garment) => void;
  onDeleteGarment: (id: string) => void;
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
  'Other',
];

export const GarmentsView: React.FC<GarmentsViewProps> = ({
  garments,
  currencySymbol = '₹',
  onStartTryOn,
  onOpenAddGarment,
  onEditGarment,
  onDeleteGarment,
}) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'All' | GarmentCategory>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'id' | 'name' | 'priceAsc' | 'priceDesc'>('recent');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Garment | null>(null);

  // Filter & Search
  const filtered = useMemo(() => {
    let list = searchGarments(garments, search, category);

    return [...list].sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'id') {
        return a.productId.localeCompare(b.productId, undefined, { numeric: true });
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'priceAsc') {
        return a.price - b.price;
      }
      if (sortBy === 'priceDesc') {
        return b.price - a.price;
      }
      return 0;
    });
  }, [garments, search, category, sortBy]);

  return (
    <div className="space-y-5">
      {/* Header & Add Garment CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-xl sm:text-2xl text-neutral-900">
              Garment Library
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {garments.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Save your products once and use them for every customer trial.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddGarment}
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Garment</span>
        </button>
      </div>

      {/* Search, Filter Pills & Sort Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Product ID (e.g. J002), name, category, color..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-neutral-400 hidden sm:inline" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-semibold text-neutral-700 outline-hidden focus:bg-white focus:border-emerald-500"
            >
              <option value="recent">Recently Added</option>
              <option value="id">Product ID (J001...)</option>
              <option value="name">Garment Name</option>
              <option value="priceAsc">Price: Low to High</option>
              <option value="priceDesc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
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

      {/* Garments 2-Column Mobile / 3-4 Column Responsive Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="relative flex flex-col justify-between bg-white rounded-2xl p-2.5 sm:p-3 border border-neutral-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all group"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-100 mb-2.5 border border-neutral-200 flex items-center justify-center">
                  {g.imageUrl ? (
                    <img
                      src={g.imageUrl}
                      alt={g.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <span className="text-3xl text-neutral-300">👗</span>
                  )}
                  {/* Big clear Product ID Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-neutral-950/85 backdrop-blur-xs text-white font-mono text-xs font-black shadow-md">
                    {g.productId}
                  </div>

                  {/* Stock status pill */}
                  <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-neutral-800 text-[10px] font-bold shadow-2xs">
                    {g.stockStatus}
                  </div>

                  {/* 3-dot Menu button */}
                  <div className="absolute top-2 right-2">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === g.id ? null : g.id)}
                      className="p-1 rounded-md bg-white/90 backdrop-blur-xs text-neutral-700 hover:bg-white shadow-xs"
                      aria-label="Actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeMenuId === g.id && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-neutral-200 py-1 z-20">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            onEditGarment(g);
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
                            setDeleteCandidate(g);
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

                {/* Details */}
                <h3 className="font-bold text-xs sm:text-sm text-neutral-900 leading-snug line-clamp-2">
                  {g.name}
                </h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[11px] text-neutral-500">{g.category}</p>
                  {(g.category.toLowerCase().includes('unstitched') || g.category.toLowerCase().includes('fabric roll')) && (
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1 py-0.2 rounded">
                      Unstitched
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-neutral-100">
                  <span className="font-extrabold text-xs sm:text-sm text-neutral-900">
                    {formatPrice(g.price, currencySymbol)}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {g.tryOnCount || 0} Trials
                  </span>
                </div>
              </div>

              {/* Try On Button */}
              <button
                type="button"
                onClick={() => onStartTryOn(g)}
                className="mt-3 w-full py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Try On</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={Shirt}
          title={garments.length === 0 ? 'No garments saved yet' : 'No garments match your filter'}
          description={
            garments.length === 0
              ? 'Save your first garment to start using the AI Trial Room.'
              : 'Try clearing your search query or choosing another category filter.'
          }
          actionText={garments.length === 0 ? '+ Add Garment' : 'Reset Search'}
          onAction={garments.length === 0 ? onOpenAddGarment : () => { setSearch(''); setCategory('All'); }}
          actionIcon={Plus}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title={`Delete Garment ${deleteCandidate?.productId}?`}
        message={`Are you sure you want to remove "${deleteCandidate?.name}" from your saved library? This action cannot be undone.`}
        confirmText="Delete Garment"
        isDestructive
        onConfirm={() => {
          if (deleteCandidate) {
            onDeleteGarment(deleteCandidate.id);
            setDeleteCandidate(null);
          }
        }}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
