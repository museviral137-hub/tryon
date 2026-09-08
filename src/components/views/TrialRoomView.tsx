import React, { useState } from 'react';
import { Customer, Garment, TryOnResult, ShopSettings, AIUsage, NavTab, LegalTab } from '../../types';
import { CustomerSelectorCard } from '../trial/CustomerSelectorCard';
import { GarmentSearchInput } from '../trial/GarmentSearchInput';
import { DetectedGarmentCard } from '../trial/DetectedGarmentCard';
import { ProcessingModal } from '../trial/ProcessingModal';
import { ResultViewModal } from '../trial/ResultViewModal';
import { ShareModal } from '../trial/ShareModal';
import { CustomerSelectorModal } from '../trial/CustomerSelectorModal';
import { ProductSelectorModal } from '../trial/ProductSelectorModal';
import { CameraCaptureModal } from '../common/CameraCaptureModal';
import { SessionLooksBar } from '../trial/SessionLooksBar';
import { tryOnService, TryOnProgressPhase } from '../../services/tryOnService';
import { LegalNavModal } from '../legal/LegalNavModal';
import {
  Sparkles,
  Plus,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Coins,
} from 'lucide-react';

interface TrialRoomViewProps {
  settings: ShopSettings;
  garments: Garment[];
  customers: Customer[];
  tryOns: TryOnResult[];
  aiUsage?: AIUsage;
  selectedCustomer: Customer | null;
  selectedGarment: Garment | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onSelectGarment: (garment: Garment | null) => void;
  onSaveTryOnResult: (result: TryOnResult) => void;
  onOpenAddGarment: () => void;
  onOpenAddCustomer: () => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
  onTopUpCredits?: () => Promise<void> | void;
  onRefreshUsage?: () => Promise<void> | void;
  onNavigateToHistory?: () => void;
  onNavigate?: (tab: NavTab) => void;
}

export const TrialRoomView: React.FC<TrialRoomViewProps> = ({
  settings,
  garments,
  customers,
  tryOns,
  aiUsage,
  selectedCustomer,
  selectedGarment,
  onSelectCustomer,
  onSelectGarment,
  onSaveTryOnResult,
  onOpenAddGarment,
  onOpenAddCustomer,
  onShowToast,
  onTopUpCredits,
  onRefreshUsage,
  onNavigateToHistory,
  onNavigate,
}) => {
  const isGeneratingRef = React.useRef(false);
  const [isToppingUpCredits, setIsToppingUpCredits] = useState(false);
  // Modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPhase, setProcessingPhase] = useState<TryOnProgressPhase>('preparing');
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<TryOnResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSavedInSession, setIsSavedInSession] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [wasCreditRefunded, setWasCreditRefunded] = useState(false);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalTab | null>(null);

  // Filter current active session looks for the selected customer
  const currentCustomerLooks = selectedCustomer
    ? tryOns.filter(
        (t) =>
          t.customerId === selectedCustomer.customerId ||
          t.customerId === selectedCustomer.id
      )
    : [];

  // Trigger one real trial generation
  const handleStartGeneration = async () => {
    if (!selectedCustomer) {
      onShowToast('Customer Required', 'Please select or upload a customer photo first.', 'warning');
      return;
    }
    if (!selectedGarment) {
      onShowToast('Garment Required', 'Please type a SKU / Product ID or choose a garment.', 'warning');
      return;
    }

    if (
      selectedGarment.category.toLowerCase().includes('unstitched') ||
      selectedGarment.category.toLowerCase().includes('fabric roll') ||
      selectedGarment.category.toLowerCase().includes('dupatta') ||
      selectedGarment.category.toLowerCase().includes('shawl')
    ) {
      onShowToast(
        'Category Unsupported',
        'Virtual Try-On for unstitched raw fabrics and drapes is not supported. Please select a stitched garment (Dresses, Sarees, Lehengas, Kurtis, Tops, or Bottoms).',
        'warning'
      );
      return;
    }

    // Check credits before launching trial request
    let currentRemaining = aiUsage?.remainingCredits;
    if (currentRemaining === undefined || currentRemaining === 0) {
      try {
        const checked = await tryOnService.checkCredits();
        currentRemaining = checked.remaining;
      } catch {
        currentRemaining = -1;
      }
    }

    // Only block if explicitly confirmed as 0 remaining credits
    if (currentRemaining === 0) {
      setShowCreditWarning(true);
      return;
    }

    if (isGeneratingRef.current || isProcessing) return;
    isGeneratingRef.current = true;

    setHasError(false);
    setErrorMessage(null);
    setWasCreditRefunded(false);
    setIsProcessing(true);
    setProcessingPhase('preparing');
    setProcessingMessage('Initiating boutique virtual fitting request...');

    try {
      const result = await tryOnService.generateTryOn({
        customer: selectedCustomer,
        garment: selectedGarment,
        settings,
        onPhaseChange: (phase, message) => {
          setProcessingPhase(phase);
          setProcessingMessage(message);
        },
      });

      setCurrentResult(result);
      setIsProcessing(false);
      setShowResultModal(true);
      setIsSavedInSession(true);
      
      // Automatically record result into history
      onSaveTryOnResult(result);
      onShowToast('Try-On Ready', `AI virtual fit generated for ${selectedCustomer.name}.`, 'success');
      try {
        await onRefreshUsage?.();
      } catch {
        // Ignore refresh error
      }
    } catch (e: any) {
      const errMsg = e?.message || 'Could not synthesize trial preview. Please retry.';
      
      // If error is strictly confirmed as insufficient credits, show credit dialog directly
      if (e?.code === 'INSUFFICIENT_CREDITS') {
        setIsProcessing(false);
        setShowCreditWarning(true);
        onShowToast('Credits Needed', 'Please top up AI credits to run virtual try-on.', 'warning');
        try {
          await onRefreshUsage?.();
        } catch {
          // Ignore refresh error
        }
        return;
      }

      console.warn('Trial generation notice:', errMsg);
      setHasError(true);
      setErrorMessage(errMsg);

      // Refund messaging must ONLY appear when credit was deducted AND an actual downstream failure triggered a refund
      const wasRefunded = Boolean(e?.wasRefunded === true && e?.creditDeducted === true);
      setWasCreditRefunded(wasRefunded);

      // Record failed tryon in local history state for complete tracking
      const failedRecord: TryOnResult = {
        id: `failed-${Date.now()}`,
        customerId: selectedCustomer.customerId || selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhoto: selectedCustomer.imageUrl,
        customerPhone: selectedCustomer.phone,
        garmentId: selectedGarment.id,
        garmentProductId: selectedGarment.productId,
        garmentName: selectedGarment.name,
        garmentPhoto: selectedGarment.imageUrl,
        garmentPrice: selectedGarment.price,
        garmentCategory: selectedGarment.category,
        createdAt: new Date().toISOString(),
        status: 'Failed',
        errorMessage: errMsg,
      };
      onSaveTryOnResult(failedRecord);

      onShowToast('Trial Error', errMsg, 'error');
      // Refresh credit balance from database to keep UI in exact sync
      try {
        await onRefreshUsage?.();
      } catch {
        // Ignore refresh error
      }
    } finally {
      isGeneratingRef.current = false;
    }
  };

  const handleQuickCustomerCapture = (dataUrl: string) => {
    const tempCustomer: Customer = {
      id: `c-quick-${Date.now()}`,
      customerId: `C${Math.floor(100 + Math.random() * 900)}`,
      name: 'Walk-in Customer',
      phone: '+91 ',
      imageUrl: dataUrl,
      createdAt: new Date().toISOString(),
      tryOnCount: 1,
      consentAgreed: true,
    };
    onSelectCustomer(tempCustomer);
    onShowToast('Customer Photo Set', 'Photo ready for trial room.', 'success');
  };

  // Multiple Garments for One Customer (Keep customer photo, clear garment)
  const handleTryAnother = () => {
    setShowResultModal(false);
    onSelectGarment(null); // Keep customer, clear garment so staff can type another SKU!
    onShowToast(
      'Ready for Next Garment',
      `Customer ${selectedCustomer?.name} kept active. Type or pick new garment.`,
      'info'
    );
  };

  const handleSaveResultExplicit = () => {
    if (currentResult) {
      onSaveTryOnResult(currentResult);
      setIsSavedInSession(true);
      onShowToast('Result Saved', 'Saved to Try-On History successfully.', 'success');
    }
  };

  const isUnsupportedGarment = Boolean(
    selectedGarment &&
      (selectedGarment.category.toLowerCase().includes('unstitched') ||
        selectedGarment.category.toLowerCase().includes('fabric roll') ||
        selectedGarment.category.toLowerCase().includes('dupatta') ||
        selectedGarment.category.toLowerCase().includes('shawl'))
  );

  const isReadyToGenerate = Boolean(
    selectedCustomer && selectedGarment && !isUnsupportedGarment && !isProcessing
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1.5">
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Instant AI Fitting Engine</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
              AI Trial Room
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
              Select customer photo → Enter SKU/Product ID → Generate & share on WhatsApp.
            </p>
          </div>

          {/* AI Credits Badge */}
          {aiUsage && (
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 p-2 px-3 rounded-2xl border text-xs ${
                  aiUsage.remainingCredits <= 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                    : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                }`}
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-bold">{aiUsage.remainingCredits} Credits left</span>
              </div>
              {aiUsage.remainingCredits <= 0 && onTopUpCredits && (
                <button
                  type="button"
                  disabled={isToppingUpCredits}
                  onClick={async () => {
                    try {
                      setIsToppingUpCredits(true);
                      await onTopUpCredits();
                      onShowToast('Credits Recharged', '+50 AI trial credits added to boutique.', 'success');
                    } catch {
                      onShowToast('Top-up Error', 'Could not recharge credits. Please try from Settings.', 'error');
                    } finally {
                      setIsToppingUpCredits(false);
                    }
                  }}
                  className="py-2 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isToppingUpCredits ? 'Recharging...' : '+ Top Up Credits'}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Zero Credits Alert Banner */}
        {aiUsage && aiUsage.remainingCredits <= 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Boutique AI Credits Exhausted (0 Remaining)</p>
                <p className="text-[11px] text-amber-700">
                  Virtual Try-On requires AI credits. Click Top Up to add 50 simulation credits.
                </p>
              </div>
            </div>
            {onTopUpCredits && (
              <button
                type="button"
                disabled={isToppingUpCredits}
                onClick={async () => {
                  try {
                    setIsToppingUpCredits(true);
                    await onTopUpCredits();
                    onShowToast('Credits Added', '+50 AI trial credits recharged successfully.', 'success');
                  } catch {
                    onShowToast('Top-up Error', 'Could not recharge credits.', 'error');
                  } finally {
                    setIsToppingUpCredits(false);
                  }
                }}
                className="shrink-0 py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isToppingUpCredits ? 'Recharging...' : 'Top Up +50 Credits'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Primary 3-Step Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* STEP 1: CUSTOMER */}
        <div className="space-y-2">
          <CustomerSelectorCard
            selectedCustomer={selectedCustomer}
            onBrowseCustomers={() => setShowCustomerModal(true)}
            onAddNewCustomer={onOpenAddCustomer}
            onCaptureCamera={() => setShowCameraModal(true)}
            onClearCustomer={() => onSelectCustomer(null)}
            consentAgreed={consentAgreed}
            onConsentChange={setConsentAgreed}
          />
        </div>

        {/* STEP 2: GARMENT SEARCH & PRODUCT ID */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-neutral-200/90 p-4 sm:p-5 shadow-xs">
            {/* Step Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-display font-bold text-sm sm:text-base text-neutral-900">
                  Choose Garment
                </h3>
              </div>
              {selectedGarment && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Detected
                </span>
              )}
            </div>

            {/* Smart Product Search Box */}
            <GarmentSearchInput
              garments={garments}
              selectedGarment={selectedGarment}
              onSelectGarment={(g) => onSelectGarment(g)}
              onBrowseGarments={() => setShowProductModal(true)}
              onAddNewGarment={onOpenAddGarment}
            />

            {/* Detected Garment Details or Quick Hints */}
            <div className="mt-3">
              {selectedGarment ? (
                <DetectedGarmentCard
                  garment={selectedGarment}
                  onChangeGarment={() => setShowProductModal(true)}
                  onClearGarment={() => onSelectGarment(null)}
                />
              ) : (
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/70 text-xs text-neutral-500 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <span className="font-bold text-neutral-700">Quick tip:</span> Type SKU like{' '}
                    <span className="font-mono font-bold text-neutral-900 bg-white px-1 py-0.5 rounded border border-neutral-200">J2</span>{' '}
                    or <span className="font-mono font-bold text-neutral-900 bg-white px-1 py-0.5 rounded border border-neutral-200">J002</span>{' '}
                    to instantly detect garment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Looks Bar */}
      {selectedCustomer && currentCustomerLooks.length > 0 && (
        <SessionLooksBar
          customer={selectedCustomer}
          sessionResults={currentCustomerLooks}
          activeResultId={currentResult?.id}
          onSelectResult={(look) => {
            setCurrentResult(look);
            setShowResultModal(true);
          }}
          onTryAnotherGarment={handleTryAnother}
          currencySymbol={settings.currencySymbol}
        />
      )}

      {/* STEP 3: TRY-ON PREVIEW EQUATION & GENERATE ACTION */}
      <div className="bg-white rounded-3xl border-2 border-neutral-200 p-5 sm:p-7 shadow-lg">
        <div className="text-center max-w-md mx-auto mb-6">
          <span className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center mb-2 shadow-xs">
            3
          </span>
          <h3 className="font-display font-black text-lg sm:text-xl text-neutral-900">
            Generate Virtual Try-On
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Combines customer photo with selected garment for realistic boutique fitting
          </p>
        </div>

        {/* Diagnostic Metadata Status Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/90 text-xs text-neutral-700 mb-6 max-w-2xl mx-auto">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Customer</span>
            <span className="font-bold text-neutral-900 truncate block">
              {selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.customerId})` : 'Not Selected'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Garment</span>
            <span className="font-bold text-neutral-900 truncate block">
              {selectedGarment ? `${selectedGarment.name} (${selectedGarment.productId})` : 'Not Selected'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Category</span>
            <span
              className={`font-bold truncate block ${
                isUnsupportedGarment ? 'text-amber-600' : 'text-emerald-700'
              }`}
            >
              {selectedGarment ? selectedGarment.category : '—'}
              {isUnsupportedGarment && ' (Unsupported)'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">AI Credit</span>
            <span className="font-bold text-amber-700 truncate block">
              {aiUsage ? `${aiUsage.remainingCredits} Remaining` : '0 Remaining'}
            </span>
          </div>
        </div>

        {/* Visual Pair Equation */}
        <div className="flex items-center justify-center gap-2 sm:gap-6 mb-8 max-w-xl mx-auto">
          {/* Customer Avatar Box */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-[130px] rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-sm flex items-center justify-center">
              {selectedCustomer?.imageUrl ? (
                <img
                  src={selectedCustomer.imageUrl}
                  alt={selectedCustomer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <span className="text-2xl block mb-1">👤</span>
                  <span className="text-[10px] font-bold text-neutral-400">Customer</span>
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-neutral-800 truncate max-w-[120px] mt-2">
              {selectedCustomer ? selectedCustomer.name : 'No Customer'}
            </span>
          </div>

          {/* Plus Sign */}
          <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-500 font-bold flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4" />
          </div>

          {/* Garment Box */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-[130px] rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-sm flex items-center justify-center">
              {selectedGarment?.imageUrl ? (
                <img
                  src={selectedGarment.imageUrl}
                  alt={selectedGarment.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-2">
                  <span className="text-2xl block mb-1">👗</span>
                  <span className="text-[10px] font-bold text-neutral-400">Garment</span>
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-neutral-800 truncate max-w-[120px] mt-2">
              {selectedGarment ? `${selectedGarment.productId} - ${selectedGarment.name}` : 'No Garment'}
            </span>
          </div>

          {/* Equals Sign */}
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
            =
          </div>

          {/* Result Placeholder / Icon */}
          <div className="flex-1 flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-[130px] rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 border-2 border-emerald-300 shadow-sm flex items-center justify-center text-emerald-700">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-emerald-800 mt-2">AI Fit Result</span>
          </div>
        </div>

        {/* Big Generate AI Try-On Button */}
        <div className="max-w-md mx-auto space-y-3">
          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={!isReadyToGenerate}
            className={`w-full py-4 px-6 rounded-2xl font-display font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-98 cursor-pointer ${
              isReadyToGenerate
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed shadow-none'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate AI Try-On</span>
          </button>

          {!isReadyToGenerate ? (
            <p className="text-center text-xs text-neutral-400 mt-2 font-medium">
              {!selectedCustomer && !selectedGarment
                ? 'Select a customer and enter a SKU above to begin'
                : !selectedCustomer
                ? 'Please select a customer photo'
                : !selectedGarment
                ? 'Please type a SKU or choose a garment'
                : isUnsupportedGarment
                ? 'Sarees/unstitched drapes are not supported for AI fitting. Please pick a stitched garment.'
                : 'Processing...'}
            </p>
          ) : (
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI visual simulation only • Actual fit & drape may vary</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-400">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate('ai-disclaimer');
                    else setActiveLegalModal('ai-disclaimer');
                  }}
                  className="hover:text-emerald-700 hover:underline"
                >
                  AI Disclaimer
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate('photo-consent');
                    else setActiveLegalModal('photo-consent');
                  }}
                  className="hover:text-emerald-700 hover:underline"
                >
                  Photo Consent
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate('refund-policy');
                    else setActiveLegalModal('refund-policy');
                  }}
                  className="hover:text-emerald-700 hover:underline"
                >
                  Refund Policy
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ProcessingModal
        isOpen={isProcessing}
        customer={selectedCustomer}
        garment={selectedGarment}
        onCancel={() => setIsProcessing(false)}
        hasError={hasError}
        errorMessage={errorMessage}
        onRetry={handleStartGeneration}
        onTopUpCredits={onTopUpCredits}
        phase={processingPhase}
        phaseMessage={processingMessage}
        wasRefunded={wasCreditRefunded}
      />

      <ResultViewModal
        isOpen={showResultModal}
        result={currentResult}
        settings={settings}
        isSaved={isSavedInSession}
        onSaveResult={handleSaveResultExplicit}
        onShareResult={() => setShowShareModal(true)}
        onTryAnotherGarment={handleTryAnother}
        onRetry={handleStartGeneration}
        onBackToTrialRoom={() => setShowResultModal(false)}
        onViewHistory={() => {
          setShowResultModal(false);
          onNavigateToHistory?.();
        }}
        onClose={() => setShowResultModal(false)}
        sessionResults={currentCustomerLooks}
        onSelectSessionResult={(look) => {
          setCurrentResult(look);
        }}
      />

      <ShareModal
        isOpen={showShareModal}
        result={currentResult}
        settings={settings}
        onClose={() => setShowShareModal(false)}
        onShowToast={onShowToast}
      />

      <CustomerSelectorModal
        isOpen={showCustomerModal}
        customers={customers}
        selectedCustomerId={selectedCustomer?.id}
        onSelect={(c) => {
          onSelectCustomer(c);
          onShowToast('Customer Selected', `${c.name} (${c.customerId})`, 'info');
        }}
        onAddNewCustomer={onOpenAddCustomer}
        onClose={() => setShowCustomerModal(false)}
      />

      <ProductSelectorModal
        isOpen={showProductModal}
        garments={garments}
        selectedGarmentId={selectedGarment?.id}
        onSelect={(g) => {
          onSelectGarment(g);
          onShowToast('Garment Selected', `${g.productId} — ${g.name}`, 'info');
        }}
        onAddNewGarment={onOpenAddGarment}
        onClose={() => setShowProductModal(false)}
      />

      <CameraCaptureModal
        isOpen={showCameraModal}
        title="Customer Photo for Trial"
        onCapture={handleQuickCustomerCapture}
        onClose={() => setShowCameraModal(false)}
      />

      {/* Credit Warning Modal */}
      {showCreditWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-neutral-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="font-display font-black text-lg text-neutral-900">
              AI Credits Exhausted
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-5">
              You have 0 AI fitting credits remaining. Upgrade your boutique package to continue offering live virtual try-on sessions.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowCreditWarning(false);
                  onNavigate?.('upgrade');
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-display font-bold text-xs shadow-md cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Upgrade AI Credits</span>
              </button>
              <button
                type="button"
                disabled={isToppingUpCredits}
                onClick={async () => {
                  try {
                    setIsToppingUpCredits(true);
                    await onTopUpCredits?.();
                    setShowCreditWarning(false);
                    onShowToast('Credits Added', 'Added +50 AI trial credits.', 'success');
                  } catch {
                    onShowToast('Top-up Error', 'Could not recharge credits.', 'error');
                  } finally {
                    setIsToppingUpCredits(false);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs cursor-pointer transition-colors"
              >
                {isToppingUpCredits ? 'Adding Trial Credits...' : 'Quick Top Up +50 Free Trial Credits'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreditWarning(false)}
                className="w-full py-2 px-4 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-semibold text-xs cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Document Viewer Modal */}
      {activeLegalModal && (
        <LegalNavModal
          isOpen={Boolean(activeLegalModal)}
          initialTab={activeLegalModal}
          onClose={() => setActiveLegalModal(null)}
          onNavigateToFullView={(tab) => {
            setActiveLegalModal(null);
            onNavigate?.(tab);
          }}
        />
      )}
    </div>
  );
};
