import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer, ShopSettings } from '../../types';
import { generateCustomerId } from '../../utils/productUtils';
import { SAMPLE_CUSTOMER_IMAGES } from '../../data/initialData';
import { Camera, Image as ImageIcon, UserPlus, X, Check, User, ShieldCheck } from 'lucide-react';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { ConsentCheckbox } from '../legal/ConsentCheckbox';
import { LegalNavModal } from '../legal/LegalNavModal';

interface AddCustomerModalProps {
  isOpen: boolean;
  customers: Customer[];
  settings: ShopSettings;
  onSaveCustomer: (customer: Customer) => void;
  onClose: () => void;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  customers,
  settings,
  onSaveCustomer,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Unisex'>('Female');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextGeneratedId = generateCustomerId(
    customers,
    settings?.customerPrefix || 'C',
    settings?.customerStartNum || 1
  );

  useEffect(() => {
    if (isOpen) {
      setImageUrl(SAMPLE_CUSTOMER_IMAGES[0]?.url || '');
      setName('');
      setPhone('');
      setNotes('');
      setConsentAgreed(false);
      setConsentError(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter the customer name');
      return;
    }
    if (!imageUrl) {
      setError('Please provide or capture a customer photo');
      return;
    }
    if (!consentAgreed) {
      setConsentError(true);
      setError('Customer explicit photo consent is required before saving customer image.');
      return;
    }

    const newCustomer: Customer = {
      id: `c-${Date.now()}`,
      customerId: nextGeneratedId,
      name: name.trim(),
      phone: phone.trim() || '+91 ',
      gender,
      imageUrl,
      notes: notes.trim() || undefined,
      consentAgreed: true,
      createdAt: new Date().toISOString(),
      tryOnCount: 0,
    };

    onSaveCustomer(newCustomer);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col border border-neutral-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-neutral-900 leading-tight">
                    Add New Customer
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Save photo once — reuse for all future trial rooms
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Customer ID Banner */}
              <div className="p-3 bg-neutral-900 text-white rounded-2xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider block">
                    Customer ID Assigned
                  </span>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Unique profile ID for trial history tracking
                  </p>
                </div>
                <div className="font-mono font-black text-lg text-emerald-400 bg-neutral-800 px-3 py-1 rounded-xl border border-neutral-700">
                  {nextGeneratedId}
                </div>
              </div>

              {/* Customer Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Customer Face / Full Photo *
                </label>

                <div className="flex items-start gap-3">
                  <div className="relative w-22 h-22 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border-2 border-dashed border-neutral-300 flex items-center justify-center shadow-xs">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Customer preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo</span>
                      </button>

                      <label className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold cursor-pointer active:scale-95 transition-all">
                        <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Choose File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>

                    {/* Sample avatars */}
                    <div>
                      <span className="text-[10px] text-neutral-400 font-semibold block mb-1">
                        Or select a sample portrait:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {SAMPLE_CUSTOMER_IMAGES.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImageUrl(sample.url);
                              setGender(sample.gender as any);
                            }}
                            className={`relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border transition-all ${
                              imageUrl === sample.url
                                ? 'border-emerald-500 ring-2 ring-emerald-400'
                                : 'border-neutral-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={sample.url}
                              alt={sample.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Phone / WhatsApp (Optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Customer Preferences / Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferences: prefers bright colors, bridal shopper, size M..."
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              {/* Customer Photo Explicit Consent Card */}
              <div className={`p-3.5 rounded-2xl border transition-all ${
                consentError && !consentAgreed
                  ? 'bg-rose-50/80 border-rose-300'
                  : 'bg-emerald-50/50 border-emerald-200/80'
              }`}>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1.5">
                    <ConsentCheckbox
                      id="customer-photo-consent"
                      checked={consentAgreed}
                      onChange={(checked) => {
                        setConsentAgreed(checked);
                        if (checked) setConsentError(false);
                      }}
                      required
                      error={consentError && !consentAgreed}
                      label={
                        <span className="text-xs text-neutral-800 font-medium leading-tight">
                          Customer has explicitly consented to taking, uploading, and temporarily storing their photo for AI Virtual Try-On generation in this boutique.
                        </span>
                      }
                    />
                    <div className="flex items-center gap-2 pl-6">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowConsentModal(true);
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline"
                      >
                        Read Photo Consent Policy & Guidelines
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Submit */}
              <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!consentAgreed}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Customer
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      <CameraCaptureModal
        isOpen={showCamera}
        title="Capture Customer Photo"
        onCapture={(dataUrl) => setImageUrl(dataUrl)}
        onClose={() => setShowCamera(false)}
      />

      {showConsentModal && (
        <LegalNavModal
          isOpen={showConsentModal}
          initialTab="photo-consent"
          onClose={() => setShowConsentModal(false)}
        />
      )}
    </>
  );
};
