import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TryOnResult, ShopSettings } from '../../types';
import {
  Download,
  Share2,
  BookmarkCheck,
  RefreshCw,
  X,
  Sparkles,
  Columns,
  Eye,
  Check,
  Store,
  MessageCircle,
  Layers,
  AlertCircle,
  Clock,
  Shirt,
  UserCheck,
  History as HistoryIcon,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { createDownloadableCanvas, getWhatsAppShareUrl } from '../../utils/tryOnGenerator';
import { formatPrice } from '../../utils/currency';

interface ResultViewModalProps {
  isOpen: boolean;
  result: TryOnResult | null;
  settings: ShopSettings;
  isSaved?: boolean;
  onSaveResult?: () => void;
  onShareResult?: () => void;
  onTryAnotherGarment?: () => void;
  onRetry?: () => void;
  onBackToTrialRoom?: () => void;
  onViewHistory?: () => void;
  onClose: () => void;
  sessionResults?: TryOnResult[];
  onSelectSessionResult?: (res: TryOnResult) => void;
}

export const ResultViewModal: React.FC<ResultViewModalProps> = ({
  isOpen,
  result,
  settings,
  isSaved = true,
  onSaveResult,
  onShareResult,
  onTryAnotherGarment,
  onRetry,
  onBackToTrialRoom,
  onViewHistory,
  onClose,
  sessionResults = [],
  onSelectSessionResult,
}) => {
  const [viewMode, setViewMode] = useState<'result' | 'comparison'>('result');
  const [isDownloading, setIsDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !result) return null;

  const status = result.status || 'Completed';
  const isCompleted = status === 'Completed';
  const isProcessing = status === 'Processing';
  const isFailed = status === 'Failed';

  const handleDownload = async () => {
    if (!isCompleted) return;
    try {
      setIsDownloading(true);
      const dataUrl = await createDownloadableCanvas(result, settings?.shopName || 'VestiAI Boutique');
      const link = document.createElement('a');
      link.download = `VestiAI_${result.customerName.replace(/\s+/g, '_')}_${result.garmentProductId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.warn('Download notice:', e);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDirectWhatsApp = () => {
    const url = getWhatsAppShareUrl(
      result.customerPhone,
      result.customerName,
      result.garmentName,
      result.garmentProductId,
      result.garmentPrice,
      settings?.shopName || 'VestiAI Boutique'
    );
    window.open(url, '_blank');
  };

  const formattedDate = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const formattedTime = result.createdAt
    ? new Date(result.createdAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl z-10 my-auto border border-neutral-200 flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-neutral-100 bg-white sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs ${
                  isCompleted
                    ? 'bg-emerald-600'
                    : isProcessing
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-600'
                }`}
              >
                {isCompleted ? (
                  <Sparkles className="w-4 h-4" />
                ) : isProcessing ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-black text-base sm:text-lg text-neutral-900 leading-none">
                    {isCompleted
                      ? 'Virtual Try-On Result'
                      : isProcessing
                      ? 'Fitting in Progress'
                      : 'Fitting Generation Failed'}
                  </h3>
                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : isProcessing
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Customer: <span className="font-semibold text-neutral-700">{result.customerName}</span> ({result.customerId})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Comparison View (Only for Completed state) */}
              {isCompleted && (
                <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('result')}
                    className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'result'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Try-On</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('comparison')}
                    className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      viewMode === 'comparison'
                        ? 'bg-white text-neutral-900 shadow-2xs'
                        : 'text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compare</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-neutral-100 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Visual Stage (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* 1. COMPLETED STATE */}
            {isCompleted && (
              <>
                <div className="relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-inner flex items-center justify-center">
                  {viewMode === 'result' ? (
                    <div className="relative w-full aspect-4/5 max-h-[420px] flex items-center justify-center overflow-hidden">
                      {result?.resultImageUrl && !imageError ? (
                        <img
                          src={result.resultImageUrl}
                          alt="AI Virtual Try-On Result"
                          onError={() => setImageError(true)}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-400">
                          <Sparkles className="w-10 h-10 text-emerald-500 mb-2" />
                          <span className="text-sm font-bold text-neutral-200">AI Try-On Image Available</span>
                          <span className="text-xs text-neutral-500 mt-1">Image URL is loaded securely from storage.</span>
                        </div>
                      )}

                      {/* Watermark & Shop Badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-2 bg-neutral-950/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10 shadow-md">
                        <Store className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{settings?.shopName || 'VestiAI Boutique'}</span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-neutral-950/85 backdrop-blur-md text-white p-3 rounded-xl border border-white/10 shadow-lg">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-emerald-500 text-neutral-950 px-1.5 py-0.5 rounded">
                              {result.garmentProductId}
                            </span>
                            <span className="font-bold text-sm truncate">{result.garmentName}</span>
                          </div>
                          <p className="text-xs text-neutral-300 font-semibold mt-0.5">
                            {formatPrice(result.garmentPrice, settings.currencySymbol)} • {result.garmentCategory}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-emerald-400 font-bold block">
                            ✓ AI Fit Complete
                          </span>
                          <span className="text-[10px] text-neutral-400">{result.customerName}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Comparison Side by Side */
                    <div className="grid grid-cols-2 gap-1.5 w-full aspect-4/5 max-h-[420px] p-2 bg-neutral-950">
                      <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        {result?.customerPhoto ? (
                          <img
                            src={result.customerPhoto}
                            alt="Original Customer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-neutral-600">👤</span>
                        )}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-neutral-950/80 text-white text-[10px] font-bold">
                          Original ({result.customerId})
                        </div>
                      </div>
                      <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                        {result?.resultImageUrl && !imageError ? (
                          <img
                            src={result.resultImageUrl}
                            alt="Virtual Try-On"
                            onError={() => setImageError(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl text-neutral-600">✨</span>
                        )}
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                          AI Trial Room
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 2. PROCESSING STATE */}
            {isProcessing && (
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 text-center space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-300 bg-neutral-100 shrink-0">
                    {result.customerPhoto ? (
                      <img src={result.customerPhoto} alt={result.customerName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👤</div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center animate-spin">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-300 bg-neutral-100 shrink-0">
                    {result.garmentPhoto ? (
                      <img src={result.garmentPhoto} alt={result.garmentName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👗</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-display font-bold text-base text-neutral-900">
                    Generating your fitting...
                  </h4>
                  <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                    Your virtual try-on is being prepared. The neural engine is synthesizing the drape and contours.
                  </p>
                </div>
              </div>
            )}

            {/* 3. FAILED STATE */}
            {isFailed && (
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                  <AlertCircle className="w-6 h-6" />
                </div>

                <div>
                  <h4 className="font-display font-bold text-base text-neutral-900">
                    Fitting Generation Failed
                  </h4>
                  <p className="text-xs text-neutral-600 mt-1 max-w-sm mx-auto">
                    {result.errorMessage || 'The virtual try-on provider encountered an issue while synthesizing this look. Credits are protected.'}
                  </p>
                </div>

                {/* Source Images Review */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-rose-200">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                      {result.customerPhoto ? (
                        <img src={result.customerPhoto} alt={result.customerName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">👤</div>
                      )}
                    </div>
                    <div className="text-left text-[11px]">
                      <span className="font-bold text-neutral-800 block truncate max-w-[100px]">{result.customerName}</span>
                      <span className="text-neutral-500 font-mono">{result.customerId}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-rose-200">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                      {result.garmentPhoto ? (
                        <img src={result.garmentPhoto} alt={result.garmentName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">👗</div>
                      )}
                    </div>
                    <div className="text-left text-[11px]">
                      <span className="font-bold text-neutral-800 block truncate max-w-[100px]">{result.garmentName}</span>
                      <span className="text-emerald-700 font-mono font-bold">{result.garmentProductId}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Details Pill Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Customer
                </span>
                <span className="text-xs font-bold text-neutral-900 truncate block mt-0.5">
                  {result.customerName} ({result.customerId})
                </span>
              </div>

              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Product SKU / Category
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 block mt-0.5">
                  {result.garmentProductId} ({result.garmentCategory})
                </span>
              </div>

              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Price
                </span>
                <span className="text-xs font-bold text-neutral-900 block mt-0.5">
                  {formatPrice(result.garmentPrice, settings.currencySymbol)}
                </span>
              </div>

              <div className="bg-neutral-50 p-2.5 rounded-xl border border-neutral-200">
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">
                  Date / Time
                </span>
                <span className="text-xs font-bold text-neutral-700 block mt-0.5 truncate">
                  {formattedDate} {formattedTime}
                </span>
              </div>
            </div>

            {/* Other Looks in this Customer's Active Session */}
            {isCompleted && sessionResults.length > 1 && (
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-neutral-800">
                    Other looks tried by {result.customerName.split(' ')[0]}:
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {sessionResults.map((look) => (
                    <button
                      key={look.id}
                      type="button"
                      onClick={() => onSelectSessionResult?.(look)}
                      className={`relative flex items-center gap-2 py-1 px-2 rounded-xl border transition-all shrink-0 ${
                        look.id === result.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs'
                      }`}
                    >
                      {look.resultImageUrl ? (
                        <img
                          src={look.resultImageUrl}
                          alt={look.garmentName}
                          className="w-6 h-6 rounded-md object-cover"
                        />
                      ) : (
                        <span className="w-6 h-6 rounded-md bg-neutral-200 flex items-center justify-center text-[10px]">✨</span>
                      )}
                      <span className="font-mono text-[11px]">{look.garmentProductId}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Buttons (Touch friendly & Responsive) */}
          <div className="p-4 sm:p-5 border-t border-neutral-200 bg-neutral-50 space-y-2.5">
            {isCompleted ? (
              <>
                {/* Primary High Visibility WhatsApp Share Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDirectWhatsApp}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={onTryAnotherGarment}
                    className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-98 text-white font-display font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <span>Try Another Garment</span>
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Save Result */}
                  <button
                    type="button"
                    onClick={onSaveResult}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all active:scale-98 cursor-pointer ${
                      isSaved
                        ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                        : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <BookmarkCheck className="w-3.5 h-3.5 text-neutral-600" />}
                    <span>{isSaved ? 'Saved' : 'Save Result'}</span>
                  </button>

                  {/* Download High Res Card */}
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-all active:scale-98 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-600" />
                    <span>{isDownloading ? 'Saving...' : 'Download Card'}</span>
                  </button>

                  {/* Customize Share text modal */}
                  <button
                    type="button"
                    onClick={onShareResult}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-xs font-bold transition-all active:scale-98 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-neutral-600" />
                    <span>Custom Share</span>
                  </button>
                </div>
              </>
            ) : isFailed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retry Fitting</span>
                  </button>
                )}
                {onBackToTrialRoom && (
                  <button
                    type="button"
                    onClick={onBackToTrialRoom}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Trial Room</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {onBackToTrialRoom && (
                  <button
                    type="button"
                    onClick={onBackToTrialRoom}
                    className="w-full py-3 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Trial Room</span>
                  </button>
                )}
                {onViewHistory && (
                  <button
                    type="button"
                    onClick={onViewHistory}
                    className="w-full py-3 px-4 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HistoryIcon className="w-4 h-4" />
                    <span>View History</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
