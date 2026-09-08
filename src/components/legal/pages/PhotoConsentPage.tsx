import React from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';
import { ShieldCheck, CheckCircle2, Trash2, Camera, Lock } from 'lucide-react';

interface PhotoConsentPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
}

export const PhotoConsentPage: React.FC<PhotoConsentPageProps> = ({ onNavigate, onBack }) => {
  return (
    <LegalPageLayout
      currentTab="photo-consent"
      title="Customer Photo Consent Policy"
      shortDescription="Mandatory protocols, permission guidelines, and data protection standards governing the capture, processing, and retention of customer photographs."
      onNavigate={onNavigate}
      onBack={onBack}
      badge="Mandatory Standard"
    >
      <LegalNotice type="highlight" title="Store Staff Notice: Obtain Permission Before Every Upload">
        Before capturing or uploading any customer photograph into {LEGAL_CONFIG.APP_NAME}, boutique staff must obtain clear verbal or written consent from the customer confirming their approval to process their photo for AI virtual try-on.
      </LegalNotice>

      {/* 1. Purpose of Photo Collection */}
      <LegalSection number="1" title="Why Customer Photos Are Collected">
        <p>
          Customer photographs are collected solely for the following in-store styling purposes:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To generate digital visual fittings showing boutique garments on the customer's photo.</li>
          <li>To enable multi-garment try-on comparisons within the boutique trial room.</li>
          <li>To generate downloadable or shareable WhatsApp trial cards when requested by the customer.</li>
        </ul>
      </LegalSection>

      {/* 2. Boutique Consent Obligations */}
      <LegalSection number="2" title="Boutique Consent Obligations & Checklist">
        <p>
          When using {LEGAL_CONFIG.APP_NAME} in your store, staff must adhere to the following consent principles:
        </p>
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-2.5">
          <div className="flex items-start gap-2 text-xs sm:text-sm text-neutral-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Inform the Customer:</strong> Explain that their photograph will be processed by AI software to visualize how selected garments look on them.</span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm text-neutral-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Confirm the In-App Consent Checkbox:</strong> Never bypass or automatically falsify the photo consent confirmation in the customer creation modal.</span>
          </div>
          <div className="flex items-start gap-2 text-xs sm:text-sm text-neutral-800 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No Unauthorized Third-Party Photos:</strong> Never upload photographs of individuals obtained without their knowledge or permission.</span>
          </div>
        </div>
      </LegalSection>

      {/* 3. Photo Processing & Technical Safeguards */}
      <LegalSection number="3" title="How Customer Photos Are Processed & Protected">
        <p>
          We implement rigorous safeguards to protect customer photographs:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Encrypted Transmission:</strong> Customer photos are transferred using industry-standard TLS encryption.</li>
          <li><strong>Isolated Boutique Storage:</strong> Photos are stored in secure cloud storage accessible only by authenticated staff of your boutique account.</li>
          <li><strong>No Public Broadcast:</strong> Customer photos are never indexed by public search engines or made publicly accessible without explicit boutique action.</li>
        </ul>
      </LegalSection>

      {/* 4. Customer Deletion & Revocation Rights */}
      <LegalSection number="4" title="Right to Revoke & Immediate Deletion">
        <p>
          Every customer has the right to withdraw their consent and request immediate removal of their photograph and fitting history:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>In-Store Deletion:</strong> Boutique staff can permanently delete a customer profile and all associated photos with one click in the <strong>Customers</strong> view.
          </li>
          <li>
            <strong>Direct Deletion Requests:</strong> Customers may also contact our platform privacy team at <strong>{LEGAL_CONFIG.SUPPORT_EMAIL}</strong> to request removal if they cannot reach the boutique directly.
          </li>
        </ul>
        <p className="pt-2">
          Review our step-by-step{' '}
          <button
            type="button"
            onClick={() => onNavigate('data-deletion')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Data Deletion Guide
          </button>{' '}
          for additional details.
        </p>
      </LegalSection>

      {/* 5. Contact */}
      <LegalSection number="5" title="Consent Compliance Support">
        <p>
          For assistance with customer privacy compliance or photo consent records, contact our privacy desk at <strong>{LEGAL_CONFIG.SUPPORT_EMAIL}</strong>.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
};
