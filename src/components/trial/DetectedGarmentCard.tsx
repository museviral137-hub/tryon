import React from 'react';
import { Garment } from '../../types';
import { CheckCircle2, RefreshCw, Sparkles, Tag, ShieldCheck, AlertTriangle } from 'lucide-react';

interface DetectedGarmentCardProps {
  garment: Garment;
  onChangeGarment: () => void;
  onClearGarment: () => void;
}

export const DetectedGarmentCard: React.FC<DetectedGarmentCardProps> = ({
  garment,
  onChangeGarment,
  onClearGarment,
}) => {
  const isUnsupported =
    garment.category.toLowerCase().includes('unstitched') ||
    garment.category.toLowerCase().includes('fabric roll') ||
    garment.category.toLowerCase().includes('dupatta') ||
    garment.category.toLowerCase().includes('shawl');

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 shadow-xs transition-all ${
        isUnsupported
          ? 'bg-amber-50/80 border-amber-300'
          : 'bg-emerald-50/70 border-emerald-300'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${
              isUnsupported ? 'bg-amber-600' : 'bg-emerald-600'
            }`}
          >
            {isUnsupported ? '!' : '✓'}
          </span>
          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              isUnsupported ? 'text-amber-900' : 'text-emerald-900'
            }`}
          >
            Garment Detected
          </span>
        </div>
        {isUnsupported ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Unstitched (Not AI Supported)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Ready for Trial
          </span>
        )}
      </div>

      <div className="flex items-start gap-3.5 sm:gap-4">
        {/* Garment Image */}
        <div
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-200 shrink-0 border shadow-xs flex items-center justify-center ${
            isUnsupported ? 'border-amber-200' : 'border-emerald-200'
          }`}
        >
          {garment?.imageUrl ? (
            <img
              src={garment.imageUrl}
              alt={garment.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl">👗</span>
          )}
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-neutral-950/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold">
            {garment.productId}
          </div>
        </div>

        {/* Garment Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-sm bg-neutral-900 text-white px-2 py-0.5 rounded-lg shadow-2xs">
              {garment.productId}
            </span>
            <h4 className="font-bold text-sm sm:text-base text-neutral-900 leading-snug truncate">
              {garment.name}
            </h4>
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm font-extrabold text-neutral-900">
              ₹{garment.price.toLocaleString('en-IN')}
            </span>
            <span
              className={`text-xs font-semibold ${
                isUnsupported ? 'text-amber-800' : 'text-neutral-500'
              }`}
            >
              • {garment.category}
            </span>
            {garment.size && (
              <span className="text-[11px] font-semibold text-neutral-600 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                Size {garment.size}
              </span>
            )}
          </div>

          {isUnsupported ? (
            <div className="mt-2 text-[11px] text-amber-900 bg-amber-100/70 p-1.5 rounded-lg border border-amber-200/80 font-medium">
              Virtual Try-On for unstitched raw fabrics is not supported. Please select a stitched garment (Dresses, Sarees, Lehengas, Kurtis, Shirts, or Bottoms).
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-800 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {garment.stockStatus}
              </span>
              <span>• Used in {garment.tryOnCount || 0} customer try-ons</span>
            </div>
          )}
        </div>

        {/* Change / Remove Controls */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onChangeGarment}
            className={`p-2 rounded-xl bg-white border text-xs font-bold flex items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all ${
              isUnsupported
                ? 'border-amber-300 text-amber-900 hover:bg-amber-100'
                : 'border-emerald-300 text-emerald-900 hover:bg-emerald-100'
            }`}
            title="Choose different garment"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Change</span>
          </button>
          <button
            type="button"
            onClick={onClearGarment}
            className="text-[11px] text-neutral-400 hover:text-rose-600 font-semibold text-center mt-1"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
