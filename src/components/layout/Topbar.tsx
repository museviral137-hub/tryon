import React from 'react';
import { ShopSettings, AIUsage } from '../../types';
import { Search, Sparkles, Store, Plus, Coins } from 'lucide-react';

interface TopbarProps {
  settings: ShopSettings;
  aiUsage?: AIUsage | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onQuickAddGarment: () => void;
  onQuickAddCustomer: () => void;
  onStartTryOn: () => void;
  onUpgradeCredits?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  settings,
  aiUsage,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onQuickAddGarment,
  onQuickAddCustomer,
  onStartTryOn,
  onUpgradeCredits,
}) => {
  const remainingCredits = aiUsage?.remainingCredits ?? 0;
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <header className="hidden lg:flex items-center justify-between px-8 py-4 bg-white/80 backdrop-blur-md border-b border-neutral-200/80 sticky top-0 z-20">
      {/* Global Smart Search Bar */}
      <div className="relative w-80 xl:w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search Product ID (e.g. J002), saree, customer..."
          className="w-full pl-10 pr-12 py-2 text-sm bg-neutral-100/80 hover:bg-neutral-100 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl outline-hidden text-neutral-900 placeholder:text-neutral-400 transition-all shadow-2xs"
        />
        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
          <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400 bg-white border border-neutral-200 rounded-md shadow-2xs">
            ↵ Enter
          </kbd>
        </div>
      </div>

      {/* Right Controls: Quick Actions & Status */}
      <div className="flex items-center gap-3">
        {/* Credit Balance Badge & Upgrade CTA */}
        {onUpgradeCredits && (
          <button
            type="button"
            onClick={onUpgradeCredits}
            className="inline-flex items-center gap-2 py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-xs font-bold text-amber-950 transition-all cursor-pointer shadow-2xs group active:scale-98"
            title="Buy AI Trial Credits"
          >
            <div className="w-5 h-5 rounded-md bg-amber-400 text-neutral-950 flex items-center justify-center font-black">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <span>{remainingCredits} Credits</span>
            <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-extrabold group-hover:bg-amber-300 transition-colors">
              + Top Up
            </span>
          </button>
        )}

        {/* Quick Add Garment */}
        <button
          type="button"
          onClick={onQuickAddGarment}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-neutral-500" />
          Add Garment
        </button>

        {/* Quick Add Customer */}
        <button
          type="button"
          onClick={onQuickAddCustomer}
          className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-neutral-500" />
          Add Customer
        </button>

        {/* Start Trial Room Primary CTA */}
        <button
          type="button"
          onClick={onStartTryOn}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-xs font-bold text-white shadow-xs shadow-emerald-600/25 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
          Open AI Trial Room
        </button>

        <div className="h-6 w-px bg-neutral-200 mx-1" />

        {/* Shop Badge info */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 text-xs font-bold">
            <Store className="w-4 h-4" />
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-neutral-900 leading-tight">
              {settings?.shopName || 'VestiAI Boutique'}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold">
              ● Ready for Trial
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

