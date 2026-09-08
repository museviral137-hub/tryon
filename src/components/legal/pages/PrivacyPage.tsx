import React from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';

interface PrivacyPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
}

export const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate, onBack }) => {
  return (
    <LegalPageLayout
      currentTab="privacy"
      title="Privacy Policy"
      shortDescription={`This Privacy Policy describes how ${LEGAL_CONFIG.APP_NAME} collects, handles, stores, and protects boutique account information, customer records, and uploaded photographs.`}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <LegalNotice type="highlight" title="Our Commitment to Data Privacy">
        We respect the privacy of boutique owners, staff, and their shoppers. Customer photos and contact details are processed strictly to deliver in-store virtual try-on previews and are never sold to third parties.
      </LegalNotice>

      {/* 1. Information We Collect */}
      <LegalSection number="1" title="Information We Collect">
        <p>
          We collect information necessary to provide the {LEGAL_CONFIG.APP_NAME} boutique management and AI fitting services:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Boutique Account Information:</strong> Owner/manager name, boutique name, email address, password hash, phone number, and physical boutique address.
          </li>
          <li>
            <strong>Customer Records:</strong> Customer names, phone/WhatsApp numbers, gender category preferences, notes, and consent status entered by boutique staff.
          </li>
          <li>
            <strong>Customer Photographs:</strong> Portrait and full-body customer images uploaded or captured via device camera for virtual try-on processing.
          </li>
          <li>
            <strong>Garment & Catalog Data:</strong> Product SKUs, garment names, categories (e.g. Sarees, Dresses, Kurtas), retail prices, and product imagery.
          </li>
          <li>
            <strong>Try-On Results & Generation History:</strong> Synthesis timestamps, output image URLs, generation statuses (Completed, Processing, Failed), and session links.
          </li>
          <li>
            <strong>Usage & Credit Data:</strong> AI credit balances, deduction logs, and transaction timestamps.
          </li>
        </ul>
      </LegalSection>

      {/* 2. How We Use Collected Information */}
      <LegalSection number="2" title="How We Use Information">
        <p>Collected data is used solely for legitimate business operations:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>To authenticate and manage boutique accounts.</li>
          <li>To generate AI virtual try-on fitting visuals by combining garment photos with customer portraits.</li>
          <li>To maintain your store's persistent product catalog and customer trial history.</li>
          <li>To format and generate branded trial cards for WhatsApp sharing and customer download.</li>
          <li>To monitor AI credit usage, prevent fraudulent activity, and ensure service reliability.</li>
        </ul>
      </LegalSection>

      {/* 3. Data Storage, Security & AI Processing */}
      <LegalSection number="3" title="Data Storage, AI Processing & Security">
        <p>
          <strong>Database & Storage:</strong> Application data and images are securely stored in managed cloud databases and object storage with row-level security (RLS) isolating each boutique's records from other shops.
        </p>
        <p>
          <strong>AI Model Inference:</strong> When a try-on is initiated, the customer photo and garment image are transmitted securely via encrypted channels (TLS/HTTPS) to specialized AI generation endpoints solely for synthesizing the fitting result.
        </p>
        <p>
          <strong>Security Measures:</strong> We employ administrative, technical, and physical safeguards designed to protect personal information against unauthorized access, loss, or misuse.
        </p>
      </LegalSection>

      {/* 4. Customer Photograph Handling */}
      <LegalSection number="4" title="Customer Photograph Handling & Retention">
        <p>
          Customer photographs are sensitive assets. {LEGAL_CONFIG.APP_NAME} requires boutique staff to obtain explicit permission before capturing or uploading a customer's image.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Photographs are associated only with the specific boutique account that uploaded them.</li>
          <li>Photographs are retained as long as the customer profile remains active in the boutique database.</li>
          <li>Boutique staff can permanently delete any customer profile and associated photograph at any time via the Customers management view.</li>
        </ul>
      </LegalSection>

      {/* 5. User Rights & Data Deletion */}
      <LegalSection number="5" title="User Rights & Data Deletion Requests">
        <p>
          Boutique owners and their customers have the following rights regarding their data:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Access & Correction:</strong> You may review and update boutique settings, product catalogs, and customer records directly in the app.</li>
          <li><strong>Data Deletion:</strong> You can delete specific customer entries or request full boutique account deletion through our dedicated data deletion workflow.</li>
        </ul>
        <p className="pt-1">
          To learn more about purging customer or account records, view our{' '}
          <button
            type="button"
            onClick={() => onNavigate('data-deletion')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Data Deletion Policy
          </button>.
        </p>
      </LegalSection>

      {/* 6. Cookies & Browser Storage */}
      <LegalSection number="6" title="Cookies & Local Storage">
        <p>
          {LEGAL_CONFIG.APP_NAME} uses essential local browser storage and session cookies strictly for authentication persistence and UI preferences. For more details, review our{' '}
          <button
            type="button"
            onClick={() => onNavigate('cookie-policy')}
            className="text-emerald-700 font-bold hover:underline"
          >
            Cookie Policy
          </button>.
        </p>
      </LegalSection>

      {/* 7. Contact Information */}
      <LegalSection number="7" title="Privacy Contact & Inquiries">
        <p>
          If you have questions or concerns regarding this Privacy Policy or wish to exercise privacy rights, contact our Data Privacy officer at:
        </p>
        <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono">
          <p>Privacy Contact: {LEGAL_CONFIG.PRIVACY_CONTACT}</p>
          <p>Email: {LEGAL_CONFIG.SUPPORT_EMAIL}</p>
          <p>Company: {LEGAL_CONFIG.BUSINESS_LEGAL_NAME}</p>
          <p>Address: {LEGAL_CONFIG.BUSINESS_ADDRESS}</p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
};
