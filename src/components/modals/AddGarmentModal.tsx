import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Garment, GarmentCategory, ShopSettings } from '../../types';
import { generateProductId } from '../../utils/productUtils';
import { SAMPLE_GARMENT_IMAGES } from '../../data/initialData';
import { Camera, Image as ImageIcon, Sparkles, X, Plus, Check, Info, CheckCircle2 } from 'lucide-react';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface AddGarmentModalProps {
  isOpen: boolean;
  garments: Garment[];
  settings: ShopSettings;
  onSaveGarment: (garment: Garment) => void;
  onClose: () => void;
}

const CATEGORIES: GarmentCategory[] = [
  'Sarees',
  'Dresses',
  'Shirts',
  'Kurtas',
  'Lehengas',
  'Suits',
  'Ethnic Wear',
  'Trousers',
  'Other',
];

export const AddGarmentModal: React.FC<AddGarmentModalProps> = ({
  isOpen,
  garments,
  settings,
  onSaveGarment,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GarmentCategory>('Sarees');
  const [price, setPrice] = useState<string>('1499');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [brand, setBrand] = useState(settings?.shopName || 'Boutique');
  const [size, setSize] = useState('Free Size');
  const [color, setColor] = useState('');
  const [notes, setNotes] = useState('');
  const [customProductId, setCustomProductId] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate next Product ID
  const nextGeneratedId = generateProductId(
    garments,
    settings?.productPrefix || 'J',
    settings?.productStartNum || 1
  );

  useEffect(() => {
    if (isOpen) {
      setImageUrl(SAMPLE_GARMENT_IMAGES[0]?.url || '');
      setCustomProductId(nextGeneratedId);
      setName('');
      setColor('');
      setNotes('');
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
      setError('Please enter a garment name');
      return;
    }
    if (!imageUrl) {
      setError('Please select or upload a garment photo');
      return;
    }

    const assignedId = (customProductId || nextGeneratedId).toUpperCase().trim();

    // Check duplicate Product ID
    const exists = garments.some(
      (g) => g.productId.toUpperCase() === assignedId
    );
    if (exists) {
      setError(`Product ID "${assignedId}" already exists. Please choose another.`);
      return;
    }

    const newGarment: Garment = {
      id: `g-${Date.now()}`,
      productId: assignedId,
      name: name.trim(),
      category,
      price: parseFloat(price) || 999,
      imageUrl,
      brand: brand.trim() || undefined,
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      stockStatus: 'Available',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      tryOnCount: 0,
    };

    onSaveGarment(newGarment);
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
            className="relative w-full max-w-xl bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl z-10 max-h-[90vh] flex flex-col border border-neutral-200 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-neutral-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-neutral-900 leading-tight">
                    Save New Garment
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Upload once — use for unlimited customer try-ons
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

            {/* Form Fields (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Garment Upload Photo Guidance Box */}
              <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Photo Upload Guidance for Best AI Fit:</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-blue-800">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Full garment visible</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Front-facing view</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Clean/plain background</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Good, even lighting</span>
                  </div>
                </div>
                <p className="text-[10px] text-blue-600 pt-0.5">
                  Better garment photos produce clearer, more realistic AI try-on previews for your customers.
                </p>
              </div>

              {/* Product ID Highlight Banner */}
              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                    Assigned Product ID / SKU
                  </span>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Will be used to quickly find this garment in Trial Room.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customProductId}
                    onChange={(e) => setCustomProductId(e.target.value.toUpperCase())}
                    className="w-24 text-center font-mono font-black text-base bg-white border-2 border-emerald-500 text-emerald-950 rounded-xl py-1 px-2 shadow-2xs outline-hidden"
                    placeholder={nextGeneratedId}
                  />
                </div>
              </div>

              {/* Garment Image Upload & Sample Selection */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Garment Photo *
                </label>

                <div className="flex items-start gap-3">
                  {/* Photo Preview */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border-2 border-dashed border-neutral-300 flex items-center justify-center shadow-xs">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Garment preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-neutral-400" />
                    )}
                  </div>

                  {/* Upload & Camera Buttons */}
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
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

                    {/* Sample image quick picker */}
                    <div className="pt-1">
                      <span className="text-[10px] text-neutral-400 font-semibold block mb-1">
                        Or pick a sample:
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {SAMPLE_GARMENT_IMAGES.slice(0, 6).map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setImageUrl(sample.url);
                              if (!name) setName(sample.name);
                              setCategory(sample.cat as GarmentCategory);
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

              {/* Garment Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Garment Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Red Banarasi Silk Saree"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GarmentCategory)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Price ({settings.currencySymbol || '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1499"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Size / Fit (Optional)
                  </label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. M, L, Free Size"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Color & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Color (Optional)
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Royal Blue & Gold"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Brand / Collection (Optional)
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. In-house Boutique"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Shop Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Special fabric details, care instructions, or matching blouse piece details..."
                  className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Garment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCamera}
        title="Take Garment Photo"
        onCapture={(dataUrl) => setImageUrl(dataUrl)}
        onClose={() => setShowCamera(false)}
      />
    </>
  );
};
