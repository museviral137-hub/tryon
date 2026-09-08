import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShopSettings, Garment, GarmentCategory } from '../../types';
import {
  Store,
  Sparkles,
  Shirt,
  ArrowRight,
  Check,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { SAMPLE_GARMENT_IMAGES, INITIAL_SETTINGS } from '../../data/initialData';

interface ShopOnboardingModalProps {
  isOpen: boolean;
  settings?: ShopSettings;
  onComplete: (updatedSettings: ShopSettings, firstGarment?: Garment) => void;
  onSkip?: () => void;
}

export const ShopOnboardingModal: React.FC<ShopOnboardingModalProps> = ({
  isOpen,
  settings = INITIAL_SETTINGS,
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Shop details
  const [shopName, setShopName] = useState(settings?.shopName || 'My Boutique');
  const [ownerName, setOwnerName] = useState(settings?.ownerName || 'Boutique Owner');
  const [phone, setPhone] = useState(settings?.phone || '+91 98765 43210');
  const [currencySymbol, setCurrencySymbol] = useState(settings?.currencySymbol || '₹');

  // Step 2: First Garment
  const [garmentName, setGarmentName] = useState('Pink Banarasi Silk Saree');
  const [garmentCategory, setGarmentCategory] = useState<GarmentCategory>('Sarees');
  const [garmentPrice, setGarmentPrice] = useState('2499');
  const [garmentImage, setGarmentImage] = useState(SAMPLE_GARMENT_IMAGES[0]?.url || '');
  const [garmentSku, setGarmentSku] = useState('J001');

  if (!isOpen) return null;

  const handleFinish = () => {
    const updatedSettings: ShopSettings = {
      ...settings,
      shopName: shopName.trim() || 'My Boutique',
      ownerName: ownerName.trim() || 'Shop Owner',
      phone: phone.trim() || '+91 ',
      currencySymbol,
      isOnboarded: true,
    };

    let firstGarment: Garment | undefined;
    if (garmentName.trim() && garmentImage) {
      firstGarment = {
        id: `g-init-${Date.now()}`,
        productId: garmentSku.toUpperCase().trim() || 'J001',
        name: garmentName.trim(),
        category: garmentCategory,
        price: parseFloat(garmentPrice) || 1999,
        imageUrl: garmentImage,
        stockStatus: 'Available',
        createdAt: new Date().toISOString(),
        tryOnCount: 0,
      };
    }

    onComplete(updatedSettings, firstGarment);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 z-10 my-auto"
        >
          {/* Top Progress bar */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-black text-base sm:text-lg text-neutral-900 leading-tight">
                  Welcome to VestiAI
                </h3>
                <p className="text-xs text-neutral-500">Quick 3-step boutique setup</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onSkip}
              className="text-xs text-neutral-400 hover:text-neutral-700 font-semibold px-2 py-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              Skip Setup
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-6 px-2">
            {[
              { num: 1, label: 'Shop Details' },
              { num: 2, label: 'First Garment' },
              { num: 3, label: 'Start Try-On' },
            ].map((s) => (
              <div key={s.num} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    step === s.num
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                      : step > s.num
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {step > s.num ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <span
                  className={`text-xs font-bold hidden sm:inline ${
                    step === s.num ? 'text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* STEP 1: Shop Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Boutique / Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Saree Sangam Boutique"
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Owner / Staff Name
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="e.g. Vikram Mehta"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Shop WhatsApp / Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Default Currency
                </label>
                <select
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.symbol}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-neutral-400 mt-1">
                  Default is ₹ INR formatted (e.g. ₹2,999).
                </p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue to Add Garment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Add First Garment */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900">
                  <span className="font-bold">Garment upload tip:</span> Clear front-facing photos with plain backgrounds generate the most realistic AI fittings.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 shrink-0 border-2 border-emerald-500 shadow-xs">
                  <img
                    src={garmentImage}
                    alt="Starter garment"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">
                    Choose Starter Garment:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {SAMPLE_GARMENT_IMAGES.slice(0, 4).map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setGarmentImage(sample.url);
                          setGarmentName(sample.name);
                          setGarmentCategory(sample.cat as GarmentCategory);
                        }}
                        className={`relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border transition-all ${
                          garmentImage === sample.url
                            ? 'border-emerald-500 ring-2 ring-emerald-400'
                            : 'border-neutral-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={sample.url} alt={sample.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Garment Name
                  </label>
                  <input
                    type="text"
                    value={garmentName}
                    onChange={(e) => setGarmentName(e.target.value)}
                    placeholder="e.g. Red Banarasi Silk Saree"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-800 mb-1">
                    Price ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    value={garmentPrice}
                    onChange={(e) => setGarmentPrice(e.target.value)}
                    placeholder="2499"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 font-medium focus:bg-white focus:border-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-2xl border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Next: Start First Try-On</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Ready to Start */}
          {step === 3 && (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner">
                <Sparkles className="w-8 h-8 text-emerald-600 animate-pulse" />
              </div>

              <div>
                <h3 className="font-display font-black text-xl text-neutral-900">
                  {shopName} is Ready!
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  You have <span className="font-bold text-neutral-800">87 AI credits</span> ready to generate instant fittings for standing customers.
                </p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200/90 text-left text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-neutral-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>1. Take customer photo or select existing customer</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>2. Type garment SKU (e.g. {garmentSku}) or browse catalog</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>3. Generate AI try-on and share immediately on WhatsApp</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-black text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Open AI Trial Room Now</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
