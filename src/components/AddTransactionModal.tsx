import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Calendar, Tag, CreditCard, FileText } from 'lucide-react';
import { Transaction, TransactionType, PaymentMethod } from '../types/finance';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Omit<Transaction, 'id' | 'created_at'>, existingId?: number) => void;
  initialTransaction?: Transaction | null;
}

const CATEGORIES = {
  Expense: [
    'Food',
    'Rent',
    'Utilities',
    'Transport',
    'Shopping',
    'Healthcare',
    'Entertainment',
    'Education',
    'Personal Care',
    'Other',
  ],
  Income: [
    'Salary',
    'Freelance',
    'Business',
    'Investment',
    'Gift / Bonus',
    'Rental Income',
    'Other',
  ],
};

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Card', 'Cash', 'Bank Transfer', 'Other'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
}) => {
  const [date, setDate] = useState<string>('');
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState<string>('Food');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialTransaction) {
      setDate(initialTransaction.transaction_date);
      setType(initialTransaction.transaction_type);
      setCategory(initialTransaction.category);
      setAmount(initialTransaction.amount.toString());
      setPaymentMethod(initialTransaction.payment_method);
      setNote(initialTransaction.note || '');
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setDate(today);
      setType('Expense');
      setCategory('Food');
      setAmount('');
      setPaymentMethod('UPI');
      setNote('');
    }
    setErrorMsg(null);
  }, [initialTransaction, isOpen]);

  // When type changes, adjust category default if needed
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'Income' && !CATEGORIES.Income.includes(category)) {
      setCategory(CATEGORIES.Income[0]);
    } else if (newType === 'Expense' && !CATEGORIES.Expense.includes(category)) {
      setCategory(CATEGORIES.Expense[0]);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Date validation (FR-01 / TC-04)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setErrorMsg('Invalid date format. Expected YYYY-MM-DD.');
      return;
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      setErrorMsg('Date must represent a valid calendar date.');
      return;
    }

    // Amount validation (FR-01 / TC-03)
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Amount must be a positive numeric value greater than zero.');
      return;
    }

    if (!category.trim()) {
      setErrorMsg('Category is required.');
      return;
    }

    onSave(
      {
        transaction_date: date,
        transaction_type: type,
        category: category.trim(),
        amount: Math.round(numAmount * 100) / 100,
        payment_method: paymentMethod,
        note: note.trim(),
      },
      initialTransaction ? initialTransaction.id : undefined
    );
    onClose();
  };

  const currentCategoryList = type === 'Expense' ? CATEGORIES.Expense : CATEGORIES.Income;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialTransaction ? 'Edit Transaction' : 'Record New Transaction'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter transaction details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('Expense')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  type === 'Expense'
                    ? 'bg-white text-rose-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Expense (-)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('Income')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  type === 'Income'
                    ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Income (+)
              </button>
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-mono text-sm">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-semibold"
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentCategoryList.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {currentCategoryList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Note / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Note / Description (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery shopping, Client invoice, Metro recharge"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{initialTransaction ? 'Save Changes' : 'Record Transaction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
