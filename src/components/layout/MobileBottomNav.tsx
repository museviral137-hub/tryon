import React, { useState } from 'react';
import { NavTab } from '../../types';
import {
  LayoutDashboard,
  Sparkles,
  Shirt,
  Users,
  MoreHorizontal,
  History,
  Settings,
  X,
  Coins,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileBottomNavProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  garmentCount: number;
  customerCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const handleTabClick = (tab: NavTab) => {
    setShowMoreMenu(false);
    onNavigate(tab);
  };

  return (
    <>
      {/* More Options Drawer / Backdrop for mobile */}
      <AnimatePresence>
        {showMoreMenu && (
          <div className="lg:hidden fixed inset-0 z-40">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMoreMenu(false)}
              className="absolute inset-0 bg-neutral-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="absolute bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] left-0 right-0 bg-white rounded-t-3xl p-5 border-t border-neutral-200 shadow-2xl z-10 max-w-lg mx-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  More Features
                </span>
                <button
                  onClick={() => setShowMoreMenu(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleTabClick('upgrade')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    currentTab === 'upgrade'
                      ? 'bg-amber-50 border-amber-300 text-amber-950 font-bold'
                      : 'bg-neutral-50/80 border-neutral-200 text-neutral-800 font-semibold hover:bg-neutral-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-neutral-950 flex items-center justify-center shadow-2xs font-bold shrink-0">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm leading-tight truncate">Upgrade</div>
                    <div className="text-[11px] text-neutral-500 font-normal">AI Trial credits</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('history')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    currentTab === 'history'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-neutral-50/80 border-neutral-200 text-neutral-800 font-semibold hover:bg-neutral-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-2xs border border-neutral-100 shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm leading-tight truncate">Try-On History</div>
                    <div className="text-[11px] text-neutral-400 font-normal">Past results</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('credit-history')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    currentTab === 'credit-history'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-neutral-50/80 border-neutral-200 text-neutral-800 font-semibold hover:bg-neutral-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-2xs border border-neutral-100 shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm leading-tight truncate">Credit Ledger</div>
                    <div className="text-[11px] text-neutral-400 font-normal">Usage & top-ups</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabClick('settings')}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                    currentTab === 'settings'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                      : 'bg-neutral-50/80 border-neutral-200 text-neutral-800 font-semibold hover:bg-neutral-100'
                  }`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-2xs border border-neutral-100 shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm leading-tight truncate">Shop Settings</div>
                    <div className="text-[11px] text-neutral-400 font-normal">IDs & profile</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-neutral-200/90 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0.5rem))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Home */}
          <button
            type="button"
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              currentTab === 'dashboard'
                ? 'text-emerald-700 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">Home</span>
          </button>

          {/* Garments */}
          <button
            type="button"
            onClick={() => handleTabClick('garments')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              currentTab === 'garments'
                ? 'text-emerald-700 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Shirt className={`w-5 h-5 ${currentTab === 'garments' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">Garments</span>
          </button>

          {/* Trial Room (Center Featured Action) */}
          <button
            type="button"
            onClick={() => handleTabClick('trial-room')}
            className="flex flex-col items-center justify-center -mt-4.5 px-1.5 flex-1 group active:scale-95 transition-transform"
          >
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-700/25 border-2 border-white transition-all shrink-0 ${
                currentTab === 'trial-room'
                  ? 'bg-emerald-600 text-white scale-105 ring-2 ring-emerald-400/40'
                  : 'bg-neutral-900 text-emerald-400 group-hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <span
              className={`text-[10.5px] mt-1 font-bold leading-none tracking-tight ${
                currentTab === 'trial-room' ? 'text-emerald-700' : 'text-neutral-900'
              }`}
            >
              Trial Room
            </span>
          </button>

          {/* Customers */}
          <button
            type="button"
            onClick={() => handleTabClick('customers')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              currentTab === 'customers'
                ? 'text-emerald-700 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Users className={`w-5 h-5 ${currentTab === 'customers' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">Customers</span>
          </button>

          {/* More */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
              currentTab === 'history' || currentTab === 'settings' || showMoreMenu
                ? 'text-emerald-700 font-bold'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <MoreHorizontal
              className={`w-5 h-5 ${
                currentTab === 'history' || currentTab === 'settings' || showMoreMenu
                  ? 'stroke-[2.5]'
                  : 'stroke-2'
              }`}
            />
            <span className="text-[10px] mt-1 leading-none tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
