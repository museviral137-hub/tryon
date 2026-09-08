import React from 'react';
import { NavTab, ShopSettings, AIUsage } from '../../types';
import {
  LayoutDashboard,
  Sparkles,
  Shirt,
  Users,
  History,
  Settings,
  Store,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  currentTab: NavTab;
  settings: ShopSettings;
  aiUsage?: AIUsage | null;
  garmentCount: number;
  customerCount: number;
  tryOnCount: number;
  onNavigate: (tab: NavTab) => void;
  onQuickTryOn: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  settings,
  aiUsage,
  garmentCount,
  customerCount,
  tryOnCount,
  onNavigate,
  onQuickTryOn,
}) => {
  const remainingCredits = aiUsage?.remainingCredits ?? 0;

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'trial-room' as NavTab,
      label: 'Trial Room',
      icon: Sparkles,
      badge: 'Main',
      highlight: true,
    },
    {
      id: 'garments' as NavTab,
      label: 'Garments',
      icon: Shirt,
      badge: garmentCount,
    },
    {
      id: 'customers' as NavTab,
      label: 'Customers',
      icon: Users,
      badge: customerCount,
    },
    {
      id: 'history' as NavTab,
      label: 'Try-On History',
      icon: History,
      badge: tryOnCount,
    },
    {
      id: 'upgrade' as NavTab,
      label: 'Upgrade',
      icon: Coins,
      badge: `${remainingCredits} Left`,
      highlight: remainingCredits < 10,
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-neutral-200/80 h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
        <div 
          onClick={() => onNavigate('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-extrabold text-xl tracking-tight text-neutral-900">
                Vesti<span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Shop Edition
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-medium">AI Trial Room for Your Shop</p>
          </div>
        </div>
      </div>

      {/* Quick Try-On Banner Button */}
      <div className="p-4">
        <button
          type="button"
          onClick={onQuickTryOn}
          className="w-full relative overflow-hidden group p-3.5 rounded-2xl bg-neutral-900 text-white flex items-center justify-between shadow-lg shadow-neutral-950/15 hover:bg-neutral-800 active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-neutral-100 leading-tight">Instant Try-On</div>
              <div className="text-[10px] text-neutral-400">Match by Product ID</div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-emerald-600 stroke-[2.5]' : 'text-neutral-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== null && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : item.highlight
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Shop Profile Box */}
      <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 space-y-2">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-neutral-200/70 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Store className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-neutral-900 truncate leading-tight">
              {settings?.shopName || 'VestiAI Boutique'}
            </h4>
            <p className="text-[11px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600 inline" />
              {settings?.ownerName || 'Staff'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
          <button
            type="button"
            onClick={() => onNavigate('terms')}
            className="hover:text-neutral-700 hover:underline cursor-pointer"
          >
            Terms
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate('privacy')}
            className="hover:text-neutral-700 hover:underline cursor-pointer"
          >
            Privacy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate('contact-support')}
            className="hover:text-neutral-700 hover:underline cursor-pointer"
          >
            Support
          </button>
        </div>
      </div>
    </aside>
  );
};
