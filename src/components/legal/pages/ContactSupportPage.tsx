import React, { useState } from 'react';
import { LegalPageLayout } from '../LegalPageLayout';
import { LegalSection } from '../LegalSection';
import { LegalNotice } from '../LegalNotice';
import { LEGAL_CONFIG } from '../../../constants/legal';
import { NavTab } from '../../../types';
import { Mail, Phone, Clock, MapPin, Send, CheckCircle2, MessageSquare, HelpCircle, ShieldCheck } from 'lucide-react';

interface ContactSupportPageProps {
  onNavigate: (tab: NavTab) => void;
  onBack?: () => void;
  onShowToast?: (title: string, desc?: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ContactSupportPage: React.FC<ContactSupportPageProps> = ({
  onNavigate,
  onBack,
  onShowToast,
}) => {
  const [topic, setTopic] = useState('credits');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      onShowToast?.('Missing Fields', 'Please complete all required fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      onShowToast?.('Support Ticket Sent', 'Our team will respond to your email shortly.', 'success');
    }, 700);
  };

  return (
    <LegalPageLayout
      currentTab="contact-support"
      title="Contact & Support"
      shortDescription={`Get in touch with the ${LEGAL_CONFIG.APP_NAME} technical team for account support, billing assistance, AI credit questions, or data privacy requests.`}
      onNavigate={onNavigate}
      onBack={onBack}
    >
      {/* Support Channels Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Mail className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Email Support</span>
          <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
            {LEGAL_CONFIG.SUPPORT_EMAIL}
          </p>
          <span className="text-[11px] text-neutral-500 block">Response within 24–48 hours</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Phone className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Phone Desk</span>
          <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
            {LEGAL_CONFIG.SUPPORT_PHONE}
          </p>
          <span className="text-[11px] text-neutral-500 block">Voice & WhatsApp support</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Operating Hours</span>
          <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
            {LEGAL_CONFIG.SUPPORT_HOURS}
          </p>
          <span className="text-[11px] text-neutral-500 block">Business days</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-wider">Registered Entity</span>
          <p className="font-bold text-xs sm:text-sm text-neutral-900 truncate">
            {LEGAL_CONFIG.BUSINESS_LEGAL_NAME}
          </p>
          <span className="text-[11px] text-neutral-500 block truncate">{LEGAL_CONFIG.BUSINESS_ADDRESS}</span>
        </div>
      </div>

      {/* Support Inquiry Categories */}
      <LegalSection number="1" title="Inquiry Topics & Assistance Categories">
        <p>Our support team assists with all aspects of boutique operations:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-neutral-700">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <strong className="text-neutral-900 block mb-0.5">💳 AI Credits & Billing</strong>
            <span>Credit top-ups, transaction receipts, plan upgrades, and refund inquiries.</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <strong className="text-neutral-900 block mb-0.5">✨ Virtual Try-On Technical Support</strong>
            <span>Generation status questions, garment category fitting guidelines, and image quality.</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <strong className="text-neutral-900 block mb-0.5">👥 Customer Directory & Photos</strong>
            <span>Customer record management, photo consent protocols, and profile deletion.</span>
          </div>
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70">
            <strong className="text-neutral-900 block mb-0.5">🔒 Privacy & Compliance</strong>
            <span>Data protection compliance, policy questions, and account erasure requests.</span>
          </div>
        </div>
      </LegalSection>

      {/* Interactive Support Ticket Form */}
      <LegalSection number="2" title="Send a Support Inquiry">
        {isSubmitted ? (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-base text-emerald-950">
              Message Dispatched Successfully
            </h4>
            <p className="text-xs text-emerald-900/80 max-w-sm mx-auto">
              Thank you, {name}. A support ticket has been created and our team will contact you at <strong>{email}</strong> within 24–48 hours.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setMessage('');
              }}
              className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 bg-neutral-50 rounded-2xl border border-neutral-200/90 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Boutique / Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. priya@boutique.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Inquiry Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 outline-hidden cursor-pointer"
              >
                <option value="credits">AI Credits & Top-Up Assistance</option>
                <option value="tryon">Virtual Try-On Technical Inquiry</option>
                <option value="billing">Billing, Invoice & Refund Request</option>
                <option value="customer">Customer Records & Photo Consent</option>
                <option value="privacy">Privacy & Data Deletion Request</option>
                <option value="other">General Boutique Software Inquiries</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                How can we help? *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe your issue, boutique name, or request in detail..."
                className="w-full px-3.5 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:border-emerald-500 outline-hidden resize-none"
              />
            </div>

            <div className="pt-1 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              </button>
            </div>
          </form>
        )}
      </LegalSection>
    </LegalPageLayout>
  );
};
