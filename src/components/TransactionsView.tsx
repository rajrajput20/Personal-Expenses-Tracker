import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Trash2,
  Edit2,
  Download,
  Upload,
  Plus,
  AlertCircle,
  FileSpreadsheet,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types/finance';
import { formatCurrency } from '../utils/math';
import { parseCSVToTransactions } from '../utils/csv';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: number) => void;
  onExportCSV: () => void;
  onImportTransactions: (imported: Transaction[]) => void;
  onClearData?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onExportCSV,
  onImportTransactions,
  onClearData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState<boolean>(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Categories list
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.category))).sort();
  }, [transactions]);

  // Payment methods list
  const uniqueMethods = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.payment_method))).sort();
  }, [transactions]);

  // Filtered and sorted transactions (FR-02: Newest first)
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesSearch =
          t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.transaction_date.includes(searchTerm);

        const matchesType = typeFilter === 'all' || t.transaction_type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const matchesMethod = methodFilter === 'all' || t.payment_method === methodFilter;

        return matchesSearch && matchesType && matchesCategory && matchesMethod;
      })
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id);
  }, [transactions, searchTerm, typeFilter, categoryFilter, methodFilter]);

  // Filtered sums for quick insight
  const filteredExpensesTotal = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.transaction_type === 'Expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  const filteredIncomeTotal = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.transaction_type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filteredTransactions]);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSVToTransactions(text);
        if (parsed.length === 0) {
          setImportError('No valid transaction rows found in CSV file.');
          return;
        }
        onImportTransactions(parsed);
      } catch (err: unknown) {
        setImportError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const pendingDeleteTx = transactions.find((t) => t.id === deleteConfirmId);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Transaction Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full transaction history with search, multi-field filtering, and CSV export
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Button (FR-10 / TC-09) */}
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-slate-300"
            title="Download records as standard CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* CSV Import Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-slate-300"
            title="Upload CSV to import transactions"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
          </button>

          {/* Clear All Data Button */}
          {transactions.length > 0 && onClearData && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
              title="Delete all transactions"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          )}

          {/* Add Transaction Button */}
          <button
            onClick={onAddTransaction}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {importError && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{importError}</span>
          </div>
          <button
            onClick={() => setImportError(null)}
            className="text-xs font-semibold underline hover:text-rose-900 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Ribbon */}
      <div className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search box */}
          <div className="relative md:col-span-4">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by category, note, date, or method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type filter segmented buttons */}
          <div className="md:col-span-3 flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer text-center ${
                typeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('Expense')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer text-center ${
                typeFilter === 'Expense'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Expense
            </button>
            <button
              onClick={() => setTypeFilter('Income')}
              className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer text-center ${
                typeFilter === 'Income'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Income
            </button>
          </div>

          {/* Category filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 cursor-pointer"
            >
              <option value="all">All Categories ({uniqueCategories.length})</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Payment method filter */}
          <div className="md:col-span-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 cursor-pointer"
            >
              <option value="all">All Methods</option>
              {uniqueMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Results Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-semibold text-slate-800 tabular-nums font-mono">{filteredTransactions.length}</span> of{' '}
              <span className="font-semibold text-slate-800 tabular-nums font-mono">{transactions.length}</span> transactions
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              Expenses: <span className="font-semibold text-rose-700 font-mono tabular-nums">{formatCurrency(filteredExpensesTotal)}</span>
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>
              Income: <span className="font-semibold text-emerald-700 font-mono tabular-nums">{formatCurrency(filteredIncomeTotal)}</span>
            </span>
          </div>

          {(searchTerm || typeFilter !== 'all' || categoryFilter !== 'all' || methodFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setCategoryFilter('all');
                setMethodFilter('all');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Transactions Table (FR-02) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-semibold w-16">ID</th>
                  <th className="py-3 px-4 font-semibold w-28">Date</th>
                  <th className="py-3 px-4 font-semibold w-24">Type</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Method</th>
                  <th className="py-3 px-4 font-semibold">Note / Description</th>
                  <th className="py-3 px-4 font-semibold text-right w-36">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      #{tx.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {tx.transaction_date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          tx.transaction_type === 'Income'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {tx.payment_method}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate" title={tx.note}>
                      {tx.note || <span className="text-slate-300 italic">None</span>}
                    </td>
                    <td
                      className={`py-3 px-4 font-semibold tabular-nums text-right whitespace-nowrap font-mono ${
                        tx.transaction_type === 'Income'
                          ? 'text-emerald-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {tx.transaction_type === 'Income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(tx.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">
              No transactions match your criteria
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your search terms or filters, or record a new transaction using the button below.
            </p>
            <button
              onClick={onAddTransaction}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Transaction</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (FR-03 & TC-05) */}
      {deleteConfirmId !== null && pendingDeleteTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Confirm Transaction Deletion
                </h3>
                <p className="text-xs text-slate-500">
                  This transaction will be permanently removed.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-semibold">#{pendingDeleteTx.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date:</span>
                <span className="font-mono">{pendingDeleteTx.transaction_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{pendingDeleteTx.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-semibold text-slate-900 tabular-nums font-mono">
                  {formatCurrency(pendingDeleteTx.amount)}
                </span>
              </div>
              {pendingDeleteTx.note && (
                <div className="flex justify-between border-t border-slate-200/60 pt-1">
                  <span className="text-slate-500">Note:</span>
                  <span className="text-slate-700 max-w-[200px] truncate">{pendingDeleteTx.note}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && onClearData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Clear All Data?
                </h3>
                <p className="text-xs text-slate-500">
                  This will delete all {transactions.length} transactions and reset your budget limits.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              This action cannot be undone. You may want to export your records to CSV first before clearing.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearAllModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearData();
                  setIsClearAllModalOpen(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
