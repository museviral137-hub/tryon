import React, { useState, useEffect } from 'react';
import { NavTab, AIUsage, CreditTransaction, CreditTransactionType } from '../../types';
import { creditTransactionsApi } from '../../api/creditTransactions';
import {
  History,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  Gift,
  Filter,
  RefreshCw,
  Sparkles,
  Search,
  Calendar,
  Layers,
} from 'lucide-react';

interface CreditHistoryViewProps {
  aiUsage: AIUsage | null;
  onNavigate: (tab: NavTab) => void;
  onRefreshUsage: () => Promise<void>;
}

export const CreditHistoryView: React.FC<CreditHistoryViewProps> = ({
  aiUsage,
  onNavigate,
  onRefreshUsage,
}) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const remainingCredits = aiUsage?.remainingCredits ?? 0;
  const totalCredits = aiUsage?.totalCredits ?? 0;
  const usedCredits = aiUsage?.usedCredits ?? 0;

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await creditTransactionsApi.getTransactions();
      setTransactions(data);
    } catch (e) {
      console.warn('Failed to load transaction history', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([loadData(), onRefreshUsage()]);
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = tx.description?.toLowerCase().includes(q);
      const idMatch = tx.id?.toLowerCase().includes(q);
      if (!descMatch && !idMatch) return false;
    }
    return true;
  });

  const getTypeIcon = (type: CreditTransactionType) => {
    switch (type) {
      case 'deduction':
        return <ArrowDownLeft className="w-4 h-4 text-rose-500" />;
      case 'top_up':
        return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
      case 'refund':
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case 'grant':
        return <Gift className="w-4 h-4 text-purple-500" />;
      default:
        return <Coins className="w-4 h-4 text-amber-500" />;
    }
  };

  const getTypeBadge = (type: CreditTransactionType) => {
    switch (type) {
      case 'deduction':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            Virtual Try-On
          </span>
        );
      case 'top_up':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Credit Purchase
          </span>
        );
      case 'refund':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            System Refund
          </span>
        );
      case 'grant':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Welcome Grant
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-bold mb-2">
            <History className="w-3.5 h-3.5 text-neutral-600" />
            <span>Audit & Billing Ledger</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-neutral-900 tracking-tight">
            AI Credit History
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Complete transaction record of try-on deductions, credit top-ups, refunds, and initial grants.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 active:scale-98 transition-all cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('upgrade')}
            className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Upgrade Credits</span>
          </button>
        </div>
      </div>

      {/* Credit Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Remaining */}
        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white p-5 rounded-2xl border border-neutral-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-400">Available Credits</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-3xl text-amber-400">
              {remainingCredits}
            </span>
            <span className="text-xs text-neutral-400 font-bold">/ {totalCredits} Total</span>
          </div>
        </div>

        {/* Used */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">Credits Consumed</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-3xl text-neutral-900">
              {usedCredits}
            </span>
            <span className="text-xs text-neutral-400 font-bold">Try-Ons Rendered</span>
          </div>
        </div>

        {/* Total Ledger Entries */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-neutral-500">Total Transactions</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-display font-black text-3xl text-neutral-900">
              {transactions.length}
            </span>
            <span className="text-xs text-neutral-400 font-bold">Ledger Records</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description or ID..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/80 focus:bg-white border border-neutral-200 focus:border-emerald-500 rounded-xl outline-hidden text-neutral-900 placeholder:text-neutral-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'deduction', label: 'Try-Ons (-1)' },
            { id: 'top_up', label: 'Purchases (+)' },
            { id: 'refund', label: 'Refunds (+1)' },
            { id: 'grant', label: 'Grants' },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilterType(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === pill.id
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table & Responsive Cards */}
      <div className="bg-white rounded-3xl border border-neutral-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-300" />
            <span>Loading credit transaction history...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 text-xs space-y-2">
            <History className="w-8 h-8 mx-auto text-neutral-300" />
            <p className="font-semibold text-neutral-700">No transactions found</p>
            <p className="text-neutral-400">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Transactions will appear here when you run try-on previews or upgrade credits.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-500 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-center">Credits</th>
                    <th className="py-3 px-4 text-center">Amount</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                    <th className="py-3 px-4 text-right">Transaction ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    const dateStr = new Date(tx.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    // Payment status and display amount mapping
                    let paymentStatusText = 'Completed';
                    let paymentStatusBadge = 'bg-neutral-100 text-neutral-700 border-neutral-200';
                    let amountDisplay = '—';

                    if (tx.type === 'top_up') {
                      paymentStatusText = 'Paid';
                      paymentStatusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      amountDisplay = tx.pricePaid ? `₹${tx.pricePaid.toLocaleString('en-IN')}` : '₹499';
                    } else if (tx.type === 'refund') {
                      paymentStatusText = 'Refunded';
                      paymentStatusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                      amountDisplay = '—';
                    } else if (tx.type === 'grant') {
                      paymentStatusText = 'Granted';
                      paymentStatusBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                      amountDisplay = 'Free';
                    } else {
                      paymentStatusText = 'Completed';
                      paymentStatusBadge = 'bg-neutral-100 text-neutral-700 border-neutral-200';
                      amountDisplay = '—';
                    }

                    return (
                      <tr key={tx.id} className="hover:bg-neutral-50/70 transition-colors">
                        {/* Date */}
                        <td className="py-3.5 px-4 text-neutral-500 whitespace-nowrap">
                          {dateStr}
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                              {getTypeIcon(tx.type)}
                            </div>
                            <div>
                              <div className="text-neutral-900 font-bold">{tx.description}</div>
                              <div className="mt-0.5">{getTypeBadge(tx.type)}</div>
                            </div>
                          </div>
                        </td>

                        {/* Credits */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`font-display font-black text-sm ${
                              isPositive ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {isPositive ? `+${tx.amount}` : tx.amount}
                          </span>
                          <span className="text-[10px] text-neutral-400 block font-semibold">
                            {Math.abs(tx.amount) === 1 ? 'credit' : 'credits'}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-center font-bold text-neutral-900 whitespace-nowrap">
                          {amountDisplay}
                        </td>

                        {/* Payment Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${paymentStatusBadge}`}
                          >
                            {paymentStatusText}
                          </span>
                        </td>

                        {/* Transaction ID */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-[11px] font-mono text-neutral-400 select-all">
                            {tx.id.slice(0, 12)}...
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-neutral-100">
              {filteredTransactions.map((tx) => {
                const isPositive = tx.amount > 0;
                const dateStr = new Date(tx.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                let paymentStatusText = 'Completed';
                let paymentStatusBadge = 'bg-neutral-100 text-neutral-700 border-neutral-200';
                let amountDisplay = '—';

                if (tx.type === 'top_up') {
                  paymentStatusText = 'Paid';
                  paymentStatusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  amountDisplay = tx.pricePaid ? `₹${tx.pricePaid.toLocaleString('en-IN')}` : '₹499';
                } else if (tx.type === 'refund') {
                  paymentStatusText = 'Refunded';
                  paymentStatusBadge = 'bg-blue-50 text-blue-700 border-blue-200';
                  amountDisplay = '—';
                } else if (tx.type === 'grant') {
                  paymentStatusText = 'Granted';
                  paymentStatusBadge = 'bg-purple-50 text-purple-700 border-purple-200';
                  amountDisplay = 'Free';
                }

                return (
                  <div key={tx.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                          {getTypeIcon(tx.type)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-neutral-900">{tx.description}</div>
                          <div className="text-[10px] text-neutral-400">{dateStr}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-display font-black text-sm block ${
                            isPositive ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isPositive ? `+${tx.amount}` : tx.amount}{' '}
                          <span className="text-[10px] font-normal text-neutral-400">
                            {Math.abs(tx.amount) === 1 ? 'credit' : 'credits'}
                          </span>
                        </span>
                        {amountDisplay !== '—' && (
                          <span className="text-xs font-bold text-neutral-900">
                            {amountDisplay}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-neutral-50 text-neutral-500">
                      <span className="font-mono text-[10px] text-neutral-400 truncate max-w-[160px]">
                        ID: {tx.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${paymentStatusBadge}`}
                      >
                        {paymentStatusText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
