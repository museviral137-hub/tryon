import React, { useState, useMemo } from 'react';
import { TryOnResult, ShopSettings, TryOnStatus } from '../../types';
import {
  History,
  Search,
  Share2,
  Trash2,
  Calendar,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { ResultViewModal } from '../trial/ResultViewModal';
import { ShareModal } from '../trial/ShareModal';
import { formatPrice } from '../../utils/currency';

interface HistoryViewProps {
  tryOns: TryOnResult[];
  settings: ShopSettings;
  onDeleteTryOn: (id: string) => void;
  onStartNewTryOn: () => void;
  onRetryTryOn?: (result: TryOnResult) => void;
  onShowToast: (title: string, desc?: string, type?: 'success' | 'info' | 'error' | 'warning') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  tryOns,
  settings,
  onDeleteTryOn,
  onStartNewTryOn,
  onRetryTryOn,
  onShowToast,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TryOnStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');
  const [selectedResult, setSelectedResult] = useState<TryOnResult | null>(null);
  const [shareResult, setShareResult] = useState<TryOnResult | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<TryOnResult | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // Counts for tabs
  const completedCount = useMemo(() => tryOns.filter((t) => (t.status || 'Completed') === 'Completed').length, [tryOns]);
  const processingCount = useMemo(() => tryOns.filter((t) => t.status === 'Processing').length, [tryOns]);
  const failedCount = useMemo(() => tryOns.filter((t) => t.status === 'Failed').length, [tryOns]);

  // Filter & Search
  const filtered = useMemo(() => {
    return tryOns.filter((t) => {
      const status = t.status || 'Completed';
      if (statusFilter !== 'all' && status !== statusFilter) {
        return false;
      }

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        t.customerName.toLowerCase().includes(q) ||
        t.customerId.toLowerCase().includes(q) ||
        t.garmentName.toLowerCase().includes(q) ||
        t.garmentProductId.toLowerCase().includes(q) ||
        (t.garmentCategory && t.garmentCategory.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (dateFilter === 'today') {
        const todayStr = new Date().toDateString();
        return new Date(t.createdAt).toDateString() === todayStr;
      }
      if (dateFilter === 'week') {
        const itemTime = new Date(t.createdAt).getTime();
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return itemTime >= oneWeekAgo;
      }

      return true;
    });
  }, [tryOns, search, statusFilter, dateFilter]);

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-3xl border border-neutral-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-black text-xl sm:text-2xl text-neutral-900">
              Try-On History
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {tryOns.length} Trials
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
            Browse, re-share, or manage past boutique customer trial fittings.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewTryOn}
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ New AI Try-On</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 space-y-3 shadow-xs">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, ID, garment name or SKU (e.g. J001)..."
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 placeholder:text-neutral-400 outline-hidden focus:bg-white focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Date Filter Tabs */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl shrink-0">
            {(
              [
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Last 7 Days' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  dateFilter === tab.id
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-neutral-100">
          <span className="text-[11px] font-bold text-neutral-400 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All ({tryOns.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Completed')}
            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed ({completedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Processing')}
            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Processing'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>In Progress ({processingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('Failed')}
            className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'Failed'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>Failed ({failedCount})</span>
          </button>
        </div>
      </div>

      {/* History Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map((item) => {
            const status = item.status || 'Completed';
            const isItemCompleted = status === 'Completed';
            const isItemProcessing = status === 'Processing';
            const isItemFailed = status === 'Failed';
            const isBroken = brokenImages[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-3 sm:p-4 border border-neutral-200/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div
                    onClick={() => setSelectedResult(item)}
                    className="relative aspect-4/3 w-full rounded-xl overflow-hidden bg-neutral-100 mb-3 border border-neutral-200 cursor-pointer flex items-center justify-center"
                  >
                    {isItemCompleted ? (
                      item.resultImageUrl && !isBroken ? (
                        <img
                          src={item.resultImageUrl}
                          alt="Try on preview"
                          onError={() => handleImageError(item.id)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Sparkles className="w-8 h-8 text-emerald-500 mb-1" />
                          <span className="text-xs font-bold text-neutral-600">Fitting Completed</span>
                        </div>
                      )
                    ) : isItemProcessing ? (
                      <div className="flex flex-col items-center justify-center p-4 text-center bg-amber-50/50 w-full h-full">
                        <Clock className="w-8 h-8 text-amber-500 animate-spin mb-1.5" />
                        <span className="text-xs font-bold text-amber-900">Generating fitting...</span>
                        <span className="text-[10px] text-amber-600 mt-0.5">Processing at AI engine</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center bg-rose-50/50 w-full h-full">
                        <AlertCircle className="w-8 h-8 text-rose-500 mb-1.5" />
                        <span className="text-xs font-bold text-rose-900">Fitting Failed</span>
                        <span className="text-[10px] text-rose-600 mt-0.5 truncate max-w-[180px]">
                          {item.errorMessage || 'Provider generation failed'}
                        </span>
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-neutral-950/85 text-white font-mono text-xs font-black">
                      {item.garmentProductId}
                    </div>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs ${
                          isItemCompleted
                            ? 'bg-emerald-600 text-white'
                            : isItemProcessing
                            ? 'bg-amber-500 text-white'
                            : 'bg-rose-600 text-white'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-neutral-950/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                      <span className="bg-neutral-900/90 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{isItemCompleted ? 'View Fitting' : isItemProcessing ? 'Check Status' : 'View Details'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Meta details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-neutral-900 truncate">
                        {item.customerName}
                      </h3>
                      <span className="font-mono text-xs text-neutral-500 font-semibold">
                        {item.customerId}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-600">
                      <span className="truncate font-medium">{item.garmentName}</span>
                      <span className="font-bold text-neutral-900 shrink-0">
                        {formatPrice(item.garmentPrice, settings.currencySymbol)}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-400">
                      <span>Category: </span>
                      <span className="font-semibold text-neutral-600">{item.garmentCategory}</span>
                    </div>

                    {isItemFailed && item.errorMessage && (
                      <p className="text-[11px] text-rose-600 font-medium bg-rose-50 p-1.5 rounded-lg border border-rose-100 line-clamp-2 mt-1">
                        {item.errorMessage}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-neutral-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-3 mt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setSelectedResult(item)}
                    className="py-1.5 px-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>

                  {isItemCompleted ? (
                    <button
                      type="button"
                      onClick={() => setShareResult(item)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Share</span>
                    </button>
                  ) : isItemFailed && onRetryTryOn ? (
                    <button
                      type="button"
                      onClick={() => onRetryTryOn(item)}
                      className="py-1.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Retry</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedResult(item)}
                      className="py-1.5 px-2 rounded-xl bg-neutral-50 hover:bg-neutral-100 text-neutral-600 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-neutral-500" />
                      <span>Status</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(item)}
                    className="py-1.5 px-2 rounded-xl border border-neutral-200 hover:bg-rose-50 hover:text-rose-700 text-neutral-500 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title={tryOns.length === 0 ? 'No try-on history yet' : 'No matching sessions'}
          description={
            tryOns.length === 0
              ? 'Run your first AI try-on from the Trial Room to build your fitting gallery.'
              : 'Try searching with a different customer name, garment SKU, or clearing filters.'
          }
          actionText={tryOns.length === 0 ? 'Start AI Try-On' : 'Clear Filters'}
          onAction={
            tryOns.length === 0
              ? onStartNewTryOn
              : () => {
                  setSearch('');
                  setStatusFilter('all');
                  setDateFilter('all');
                }
          }
          actionIcon={Sparkles}
        />
      )}

      {/* Result View Modal */}
      <ResultViewModal
        isOpen={Boolean(selectedResult)}
        result={selectedResult}
        settings={settings}
        isSaved={true}
        onSaveResult={() => {}}
        onShareResult={() => {
          setShareResult(selectedResult);
        }}
        onTryAnotherGarment={() => {
          setSelectedResult(null);
          onStartNewTryOn();
        }}
        onRetry={
          selectedResult && onRetryTryOn
            ? () => {
                const res = selectedResult;
                setSelectedResult(null);
                onRetryTryOn(res);
              }
            : undefined
        }
        onBackToTrialRoom={() => {
          setSelectedResult(null);
          onStartNewTryOn();
        }}
        onViewHistory={() => setSelectedResult(null)}
        onClose={() => setSelectedResult(null)}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={Boolean(shareResult)}
        result={shareResult}
        settings={settings}
        onClose={() => setShareResult(null)}
        onShowToast={onShowToast}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        title="Delete Try-On Record?"
        message={`Are you sure you want to delete the trial fitting record for ${deleteCandidate?.customerName} (${deleteCandidate?.garmentProductId})?`}
        confirmText="Delete Record"
        isDestructive
        onConfirm={() => {
          if (deleteCandidate) {
            onDeleteTryOn(deleteCandidate.id);
            setDeleteCandidate(null);
            onShowToast('Record Deleted', 'Try-on record removed from history.', 'info');
          }
        }}
        onCancel={() => setDeleteCandidate(null)}
      />
    </div>
  );
};
