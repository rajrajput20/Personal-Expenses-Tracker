import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Check,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { MonthlyBudget, Transaction } from '../types/finance';
import { formatCurrency, formatMonthName } from '../utils/math';

interface BudgetViewProps {
  budgets: MonthlyBudget[];
  transactions: Transaction[];
  onSaveBudget: (year: number, month: number, limit: number) => void;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  transactions,
  onSaveBudget,
}) => {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [limitInput, setLimitInput] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Current active budget for chosen year/month
  const currentBudget = budgets.find(
    (b) => b.budget_year === selectedYear && b.budget_month === selectedMonth
  );

  // Actual expenses for chosen year/month
  const targetYearMonth = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const actualExpense = transactions
    .filter(
      (t) => t.transaction_type === 'Expense' && t.transaction_date.startsWith(targetYearMonth)
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const budgetLimit = currentBudget ? Number(currentBudget.monthly_limit) : 0;
  const usagePercentage = budgetLimit > 0 ? (actualExpense / budgetLimit) * 100 : 0;
  const remaining = budgetLimit - actualExpense;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsedLimit = parseFloat(limitInput);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setErrorMsg('Monthly budget limit must be a positive number greater than 0.');
      return;
    }

    onSaveBudget(selectedYear, selectedMonth, parsedLimit);
    setSaveSuccessMsg(`Budget of ${formatCurrency(parsedLimit)} saved for ${formatMonthName(targetYearMonth)}`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
    setLimitInput('');
  };

  const handleApplyPreset = (amount: number) => {
    setLimitInput(amount.toString());
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Monthly Budget Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure spending limits with automated 80% threshold warnings and exceedance alerts (FR-05, FR-06)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to Set/Update Budget (FR-05 / TC-06) */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Set Monthly Limit (FR-05)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique allocation per calendar month
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                  <option value={2028}>2028</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  {[
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ].map((m, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {m} ({idx + 1})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monthly Spending Limit (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-slate-400 font-mono text-sm">₹</span>
                <input
                  type="number"
                  step="100"
                  min="1"
                  required
                  placeholder={currentBudget ? currentBudget.monthly_limit.toString() : 'e.g. 35000'}
                  value={limitInput}
                  onChange={(e) => {
                    setLimitInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            {/* Quick amount presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">Quick Presets</span>
              <div className="flex flex-wrap gap-1.5">
                {[15000, 25000, 40000, 60000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleApplyPreset(amt)}
                    className="px-2.5 py-1 text-[11px] font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    ₹{(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs hover:shadow cursor-pointer"
            >
              {currentBudget ? 'Update Monthly Budget' : 'Save Monthly Budget'}
            </button>
          </form>
        </div>

        {/* Current Month Status & Progress Gauge (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Budget Performance
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {formatMonthName(targetYearMonth)}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 uppercase block font-semibold">Allocated Limit</span>
                <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                  {budgetLimit > 0 ? formatCurrency(budgetLimit) : 'Not established'}
                </span>
              </div>
            </div>

            {budgetLimit > 0 ? (
              <div className="space-y-5 mt-4">
                {/* Visual Status Callout */}
                {usagePercentage > 100 ? (
                  <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-3">
                    <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-900">
                        Budget Exceeded Alert (FR-06 / TC-08)
                      </h4>
                      <p className="text-xs text-rose-700 mt-0.5">
                        Expenses of {formatCurrency(actualExpense)} have surpassed the limit of {formatCurrency(budgetLimit)} by {formatCurrency(Math.abs(remaining))}.
                      </p>
                    </div>
                  </div>
                ) : usagePercentage >= 80 ? (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        80% Threshold Warning (FR-06 / TC-07)
                      </h4>
                      <p className="text-xs text-amber-700 mt-0.5">
                        You have consumed {usagePercentage.toFixed(1)}% of your monthly allowance. Only {formatCurrency(remaining)} remaining.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        Comfortable Spending (Within Budget)
                      </h4>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Current expenditures are well controlled at {usagePercentage.toFixed(1)}% of allowance.
                      </p>
                    </div>
                  </div>
                )}

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
                    <span>Spent: {formatCurrency(actualExpense)}</span>
                    <span className="font-mono font-bold text-slate-800">
                      {usagePercentage.toFixed(1)}% Used
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        usagePercentage > 100
                          ? 'bg-rose-600'
                          : usagePercentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, usagePercentage)}%` }}
                    />
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-slate-500 opacity-60 z-10"
                      style={{ left: '80%' }}
                      title="80% Warning Mark"
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>0%</span>
                    <span className="text-amber-700 font-semibold">80% Threshold</span>
                    <span>100% Limit</span>
                  </div>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Total Spent</span>
                    <span className="font-bold text-slate-900 tabular-nums font-mono text-sm">
                      {formatCurrency(actualExpense)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Remaining</span>
                    <span
                      className={`font-bold tabular-nums font-mono text-sm ${
                        remaining >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(remaining)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] uppercase font-semibold">Status</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {usagePercentage > 100
                        ? 'Exceeded'
                        : usagePercentage >= 80
                        ? 'Warning (≥80%)'
                        : 'Nominal'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <div className="font-medium text-slate-700">No budget limit established for this month.</div>
                <p className="text-slate-400">Use the form on the left to allocate a spending limit.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Budgets Overview Table */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            All Configured Budgets ({budgets.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical record of all configured monthly spending limits
          </p>
        </div>

        {budgets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Month / Year</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Limit</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actual Spent</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Usage</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {budgets.map((b) => {
                  const ym = `${b.budget_year}-${String(b.budget_month).padStart(2, '0')}`;
                  const spent = transactions
                    .filter((t) => t.transaction_type === 'Expense' && t.transaction_date.startsWith(ym))
                    .reduce((sum, t) => sum + Number(t.amount), 0);
                  const usage = (spent / b.monthly_limit) * 100;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-900 font-mono">
                        {formatMonthName(ym)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-900">
                        {formatCurrency(b.monthly_limit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                        {formatCurrency(spent)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                        <span
                          className={
                            usage > 100
                              ? 'text-rose-700 font-semibold'
                              : usage >= 80
                              ? 'text-amber-700 font-semibold'
                              : 'text-emerald-700'
                          }
                        >
                          {usage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-semibold ${
                            usage > 100
                              ? 'text-rose-700'
                              : usage >= 80
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {usage > 100 ? 'Exceeded' : usage >= 80 ? 'Warning (≥80%)' : 'On Track'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedYear(b.budget_year);
                            setSelectedMonth(b.budget_month);
                            setLimitInput(b.monthly_limit.toString());
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            No monthly budgets configured yet. Create one above to activate automated threshold tracking.
          </div>
        )}
      </div>
    </div>
  );
};
