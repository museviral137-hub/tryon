import React from 'react';
import { Customer, TryOnResult } from '../../types';
import { Sparkles, Plus, Eye, Share2, Layers } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

interface SessionLooksBarProps {
  customer: Customer;
  sessionResults: TryOnResult[];
  activeResultId?: string;
  onSelectResult: (result: TryOnResult) => void;
  onTryAnotherGarment: () => void;
  currencySymbol?: string;
}

export const SessionLooksBar: React.FC<SessionLooksBarProps> = ({
  customer,
  sessionResults,
  activeResultId,
  onSelectResult,
  onTryAnotherGarment,
  currencySymbol = '₹',
}) => {
  if (sessionResults.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-emerald-200/90 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-xs sm:text-sm text-neutral-900 leading-tight">
              Looks Tried Today for {customer.name}
            </h4>
            <p className="text-[11px] text-neutral-500">
              {sessionResults.length} {sessionResults.length === 1 ? 'garment fitted' : 'garments fitted'} • Compare or try another
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTryAnotherGarment}
          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Try Another</span>
        </button>
      </div>

      {/* Looks Horizontal Reel */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
        {sessionResults.map((look, index) => {
          const isActive = look.id === activeResultId;
          return (
            <button
              key={look.id}
              type="button"
              onClick={() => onSelectResult(look)}
              className={`group relative flex-shrink-0 w-28 rounded-2xl overflow-hidden text-left border-2 transition-all p-1.5 ${
                isActive
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-400/40'
                  : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100/80'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-4/5 w-full rounded-xl overflow-hidden bg-neutral-900 mb-1.5 flex items-center justify-center">
                {look.resultImageUrl ? (
                  <img
                    src={look.resultImageUrl}
                    alt={look.garmentName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="text-xl">✨</span>
                )}
                <span className="absolute top-1 left-1 bg-neutral-950/80 backdrop-blur-xs text-white font-mono font-bold text-[9px] px-1 py-0.5 rounded">
                  Look #{index + 1}
                </span>
                <div className="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Eye className="w-4 h-4 drop-shadow" />
                </div>
              </div>

              {/* Garment Details */}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-bold text-[10px] text-emerald-700 bg-emerald-100/80 px-1 py-0.2 rounded truncate">
                    {look.garmentProductId}
                  </span>
                  <span className="font-bold text-[10px] text-neutral-800 shrink-0">
                    {formatPrice(look.garmentPrice, currencySymbol)}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-600 font-semibold truncate mt-0.5">
                  {look.garmentName}
                </p>
              </div>
            </button>
          );
        })}

        {/* Add Another Garment Tile */}
        <button
          type="button"
          onClick={onTryAnotherGarment}
          className="flex-shrink-0 w-28 aspect-4/5 rounded-2xl border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 flex flex-col items-center justify-center text-center p-2 transition-all active:scale-95 cursor-pointer text-emerald-800"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-xs">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold">Try Next Garment</span>
          <span className="text-[9px] text-emerald-600 mt-0.5">Keep {customer.name.split(' ')[0]}</span>
        </button>
      </div>
    </div>
  );
};
