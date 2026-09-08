import React from 'react';
import { ArrowLeft, Calendar, Shield, ExternalLink, Sparkles, ChevronRight, FileText, RotateCcw, Camera, Cookie, Trash2, Headphones } from 'lucide-react';
import { LEGAL_CONFIG, LEGAL_POLICIES, PolicyMeta } from '../../constants/legal';
import { LegalTab, NavTab } from '../../types';

interface LegalPageLayoutProps {
  currentTab: LegalTab;
  title: string;
  shortDescription: string;
  lastUpdated?: string;
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
  badge?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  currentTab,
  title,
  shortDescription,
  lastUpdated = LEGAL_CONFIG.LAST_UPDATED_DATE,
  onNavigate,
  onBack,
  badge,
  headerAction,
  children,
}) => {
  const currentMeta = LEGAL_POLICIES.find((p) => p.tab === currentTab);
  const otherPolicies = LEGAL_POLICIES.filter((p) => p.tab !== currentTab);

  const getPolicyIcon = (name: string) => {
    switch (name) {
      case 'FileText':
        return <FileText className="w-4 h-4 text-neutral-600" />;
      case 'ShieldCheck':
        return <Shield className="w-4 h-4 text-emerald-600" />;
      case 'RotateCcw':
        return <RotateCcw className="w-4 h-4 text-blue-600" />;
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'Camera':
        return <Camera className="w-4 h-4 text-teal-600" />;
      case 'Cookie':
        return <Cookie className="w-4 h-4 text-amber-600" />;
      case 'Trash2':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'Headphones':
        return <Headphones className="w-4 h-4 text-indigo-600" />;
      default:
        return <FileText className="w-4 h-4 text-neutral-600" />;
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onNavigate('settings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 active:scale-98 transition-all shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-neutral-500 overflow-hidden">
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="hover:text-neutral-900 font-medium transition-colors"
          >
            Settings
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="font-semibold text-neutral-800 truncate">
            {currentMeta?.category || 'Legal & Support'}
          </span>
        </div>
      </div>

      {/* Main Document Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {/* Header Banner */}
        <div className="p-5 sm:p-8 bg-gradient-to-b from-neutral-50 to-white border-b border-neutral-100 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 text-white font-mono font-bold text-[11px] uppercase tracking-wider">
                {currentMeta?.category || 'Official Document'}
              </span>
              {badge && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px]">
                  {badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-neutral-400" />
              <span>Last updated: {lastUpdated}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
              {shortDescription}
            </p>
          </div>

          {headerAction && <div className="pt-2">{headerAction}</div>}
        </div>

        {/* Document Content */}
        <div className="p-5 sm:p-8 space-y-6 sm:space-y-8">
          {children}
        </div>

        {/* Footer & Notice within Document */}
        <div className="p-5 sm:p-6 bg-neutral-50 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            <span>Applicable to {LEGAL_CONFIG.APP_NAME} SaaS Services • {LEGAL_CONFIG.BUSINESS_LEGAL_NAME}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('contact-support')}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Contact Support
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="font-bold text-neutral-700 hover:text-neutral-900 hover:underline"
            >
              Shop Settings
            </button>
          </div>
        </div>
      </div>

      {/* Related Policies Navigation Section */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base text-neutral-900">
              Related Policies & Information
            </h3>
            <p className="text-xs text-neutral-500">
              Review other legal, privacy, and support terms for {LEGAL_CONFIG.APP_NAME}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {otherPolicies.slice(0, 6).map((policy) => (
            <button
              key={policy.id}
              type="button"
              onClick={() => onNavigate(policy.tab as NavTab)}
              className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50 hover:bg-emerald-50/50 border border-neutral-200/80 hover:border-emerald-200 text-left transition-all group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-white border border-neutral-200 shrink-0 group-hover:scale-105 transition-transform">
                {getPolicyIcon(policy.iconName)}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 truncate group-hover:text-emerald-900">
                  {policy.title}
                </h4>
                <p className="text-[11px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                  {policy.shortDescription}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
