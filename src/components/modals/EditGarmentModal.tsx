import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Garment, GarmentCategory } from '../../types';
import { Camera, Image as ImageIcon, X, Check, Trash2 } from 'lucide-react';
import { CameraCaptureModal } from '../common/CameraCaptureModal';

interface EditGarmentModalProps {
  isOpen: boolean;
  garment: Garment | null;
  onUpdateGarment: (updated: Garment) => void;
  onDeleteGarment?: (id: string) => void;
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

export const EditGarmentModal: React.FC<EditGarmentModalProps> = ({
  isOpen,
  garment,
  onUpdateGarment,
  onDeleteGarment,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GarmentCategory>('Sarees');
  const [price, setPrice] = useState<string>('1499');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [stockStatus, setStockStatus] = useState<'Available' | 'Low Stock' | 'Out of Stock'>('Available');
  const [notes, setNotes] = useState('');
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (garment) {
      setName(garment.name);
      setCategory(garment.category);
      setPrice(String(garment.price));
      setImageUrl(garment.imageUrl);
      setBrand(garment.brand || '');
      setSize(garment.size || '');
      setColor(garment.color || '');
      setStockStatus(garment.stockStatus);
      setNotes(garment.notes || '');
    }
  }, [garment]);

  if (!isOpen || !garment) return null;

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

    const updated: Garment = {
      ...garment,
      name: name.trim(),
      category,
      price: parseFloat(price) || garment.price,
      imageUrl: imageUrl || garment.imageUrl,
      brand: brand.trim() || undefined,
      size: size.trim() || undefined,
      color: color.trim() || undefined,
      stockStatus,
      notes: notes.trim() || undefined,
    };

    onUpdateGarment(updated);
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
                <span className="font-mono font-black text-sm bg-neutral-900 text-white px-2 py-0.5 rounded-md">
                  {garment.productId}
                </span>
                <div>
                  <h3 className="font-display font-bold text-base sm:text-lg text-neutral-900 leading-tight">
                    Edit Garment Details
                  </h3>
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
              {/* Photo & Actions */}
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1.5">
                  Garment Photo
                </label>
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-300 flex items-center justify-center">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Garment" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">👗</span>
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

              {/* Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Garment Name
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
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Category</label>
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

              {/* Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Stock Status</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  >
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Color & Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Color</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:bg-white focus:border-emerald-500 outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">Size</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
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
                {onDeleteGarment && (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteGarment(garment.id);
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
        title="Update Garment Photo"
        onCapture={(dataUrl) => setImageUrl(dataUrl)}
        onClose={() => setShowCamera(false)}
      />
    </>
  );
};
