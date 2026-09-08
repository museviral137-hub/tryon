import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TryOnResult, ShopSettings } from '../../types';
import { MessageSquare, Copy, Share2, Check, X, QrCode, Edit3, Sparkles } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

interface ShareModalProps {
  isOpen: boolean;
  result: TryOnResult | null;
  settings: ShopSettings;
  onClose: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info') => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  result,
  settings,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(result?.customerPhone || '');
  const [customMsg, setCustomMsg] = useState(
    result
      ? `Hello ${result.customerName}! ✨\n\nHere is your virtual trial room preview from *${settings?.shopName || 'our Boutique'}*:\n👗 *${result.garmentName}* (SKU: *${result.garmentProductId}*)\n🏷️ Price: *${formatPrice(result.garmentPrice, settings?.currencySymbol || '₹')}*\n\nLet us know if you'd like us to keep this ready for you!`
      : ''
  );

  if (!isOpen || !result) return null;

  const mockLink = `https://vestiai.shop/trial/${result.id}?pid=${result.garmentProductId}&cid=${result.customerId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mockLink);
    setCopied(true);
    onShowToast('Link Copied!', 'Virtual trial preview link copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsApp = () => {
    const cleanPhone = recipientPhone ? recipientPhone.replace(/\D/g, '') : '';
    const encoded = encodeURIComponent(customMsg);
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(url, '_blank');
    onShowToast('WhatsApp Opened', `Prepared trial room card for ${result.customerName}.`, 'success');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Virtual Try-On: ${result.garmentName} (${result.garmentProductId})`,
          text: customMsg,
          url: mockLink,
        });
        onShowToast('Shared successfully!', '', 'success');
      } catch (err) {
        console.warn('Share cancelled or not supported', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-neutral-200 z-10 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Share2 className="w-4 h-4 text-emerald-700" />
              </div>
              <h3 className="font-display font-bold text-base text-neutral-900">
                Share Trial With Customer
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Customer Summary Card */}
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200/80 mb-4">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-200 border border-neutral-300 shrink-0 flex items-center justify-center">
              {result?.resultImageUrl ? (
                <img
                  src={result.resultImageUrl}
                  alt="Try on thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm">✨</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-neutral-900 truncate">
                {result.customerName} ({result.customerId})
              </h4>
              <p className="text-[11px] text-neutral-500 truncate">
                {result.garmentName} • <span className="font-mono font-bold text-neutral-800">{result.garmentProductId}</span>
              </p>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                Price: {formatPrice(result.garmentPrice, settings.currencySymbol)}
              </p>
            </div>
          </div>

          {/* WhatsApp Phone & Message Editor */}
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                Customer WhatsApp Number
              </label>
              <input
                type="text"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                WhatsApp Message Text
              </label>
              <textarea
                rows={3}
                value={customMsg}
                onChange={(e) => setCustomMsg(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 outline-hidden resize-none"
              />
            </div>
          </div>

          {/* Options Grid */}
          <div className="space-y-2 mb-4">
            {/* WhatsApp Direct */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Send to Customer WhatsApp</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-white/20 rounded-md font-semibold">
                Open
              </span>
            </button>

            {/* Copy Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-98 text-neutral-800 text-xs font-semibold transition-all"
            >
              <div className="flex items-center gap-2">
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-neutral-500" />}
                <span>{copied ? 'Preview Link Copied!' : 'Copy Web Preview Link'}</span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                {copied ? '✓' : 'Copy'}
              </span>
            </button>
          </div>

          {/* QR Code / Device Share */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-neutral-600" />
              <span>{showQr ? 'Hide QR' : 'Show Shop QR'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-98 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>More Options</span>
            </button>
          </div>

          {/* QR Code display */}
          {showQr && (
            <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-center mb-4">
              <div className="w-28 h-28 mx-auto bg-white p-2 rounded-xl border border-neutral-300 shadow-2xs flex items-center justify-center">
                <QrCode className="w-20 h-20 text-neutral-800" />
              </div>
              <p className="text-[11px] text-neutral-500 mt-2">
                Scan with customer's mobile camera to view trial room preview
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-neutral-700"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
