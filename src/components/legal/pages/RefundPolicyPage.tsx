import React from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';

interface RefundPolicyPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
}

export const RefundPolicyPage: React.FC<RefundPolicyPageProps> = ({ onNavigate, onBack }) => {
  return (
    <LegalPageLayout
      currentTab="refund-policy"
      title="Refund & Cancellation Policy"
      shortDescription={`Clear and transparent guidelines regarding ${LEGAL_CONFIG.APP_NAME} AI credit purchases, automatic generation failure refunds, subscription cancellations, and billing support.`}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      <LegalNotice type="highlight" title="Automatic AI Credit Protection Built-In">
        Our trial room system includes automatic refund protection: if an AI generation task fails due to a server or processing timeout, the consumed credit is immediately returned to your shop balance with zero manual action required.
      </LegalNotice>

      {/* 1. AI Credits & Usage */}
      <LegalSection number="1" title="AI Credit System & Metering">
        <p>
          {LEGAL_CONFIG.APP_NAME} operates on an AI credit model where boutique accounts use credits to generate high-definition virtual fittings:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>Rate:</strong> 1 credit is consumed per initiated virtual try-on fitting preview.</li>
          <li><strong>Credit Allocation:</strong> New boutique accounts receive initial trial room credits upon registration. Additional credits may be topped up or allocated through boutique service tiers.</li>
          <li><strong>Non-Transferable:</strong> AI credits are assigned strictly to your registered boutique account and cannot be transferred to other shops.</li>
        </ul>
      </LegalSection>

      {/* 2. Generation Failures & Automatic Credit Refunds */}
      <LegalSection number="2" title="Failed Generations & Automatic Refunds">
        <p>
          We stand behind the reliability of our AI infrastructure. If an error occurs during virtual fitting generation:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>System & Server Errors:</strong> If the generation fails due to network interruptions, API timeouts, or unhandled server exceptions, the deducted credit is automatically refunded to your boutique balance.
          </li>
          <li>
            <strong>Immediate Availability:</strong> Refunded credits are available immediately to retry the trial with the same or an alternate garment.
          </li>
          <li>
            <strong>Failed Status in History:</strong> The failed attempt is marked with a red status badge in your Try-On History for full audit visibility.
          </li>
        </ul>
      </LegalSection>

      {/* 3. Non-Refundable Situations */}
      <LegalSection number="3" title="Non-Refundable Situations">
        <p>
          AI credits cover the computational GPU power required to synthesize complex garment visual fits. Because computational costs are incurred once rendering completes:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Subjective Dislike:</strong> Credits consumed for successfully rendered try-on results where the customer or boutique staff does not like the look, color, or style of the dress are non-refundable.
          </li>
          <li>
            <strong>Suboptimal Input Photos:</strong> Previews generated using blurry, heavily obstructed, or low-resolution customer photos that complete rendering are counted as consumed.
          </li>
          <li>
            <strong>Used Plan Credits:</strong> Credits that have already been expended on completed fittings cannot be converted to monetary cash refunds.
          </li>
        </ul>
      </LegalSection>

      {/* 4. Payment Failures & Duplicate Charges */}
      <LegalSection number="4" title="Payment Discrepancies & Duplicate Charges">
        <p>
          In the event of a billing discrepancy, duplicate transaction charge, or technical payment failure during a credit pack purchase:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            Please notify our billing support team at <strong>{LEGAL_CONFIG.SUPPORT_EMAIL}</strong> within 14 days of the transaction.
          </li>
          <li>
            Provide your boutique name, registered email address, date of charge, and payment transaction reference ID.
          </li>
          <li>
            Verified duplicate charges or uncredited payments will be refunded to the original payment method within approximately <strong>[REFUND PROCESSING TIME (e.g., 5–7 business days)]</strong> depending on your bank or payment provider.
          </li>
        </ul>
      </LegalSection>

      {/* 5. Account Cancellation */}
      <LegalSection number="5" title="Boutique Account Cancellation">
        <p>
          You may cancel your boutique subscription or discontinue using the platform at any time. Upon cancellation:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>You retain access to your existing saved catalog and trial history until the end of your billing cycle.</li>
          <li>Unused promotional credits have no cash value and will expire upon account closure.</li>
        </ul>
      </LegalSection>

      {/* 6. Contact Support */}
      <LegalSection number="6" title="Billing & Refund Inquiries">
        <p>
          For any questions concerning credit balances, top-ups, or payment receipts, reach out to our team:
        </p>
        <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono">
          <p>Support Email: {LEGAL_CONFIG.SUPPORT_EMAIL}</p>
          <p>Support Hours: {LEGAL_CONFIG.SUPPORT_HOURS}</p>
          <p>Company: {LEGAL_CONFIG.BUSINESS_LEGAL_NAME}</p>
        </div>
      </LegalSection>
    </LegalPageLayout>
  );
};
