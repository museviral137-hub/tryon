import React, { useState } from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';
import { Trash2, ShieldAlert, CheckCircle2, UserX, AlertTriangle, Send, X } from 'lucide-react';

interface DataDeletionPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const DataDeletionPage: React.FC<DataDeletionPageProps> = ({
  onNavigate,
  onBack,
  onShowToast,
}) => {
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [shopEmail, setShopEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopEmail.trim()) {
      onShowToast?.('Email Required', 'Please enter your registered boutique email.', 'warning');
      return;
    }

    setIsSubmitting(true);
    // Simulating secure support ticket dispatch
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      onShowToast?.(
        'Deletion Request Submitted',
        'Our compliance team will process your request within 30 days.',
        'success'
      );
    }, 800);
  };

  return (
    <LegalPageLayout
      currentTab="data-deletion"
      title="Data Deletion & Account Closure"
      shortDescription="Clear instructions and dedicated procedures for deleting customer records, erasing uploaded photographs, and requesting full boutique account erasure."
      onNavigate={onNavigate}
      onBack={onBack}
      headerAction={
        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setShowDeletionModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Request Account Deletion</span>
        </button>
      }
    >
      <LegalNotice type="alert" title="Permanent Data Removal Notice">
        Account deletion is permanent and irreversible. Once processed, all customer profiles, uploaded try-on photos, garment catalogs, and AI generation history will be permanently erased.
      </LegalNotice>

      {/* 1. Customer-Specific Data Deletion */}
      <LegalSection number="1" title="Deleting Individual Customer Records & Photos">
        <p>
          Boutique owners and staff have direct self-service control over customer data. If an in-store shopper requests that their profile or photograph be removed:
        </p>
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/90 space-y-2 text-xs sm:text-sm text-neutral-700">
          <div className="flex items-start gap-2">
            <span className="font-bold text-neutral-900">Step 1:</span>
            <span>Navigate to the <strong>Customers</strong> tab from the sidebar or bottom menu.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-neutral-900">Step 2:</span>
            <span>Search or locate the customer record by name or customer ID.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-neutral-900">Step 3:</span>
            <span>Click the <strong>Delete (Trash)</strong> icon and confirm the prompt.</span>
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          This immediately removes the customer's name, phone number, notes, and cloud-stored photograph from your boutique catalog.
        </p>
      </LegalSection>

      {/* 2. Full Boutique Account Deletion */}
      <LegalSection number="2" title="Full Boutique Account Erasure">
        <p>
          If you wish to terminate your boutique subscription and completely erase all store records from our servers:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li><strong>What is Erased:</strong> Your boutique profile, owner credentials, full customer directory, all customer photographs, garment inventory, try-on history, and AI usage logs.</li>
          <li><strong>Processing Window:</strong> Data deletion requests are verified and executed within <strong>[DATA DELETION TIMEFRAME (e.g., within 30 days)]</strong> of receipt.</li>
          <li><strong>Irreversibility:</strong> Once purged, records and remaining promotional AI credits cannot be recovered.</li>
        </ul>
      </LegalSection>

      {/* 3. Direct Customer Deletion Requests */}
      <LegalSection number="3" title="Direct Shopper / End-Customer Requests">
        <p>
          If you are an individual customer whose photo was uploaded at a retail store using {LEGAL_CONFIG.APP_NAME} and you wish to have your photo deleted by our central engineering team:
        </p>
        <p>
          Please email our data protection desk at <strong>{LEGAL_CONFIG.SUPPORT_EMAIL}</strong> with the subject line <em>"Customer Data Deletion Request"</em>, providing your phone number and the name of the boutique visited.
        </p>
      </LegalSection>

      {/* 4. Action Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-50 to-neutral-50 border border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-display font-bold text-sm sm:text-base text-rose-950">
            Ready to Submit an Account Deletion Request?
          </h4>
          <p className="text-xs text-rose-900/80">
            Submit a formal account closure ticket to our compliance team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false);
            setShowDeletionModal(true);
          }}
          className="shrink-0 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          Submit Request
        </button>
      </div>

      {/* Safe Account Deletion Request Modal */}
      {showDeletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 text-rose-600 font-display font-bold text-base">
                <ShieldAlert className="w-5 h-5" />
                <span>Request Boutique Account Deletion</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeletionModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-display font-bold text-base text-neutral-900">
                  Request Received
                </h4>
                <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                  We have received your account deletion ticket for <strong>{shopEmail}</strong>. Our team will verify ownership and complete the purge within 30 days.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeletionModal(false)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <p className="text-xs text-neutral-600">
                  Please confirm your registered boutique email address. We will verify your credentials and initiate the safe data purge protocol.
                </p>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Registered Boutique Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="e.g. owner@myboutique.com"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-rose-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Reason for Closure (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Tell us why you are deleting your account..."
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-rose-500 outline-hidden resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    This action will delete all customer photos and catalog data. It cannot be undone.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDeletionModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Submitting...' : 'Confirm Request'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </LegalPageLayout>
  );
};
