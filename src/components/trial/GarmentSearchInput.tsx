import React, { useState, useEffect, useRef } from 'react';
import { Garment } from '../../types';
import { searchGarments, normalizeProductId, findGarmentBySmartQuery } from '../../utils/productUtils';
import { Search, Sparkles, Plus, Grid, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GarmentSearchInputProps {
  garments: Garment[];
  selectedGarment: Garment | null;
  onSelectGarment: (garment: Garment) => void;
  onBrowseGarments: () => void;
  onAddNewGarment: () => void;
}

export const GarmentSearchInput: React.FC<GarmentSearchInputProps> = ({
  garments,
  selectedGarment,
  onSelectGarment,
  onBrowseGarments,
  onAddNewGarment,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Garment[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Update suggestions & auto-detection as user types
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const matches = searchGarments(garments, query);
    setSuggestions(matches);

    // Auto-detection check: If user typed an exact normalized match (e.g. "j2" or "J002")
    const smartMatch = findGarmentBySmartQuery(garments, query);
    if (smartMatch && (!selectedGarment || selectedGarment.id !== smartMatch.id)) {
      // If the query is high-confidence (length >= 2 or exact normalized match)
      if (query.trim().length >= 2 || matches.length === 1) {
        onSelectGarment(smartMatch);
      }
    }
  }, [query, garments]);

  // Handle clicking outside to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (garment: Garment) => {
    onSelectGarment(garment);
    setQuery(garment.productId);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const smartMatch = findGarmentBySmartQuery(garments, query);
      if (smartMatch) {
        handleSelect(smartMatch);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    }
  };

  const normalizedPreview = query.trim() ? normalizeProductId(query) : '';
  const hasNoResults = query.trim().length > 0 && suggestions.length === 0;

  return (
    <div ref={containerRef} className="relative space-y-3">
      {/* Search Input Box */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type Product ID (e.g. J2, J002, or Saree)..."
          className="w-full pl-11 pr-24 py-3.5 text-base sm:text-lg bg-white border-2 border-neutral-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl outline-hidden text-neutral-900 placeholder:text-neutral-400 font-medium transition-all shadow-xs"
        />

        {/* Quick Browse button inside input */}
        <div className="absolute inset-y-0 right-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={onBrowseGarments}
            className="flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-xs font-bold text-neutral-700 transition-all"
            title="Browse all garments"
          >
            <Grid className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Browse</span>
          </button>
        </div>
      </div>

      {/* Smart normalization hint pill */}
      {query.trim().length > 0 && normalizedPreview && normalizedPreview !== query.toUpperCase() && (
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 pl-1">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Interpreting as Product ID:</span>
          <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
            {normalizedPreview}
          </span>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      <AnimatePresence>
        {isFocused && (suggestions.length > 0 || hasNoResults) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden z-40 max-h-72 overflow-y-auto"
          >
            {suggestions.length > 0 ? (
              <div className="p-1.5 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Matching Saved Garments ({suggestions.length})
                </div>
                {suggestions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelect(g)}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200 flex items-center justify-center">
                        {g.imageUrl ? (
                          <img
                            src={g.imageUrl}
                            alt={g.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base">👗</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs bg-neutral-900 text-white px-1.5 py-0.5 rounded-md">
                            {g.productId}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                            {g.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {g.category} • ₹{g.price.toLocaleString('en-IN')}
                        </span>
                        {(g.category.toLowerCase().includes('unstitched') || g.category.toLowerCase().includes('fabric roll')) && (
                          <span className="ml-2 text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                            Unstitched Fabric
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-700 text-xs font-bold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                      <span>Select</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            ) : hasNoResults ? (
              <div className="p-5 text-center">
                <p className="text-xs font-medium text-neutral-600 mb-1">
                  No garment found matching <span className="font-bold text-neutral-900">"{query}"</span>
                </p>
                <p className="text-[11px] text-neutral-400 mb-3">
                  Try another Product ID or save a new garment to your library.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsFocused(false);
                    onAddNewGarment();
                  }}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 active:scale-98 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Save New Garment
                </button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
