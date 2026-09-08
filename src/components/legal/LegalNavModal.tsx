import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, FileText, RotateCcw, Sparkles, Camera, Cookie, Trash2, Headphones } from 'lucide-react';
import { LegalTab, NavTab } from '../../types';
import { LEGAL_CONFIG, LEGAL_POLICIES } from '../../constants/legal';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RefundPolicyPage } from './pages/RefundPolicyPage';
import { AiDisclaimerPage } from './pages/AiDisclaimerPage';
import { PhotoConsentPage } from './pages/PhotoConsentPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { DataDeletionPage } from './pages/DataDeletionPage';
import { ContactSupportPage } from './pages/ContactSupportPage';

interface LegalNavModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
  onNavigateToFullView?: (tab: NavTab) => void;
}

export const LegalNavModal: React.FC<LegalNavModalProps> = ({
  isOpen,
  initialTab = 'terms',
  onClose,
  onNavigateToFullView,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);

  if (!isOpen) return null;

  const handleNavigate = (tab: NavTab) => {
    const isLegalTab = LEGAL_POLICIES.some((p) => p.tab === tab);
    if (isLegalTab) {
      setActiveTab(tab as LegalTab);
    } else {
      onClose();
      onNavigateToFullView?.(tab);
    }
  };

  const renderPageContent = () => {
    switch (activeTab) {
      case 'terms':
        return <TermsPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'privacy':
        return <PrivacyPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'refund-policy':
        return <RefundPolicyPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'ai-disclaimer':
        return <AiDisclaimerPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'photo-consent':
        return <PhotoConsentPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'cookie-policy':
        return <CookiePolicyPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'data-deletion':
        return <DataDeletionPage onNavigate={handleNavigate} onBack={onClose} />;
      case 'contact-support':
        return <ContactSupportPage onNavigate={handleNavigate} onBack={onClose} />;
      default:
        return <TermsPage onNavigate={handleNavigate} onBack={onClose} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-neutral-900/70 backdrop-blur-xs overflow-y-auto animate-in fade-in">
      <div className="bg-neutral-100 rounded-3xl border border-neutral-300 shadow-2xl max-w-4xl w-full my-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-neutral-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              ⚖️
            </span>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-neutral-900">
                {LEGAL_CONFIG.APP_NAME} Legal & Privacy Center
              </h3>
              <p className="text-[11px] text-neutral-500">
                Official terms, consent guidelines, and data policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToFullView && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToFullView(activeTab);
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-700"
                title="Open as full page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Full Page</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {renderPageContent()}
        </div>
      </div>
    </div>
  );
};
