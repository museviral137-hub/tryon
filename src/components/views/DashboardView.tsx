import React from 'react';
import { Garment, Customer, TryOnResult, ShopSettings, AIUsage } from '../../types';
import {
  Sparkles,
  Shirt,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight,
  Coins,
} from 'lucide-react';
import { formatPrice } from '../../utils/currency';

interface DashboardViewProps {
  settings: ShopSettings;
  garments: Garment[];
  customers: Customer[];
  tryOns: TryOnResult[];
  aiUsage?: AIUsage;
  onStartTryOn: (garment?: Garment, customer?: Customer) => void;
  onOpenAddGarment: () => void;
  onOpenAddCustomer: () => void;
  onViewAllGarments: () => void;
  onViewAllCustomers: () => void;
  onViewAllHistory: () => void;
  onViewTryOnResult: (result: TryOnResult) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  garments,
  customers,
  tryOns,
  aiUsage,
  onStartTryOn,
  onOpenAddGarment,
  onOpenAddCustomer,
  onViewAllGarments,
  onViewAllCustomers,
  onViewAllHistory,
  onViewTryOnResult,
}) => {
  // Compute greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Compute stats
  const totalGarments = garments.length;
  const totalCustomers = customers.length;

  // Try-ons today
  const todayStr = new Date().toDateString();
  const tryOnsToday = tryOns.filter(
    (t) => new Date(t.createdAt).toDateString() === todayStr
  ).length;

  const creditsRemaining = aiUsage ? aiUsage.remainingCredits : 0;
  const totalCredits = aiUsage ? aiUsage.totalCredits : 0;
  const creditsPercentage = totalCredits > 0 ? Math.round((creditsRemaining / totalCredits) * 100) : 0;

  // Recently used or popular garments (sorted by tryOnCount or recent)
  const recentGarments = [...garments]
    .sort((a, b) => (b.tryOnCount || 0) - (a.tryOnCount || 0))
    .slice(0, 6);

  // Recent try on activities
  const recentActivities = tryOns.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-neutral-900 to-neutral-950 text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-neutral-800">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Virtual Trial Room Active</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white">
            {greeting}, {settings?.shopName || 'Boutique'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium">
            Your boutique AI fitting room. Ready for standing customer trials with instant WhatsApp sharing.
          </p>
        </div>

        {/* Big CTA on Welcome banner */}
        <button
          type="button"
          onClick={() => onStartTryOn()}
          className="inline-flex items-center justify-center gap-2 py-4 px-7 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-neutral-950 font-display font-black text-base shadow-lg shadow-emerald-500/30 transition-all shrink-0 cursor-pointer group"
        >
          <Sparkles className="w-5 h-5 text-neutral-950 group-hover:rotate-12 transition-transform" />
          <span>New AI Try-On</span>
        </button>
      </div>

      {/* 4 Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Try-Ons Today */}
        <div 
          onClick={onViewAllHistory}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs hover:border-emerald-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">Try-Ons Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl sm:text-3xl text-emerald-700">
              {tryOnsToday}
            </span>
            <span className="text-[11px] font-bold text-neutral-400">Fits Today</span>
          </div>
        </div>

        {/* Metric 2: AI Credits Remaining */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">AI Credits</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              {creditsRemaining}
            </span>
            <span className="text-xs font-bold text-neutral-400">/ {totalCredits}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${
                creditsPercentage > 30 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${creditsPercentage}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Total Garments */}
        <div 
          onClick={onViewAllGarments}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs hover:border-emerald-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">Saved Garments</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              {totalGarments}
            </span>
            <span className="text-[11px] font-bold text-emerald-600">Active Stock</span>
          </div>
        </div>

        {/* Metric 4: Customers */}
        <div 
          onClick={onViewAllCustomers}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200/90 shadow-xs hover:border-emerald-300 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">Customers</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-black text-2xl sm:text-3xl text-neutral-900">
              {totalCustomers}
            </span>
            <span className="text-[11px] font-bold text-purple-600">Profiles</span>
          </div>
        </div>
      </div>

      {/* Quick Actions (Full-width buttons on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onStartTryOn()}
          className="p-4 sm:p-5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-between shadow-md active:scale-98 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm sm:text-base text-white">Start New Try-On</h3>
              <p className="text-xs text-neutral-400">Pick customer & type SKU (e.g. J002)</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          type="button"
          onClick={onOpenAddGarment}
          className="p-4 sm:p-5 rounded-2xl bg-white hover:bg-emerald-50/40 border border-neutral-200 text-neutral-900 flex items-center justify-between shadow-xs active:scale-98 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm sm:text-base text-neutral-900">Add New Garment</h3>
              <p className="text-xs text-neutral-500">Auto-assigns next SKU / Product ID</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Popular / Recently Used Garments */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-black text-base sm:text-lg text-neutral-900">
              Popular Saved Garments
            </h2>
            <p className="text-xs text-neutral-500">
              Frequently chosen pieces — tap "Try On" to load immediately
            </p>
          </div>
          <button
            type="button"
            onClick={onViewAllGarments}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({garments.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive Horizontal scroll on mobile / Grid on desktop */}
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {recentGarments.map((g) => (
            <div
              key={g.id}
              className="w-44 sm:w-auto shrink-0 flex flex-col bg-neutral-50/70 rounded-2xl p-2.5 border border-neutral-200 hover:border-emerald-300 hover:bg-white transition-all group"
            >
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-neutral-200 mb-2 border border-neutral-200 flex items-center justify-center">
                {g.imageUrl ? (
                  <img
                    src={g.imageUrl}
                    alt={g.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <span className="text-2xl text-neutral-400">👗</span>
                )}
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-neutral-950/80 text-white font-mono text-[10px] font-bold">
                  {g.productId}
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-neutral-900 truncate leading-snug">
                    {g.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-0.5">
                    <span className="font-extrabold text-neutral-900">
                      {formatPrice(g.price, settings.currencySymbol)}
                    </span>
                    <span>{g.category}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartTryOn(g)}
                  className="mt-2.5 w-full py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Try On</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Feed */}
      {recentActivities.length > 0 && (
        <div className="bg-white rounded-3xl border border-neutral-200/90 p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-neutral-900">
                Recent Virtual Try-Ons
              </h2>
              <p className="text-xs text-neutral-500">
                Latest customer previews generated at your shop
              </p>
            </div>
            <button
              type="button"
              onClick={onViewAllHistory}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {recentActivities.map((act) => {
              const status = act.status || 'Completed';
              return (
                <div
                  key={act.id}
                  onClick={() => onViewTryOnResult(act)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 hover:bg-emerald-50/40 hover:border-emerald-200 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border border-neutral-300 flex items-center justify-center">
                      {status === 'Completed' && act.resultImageUrl ? (
                        <img
                          src={act.resultImageUrl}
                          alt="Result thumbnail"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : status === 'Processing' ? (
                        <Clock className="w-5 h-5 text-amber-600 animate-spin" />
                      ) : status === 'Failed' ? (
                        <span className="text-sm font-bold text-rose-600">✕</span>
                      ) : (
                        <span className="text-sm">✨</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
                          {act.customerName}
                        </h4>
                        <span
                          className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                            status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'Processing'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 truncate">
                        {act.garmentName} • <span className="font-mono font-bold text-neutral-800">{act.garmentProductId}</span>
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-neutral-200 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    View
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
