import React from 'react';
import { NavTab, ShopSettings } from '../../types';
import { Sparkles, Search, SlidersHorizontal } from 'lucide-react';

interface MobileHeaderProps {
  currentTab: NavTab;
  settings: ShopSettings;
  onNavigate: (tab: NavTab) => void;
  onOpenSearch?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  settings,
  onNavigate,
  onOpenSearch,
}) => {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
      {/* Brand logo & Shop name */}
      <div 
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2.5 cursor-pointer active:opacity-80 transition-opacity"
      >
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shadow-emerald-600/30">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-black text-lg tracking-tight text-neutral-900 leading-none">
              Vesti<span className="text-emerald-600">AI</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Live
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 font-medium truncate max-w-[170px] leading-tight">
            {settings?.shopName || 'VestiAI Boutique'}
          </p>
        </div>
      </div>

      {/* Right actions: Quick Search & Settings */}
      <div className="flex items-center gap-1.5">
        {onOpenSearch && (
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className="p-2 rounded-xl text-neutral-600 hover:bg-neutral-100 active:scale-95 transition-all"
          aria-label="Settings"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
