import React from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';

interface TermsPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate, onBack }) => {
  return (
    <LegalPageLayout
      currentTab="terms"
      title="Terms & Conditions"
      shortDescription={`These Terms & Conditions govern your access to and use of the ${LEGAL_CONFIG.APP_NAME} boutique management and AI virtual trial room platform.`}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <LegalNotice type="info" title="Important Overview for Boutique Owners & Staff">
        By registering a shop account, signing in, or using the {LEGAL_CONFIG.APP_NAME} platform, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
      </LegalNotice>

      {/* 1. Acceptance of Terms */}
      <LegalSection number="1" title="Acceptance of Terms">
        <p>
          These Terms & Conditions ("Terms") constitute a legally binding agreement between you (the "Boutique Owner", "Shop Administrator", or "User") and {LEGAL_CONFIG.BUSINESS_LEGAL_NAME} ("Company", "we", "us", or "our").
        </p>
        <p>
          If you are using {LEGAL_CONFIG.APP_NAME} on behalf of a boutique, retail store, or business entity, you represent and warrant that you have the requisite authority to bind that entity to these Terms. If you do not agree with any part of these Terms, you must discontinue use of the platform immediately.
        </p>
      </LegalSection>

      {/* 2. Account Registration & Eligibility */}
      <LegalSection number="2" title="Account Registration & Eligibility">
        <p>
          To access the virtual fitting room and shop catalog features, you must register for a shop account by providing accurate, complete, and up-to-date business information, including your full name, boutique name, registered email address, and contact details.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Eligibility:</strong> You must be at least 18 years of age or the age of legal majority in your jurisdiction to create an account.</li>
          <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials and preventing unauthorized access to your boutique dashboard.</li>
          <li><strong>Account Activity:</strong> All activities occurring under your shop account are your sole responsibility. You must promptly notify us of any security breach.</li>
        </ul>
      </LegalSection>

      {/* 3. Boutique Responsibilities & Customer Consent */}
      <LegalSection number="3" title="Boutique Responsibilities & Customer Photo Consent">
        <p>
          As a boutique operator using {LEGAL_CONFIG.APP_NAME} to serve end customers, you acknowledge and agree to the following obligations:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Explicit Customer Permission:</strong> Before uploading or capturing any photograph of an end-customer for virtual try-on generation, you must obtain appropriate permission and consent from the customer.</li>
          <li><strong>Lawful Use:</strong> You agree not to upload photographs of minors without verified parental or guardian consent.</li>
          <li><strong>Accuracy of Customer Data:</strong> You are solely responsible for ensuring the accuracy and lawfulness of customer names, phone numbers, and notes stored in your shop database.</li>
          <li><strong>Customer Deletion Requests:</strong> You agree to honor any customer request to delete their profile or photograph in a prompt manner via the Customers management view.</li>
        </ul>
      </LegalSection>

      {/* 4. Virtual Try-On Usage & AI Results */}
      <LegalSection number="4" title="Virtual Try-On & AI-Generated Visuals">
        <p>
          {LEGAL_CONFIG.APP_NAME} provides computer-vision and AI-synthesized fitting visual representations of garments on customer photos.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Visual Approximation Only:</strong> Virtual try-on outputs are computer-generated approximations intended to assist shoppers in visualizing garment styles, colors, and cuts. They do not guarantee physical garment fit, exact fabric drape, elasticity, or physical sizing.</li>
          <li><strong>Garment Suitability:</strong> Certain unstitched, loose, or complex drapes (e.g. traditional sarees or loose fabrics) may not be fully supported by automated stitching engines.</li>
          <li><strong>Professional Staff Judgment:</strong> Boutique staff and customers are encouraged to use physical measurements and professional tailoring judgment alongside AI previews.</li>
        </ul>
      </LegalSection>

      {/* 5. AI Credits, Usage & Billing */}
      <LegalSection number="5" title="AI Credits & Billing">
        <p>
          Virtual try-on generation requires AI credits. Credit allocation and balances are maintained within your boutique account settings.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Credit Deductions:</strong> Each generated virtual try-on consumes 1 credit from your shop's balance upon initiation of the synthesis task.</li>
          <li><strong>Automatic Refund on System Failure:</strong> If a generation fails due to a server error or AI processing crash, the consumed credit is automatically restored to your boutique credit balance.</li>
          <li><strong>Credit Expiration & Top-ups:</strong> AI credits purchased or allotted are subject to plan terms and are non-transferable between unrelated shop accounts.</li>
        </ul>
      </LegalSection>

      {/* 6. Prohibited Activities */}
      <LegalSection number="6" title="Prohibited Activities">
        <p>You agree not to engage in any of the following prohibited behaviors:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Uploading unlawful, defamatory, obscene, pornographic, or non-consensual imagery.</li>
          <li>Attempting to probe, scan, or reverse-engineer the API, neural networks, or backend services.</li>
          <li>Reselling raw API access or virtual try-on processing to third-party software without explicit authorization.</li>
          <li>Interfering with security controls or creating unauthorized automated scrapers.</li>
        </ul>
      </LegalSection>

      {/* 7. Third-Party Services & Infrastructure */}
      <LegalSection number="7" title="Third-Party Services & Infrastructure">
        <p>
          The service operates using secure cloud database hosting (such as Supabase) and specialized third-party artificial intelligence inference APIs. While we implement robust safeguards, we do not control third-party infrastructure outages or latency.
        </p>
      </LegalSection>

      {/* 8. Limitation of Liability */}
      <LegalSection number="8" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable law, {LEGAL_CONFIG.BUSINESS_LEGAL_NAME}, its officers, directors, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, retail sales, customer goodwill, or data, arising out of your use of or inability to use the platform.
        </p>
      </LegalSection>

      {/* 9. Modifications & Termination */}
      <LegalSection number="9" title="Changes to Terms & Termination">
        <p>
          We reserve the right to revise or update these Terms periodically. Continued use of {LEGAL_CONFIG.APP_NAME} following any modifications indicates your acceptance of the updated Terms. We may suspend or terminate your account if these Terms are breached.
        </p>
      </LegalSection>

      {/* 10. Governing Law & Contact */}
      <LegalSection number="10" title="Governing Law & Jurisdiction">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of {LEGAL_CONFIG.GOVERNING_JURISDICTION}, without regard to conflict of law principles.
        </p>
        <p>
          For questions regarding these Terms & Conditions, contact our support team at:
        </p>
        <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono">
          <p>Email: {LEGAL_CONFIG.SUPPORT_EMAIL}</p>
          <p>Entity: {LEGAL_CONFIG.BUSINESS_LEGAL_NAME}</p>
          <p>Address: {LEGAL_CONFIG.BUSINESS_ADDRESS}</p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
};
