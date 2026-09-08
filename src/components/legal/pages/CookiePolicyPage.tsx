import React from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';
import { Cookie, Database, Lock, Settings } from 'lucide-react';

interface CookiePolicyPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
}

export const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ onNavigate, onBack }) => {
  return (
    <LegalPageLayout
      currentTab="cookie-policy"
      title="Cookie Policy"
      shortDescription={`Information on how ${LEGAL_CONFIG.APP_NAME} utilizes browser storage and essential session tokens to deliver boutique software functionality.`}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <LegalNotice type="info" title="Essential Browser Storage Only">
        {LEGAL_CONFIG.APP_NAME} uses only strictly necessary browser storage and authentication session tokens to keep your shop logged in and maintain local catalog preferences. We do not use third-party advertising or cross-site tracking cookies.
      </LegalNotice>

      {/* 1. What Are Cookies and Local Storage */}
      <LegalSection number="1" title="What Are Cookies and Browser Local Storage?">
        <p>
          Cookies and HTML5 Local Storage are small data files stored on your computer or mobile device when you access a web application. They enable the platform to remember your active session, shop settings, and interface preferences across browser tabs and visits.
        </p>
      </LegalSection>

      {/* 2. Storage Technologies Used */}
      <LegalSection number="2" title="Storage Technologies Used in VestiAI">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-neutral-900">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Authentication Session Tokens</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Maintained by Supabase Auth (or secure session storage) to authenticate your shop staff and securely access your boutique records.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-neutral-900">
              <Settings className="w-4 h-4 text-purple-600" />
              <span>Boutique UI & Preferences</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Stores shop currency symbol, watermark toggles, product code prefix, and active trial room session state.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-neutral-900">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Local Offline Caching</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Provides temporary fallback cache so boutique staff can browse garments and customer lists without delay during intermittent connectivity.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-neutral-900">
              <Cookie className="w-4 h-4 text-amber-600" />
              <span>Zero Ad-Tracking Cookies</span>
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              We strictly do not deploy third-party advertising cookies, cross-domain behavioral tracking beacons, or commercial data brokers.
            </p>
          </div>
        </div>
      </LegalSection>

      {/* 3. Managing Browser Storage */}
      <LegalSection number="3" title="Managing & Clearing Browser Storage">
        <p>
          You can configure your browser to reject cookies or clear stored site data at any time via your browser settings:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Chrome / Edge:</strong> Settings → Privacy and Security → Clear Browsing Data / Site Data.</li>
          <li><strong>Safari:</strong> Settings → Safari → Clear History and Website Data.</li>
          <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data.</li>
        </ul>
        <p className="pt-1 text-xs text-neutral-500">
          <em>Note:</em> Clearing essential browser storage will sign you out of your shop session and require logging in again.
        </p>
      </LegalSection>

      {/* 4. Contact */}
      <LegalSection number="4" title="Questions Regarding Cookie Practices">
        <p>
          If you have questions about our use of storage mechanisms, contact our tech desk at <strong>{LEGAL_CONFIG.SUPPORT_EMAIL}</strong>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};
