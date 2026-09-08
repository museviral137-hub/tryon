import React, { useState } from 'react';
import { ShopSettings, AIUsage, User, NavTab } from '../../types';
import { LEGAL_POLICIES, LEGAL_CONFIG } from '../../constants/legal';
import {
  Store,
  Sliders,
  RotateCcw,
  Sparkles,
  Check,
  Shield,
  Info,
  Coins,
  LogOut,
  User as UserIcon,
  FileText,
  Camera,
  Trash2,
  Headphones,
  Cookie,
  ChevronRight,
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface SettingsViewProps {
  settings: ShopSettings;
  aiUsage?: AIUsage;
  currentUser?: User | null;
  onUpdateSettings: (updated: ShopSettings) => void;
  onResetData: () => void;
  onTopUpCredits?: () => void;
  onLogout?: () => void;
  onNavigate?: (tab: NavTab) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  aiUsage,
  currentUser,
  onUpdateSettings,
  onResetData,
  onTopUpCredits,
  onLogout,
  onNavigate,
  onShowToast,
}) => {
  const [shopName, setShopName] = useState(settings.shopName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address || '');
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '₹');
  const [productPrefix, setProductPrefix] = useState(settings.productPrefix);
  const [customerPrefix, setCustomerPrefix] = useState(settings.customerPrefix);
  const [watermark, setWatermark] = useState(settings.watermarkEnabled);
  const [autoSaveHistory, setAutoSaveHistory] = useState(settings.autoSaveHistory);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ShopSettings = {
      ...settings,
      shopName: shopName.trim() || 'VestiAI Boutique',
      phone: phone.trim(),
      address: address.trim() || undefined,
      currencySymbol: currencySymbol || '₹',
      productPrefix: productPrefix.trim().toUpperCase() || 'J',
      customerPrefix: customerPrefix.trim().toUpperCase() || 'C',
      watermarkEnabled: watermark,
      autoSaveHistory,
    };
    onUpdateSettings(updated);
    onShowToast('Settings Saved', 'Your shop configuration has been updated.', 'success');
  };

  const remainingCredits = aiUsage ? aiUsage.remainingCredits : 0;
  const totalCredits = aiUsage ? aiUsage.totalCredits : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-neutral-900">
            Shop Settings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Configure shop branding, SKU prefixes, and AI trial room preferences.
          </p>
        </div>

        {currentUser && (
          <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-2xl border border-neutral-200">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0 pr-2">
              <span className="text-xs font-bold text-neutral-900 block truncate">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                {currentUser.role}
              </span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* AI Credits Card */}
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-3xl p-5 sm:p-6 border border-neutral-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
              <Coins className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">
                AI Credits
              </h2>
              <p className="text-xs text-neutral-400">
                Current Balance
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="font-display font-black text-2xl text-amber-400">
              {remainingCredits}
            </span>
            <span className="text-xs text-neutral-400 font-bold"> Credits</span>
          </div>
        </div>

        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${Math.round((remainingCredits / Math.max(totalCredits, 1)) * 100)}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
          <span className="text-xs text-neutral-400">
            Total Allocated: <strong>{totalCredits} Credits</strong>
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigate?.('credit-history')}
              className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-white text-xs font-semibold transition-all cursor-pointer border border-white/10"
            >
              View Credit History
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('upgrade')}
              className="flex-1 sm:flex-initial py-2 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-98 text-neutral-950 text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade Credits</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Boutique Profile */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Store className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-neutral-900">
                Boutique Profile
              </h2>
              <p className="text-xs text-neutral-500">
                Printed on downloaded customer cards and WhatsApp messages
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Shop / Boutique Name
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Saree Sangam Boutique"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Shop WhatsApp / Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Shop Location / Address (Optional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 12, Commercial Street, Bangalore"
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Currency Symbol
              </label>
              <select
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="AED">AED (Dirham)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product ID Conventions */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4 text-blue-700" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-neutral-900">
                Product & Customer ID Format
              </h2>
              <p className="text-xs text-neutral-500">
                Prefix used for automatic short-code generation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Garment SKU / Product Prefix
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={productPrefix}
                  onChange={(e) => setProductPrefix(e.target.value.toUpperCase())}
                  className="w-24 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-center font-mono font-bold text-sm text-neutral-900 outline-hidden focus:bg-white focus:border-emerald-500"
                />
                <span className="text-xs text-neutral-500">
                  Generates {productPrefix}001, {productPrefix}002...
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Customer Profile ID Prefix
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={3}
                  value={customerPrefix}
                  onChange={(e) => setCustomerPrefix(e.target.value.toUpperCase())}
                  className="w-24 px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-center font-mono font-bold text-sm text-neutral-900 outline-hidden focus:bg-white focus:border-emerald-500"
                />
                <span className="text-xs text-neutral-500">
                  Generates {customerPrefix}001, {customerPrefix}002...
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Room & Output Preferences */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-neutral-900">
                Fitting & Watermark
              </h2>
              <p className="text-xs text-neutral-500">
                Brand watermark on exported images
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/90 cursor-pointer hover:bg-neutral-100/70 transition-colors">
              <div>
                <span className="font-bold text-xs sm:text-sm text-neutral-900 block">
                  Add Shop Branding Watermark
                </span>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  Overlays "{shopName}" on downloaded trial cards
                </span>
              </div>
              <input
                type="checkbox"
                checked={watermark}
                onChange={(e) => setWatermark(e.target.checked)}
                className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/90 cursor-pointer hover:bg-neutral-100/70 transition-colors">
              <div>
                <span className="font-bold text-xs sm:text-sm text-neutral-900 block">
                  Auto-Save Try-On Results
                </span>
                <span className="text-xs text-neutral-500 block mt-0.5">
                  Save all completed sessions directly to History
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSaveHistory}
                onChange={(e) => setAutoSaveHistory(e.target.checked)}
                className="w-5 h-5 rounded-md text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer"
              />
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </form>

      {/* Legal & Compliance Center Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-base text-neutral-900">
                Legal, Policies & Grievance Support
              </h3>
              <p className="text-xs text-neutral-500">
                Review compliance terms, privacy rights, refund guidelines, and AI safety disclaimers
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {LEGAL_POLICIES.map((policy) => {
            const getIcon = (iconName: string) => {
              switch (iconName) {
                case 'FileText': return <FileText className="w-4 h-4 text-emerald-700" />;
                case 'ShieldCheck': return <Shield className="w-4 h-4 text-emerald-700" />;
                case 'RotateCcw': return <RotateCcw className="w-4 h-4 text-emerald-700" />;
                case 'Sparkles': return <Sparkles className="w-4 h-4 text-emerald-700" />;
                case 'Camera': return <Camera className="w-4 h-4 text-emerald-700" />;
                case 'Cookie': return <Cookie className="w-4 h-4 text-emerald-700" />;
                case 'Trash2': return <Trash2 className="w-4 h-4 text-emerald-700" />;
                case 'Headphones': return <Headphones className="w-4 h-4 text-emerald-700" />;
                default: return <FileText className="w-4 h-4 text-emerald-700" />;
              }
            };

            return (
              <button
                key={policy.id}
                type="button"
                onClick={() => onNavigate?.(policy.tab as NavTab)}
                className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200/90 hover:border-emerald-400 bg-neutral-50/60 hover:bg-emerald-50/40 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100/70 group-hover:bg-emerald-200/80 flex items-center justify-center shrink-0 transition-colors">
                    {getIcon(policy.iconName)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-neutral-900 group-hover:text-emerald-900 block truncate">
                      {policy.title}
                    </span>
                    <span className="text-[11px] text-neutral-500 block truncate">
                      {policy.shortDescription}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>

        <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-neutral-600">
            <span>Need grievance support or have a data deletion inquiry? </span>
            <span className="font-semibold text-neutral-900">{LEGAL_CONFIG.SUPPORT_EMAIL}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('contact-support')}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Contact Desk</span>
          </button>
        </div>
      </div>

      {/* Customer Privacy & Data Security Info */}
      <div className="bg-emerald-50/70 rounded-3xl p-5 sm:p-6 border border-emerald-200 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-700" />
          <h3 className="font-display font-bold text-sm text-emerald-950">
            Customer Privacy & Photo Retention
          </h3>
        </div>
        <p className="text-xs text-emerald-900/80 leading-relaxed">
          Customer photos are processed strictly for in-store virtual trial visualization with explicit consent. Customer profiles and photos can be deleted at any time from the <strong>Customers</strong> view upon customer request.
        </p>
      </div>

      {/* About & Demo Data Reset Section */}
      <div className="bg-neutral-50 rounded-3xl p-5 sm:p-6 border border-neutral-200/90 space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-neutral-500" />
          <h3 className="font-display font-bold text-sm text-neutral-900">
            About VestiAI Virtual Trial Room MVP
          </h3>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          VestiAI is a mobile-first AI virtual fitting room engineered for local boutique shopkeepers and retail counters. Built with instant SKU detection, multi-look customer sessions, and direct WhatsApp sharing.
        </p>

        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-neutral-900 block">Demo Mock Data</span>
            <span className="text-[11px] text-neutral-500">
              Restore default garments (J001–J006) and sample customers
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="py-2 px-3 rounded-xl border border-neutral-300 hover:bg-neutral-200 text-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset All Mock Data?"
        message="This will reset your Garment Library, Customer Profiles, and Try-On History back to default sample state. Any custom items created in this session will be replaced."
        confirmText="Reset Everything"
        isDestructive
        onConfirm={() => {
          onResetData();
          setShowResetConfirm(false);
          onShowToast('Data Reset', 'Demo garments and customer profiles restored.', 'info');
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Logout Confirmation */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Sign Out of Shop Account?"
        message="You will need to sign in again to access the VestiAI Trial Room."
        confirmText="Log Out"
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onLogout?.();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
