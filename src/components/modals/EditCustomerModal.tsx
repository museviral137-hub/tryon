import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../../types';
import { Camera, Image as ImageIcon, X, Check, Trash2 } from 'lucide-react';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onUpdateCustomer: (updated: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  onClose: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  isOpen,
  customer,
  onUpdateCustomer,
  onDeleteCustomer,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setImageUrl(customer.imageUrl);
      setNotes(customer.notes || '');
    }
  }, [customer]);

  if (!isOpen || !customer) return null;

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
    if (!name.trim()) return;

    const updated: Customer = {
      ...customer,
      name: name.trim(),
      phone: phone.trim(),
      imageUrl: imageUrl || customer.imageUrl,
      notes: notes.trim() || undefined,
    };

    onUpdateCustomer(updated);
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
                <span className="font-mono font-bold text-xs bg-neutral-900 text-white px-2 py-0.5 rounded">
                  {customer.customerId}
                </span>
                <h3 className="font-display font-bold text-base sm:text-lg text-neutral-900 leading-tight">
                  Edit Customer Profile
                </h3>
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
              {/* Photo & Actions */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Customer Photo
                </label>
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-300 flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Customer" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 text-white text-xs font-semibold"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </button>
                      <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-neutral-300 text-neutral-800 text-xs font-semibold cursor-pointer hover:bg-neutral-50">
                        <ImageIcon className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                {onDeleteCustomer && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteCustomer(customer.id);
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      <CameraCaptureModal
        isOpen={showCamera}
        title="Update Customer Photo"
        onCapture={(dataUrl) => setImageUrl(dataUrl)}
        onClose={() => setShowCamera(false)}
      />
    </>
  );
};
