import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Plus,
  Download,
  Calendar,
  Percent,
} from 'lucide-react';
import { Transaction, MonthlyBudget } from '../types/finance';
import { formatCurrency, formatMonthName } from '../utils/math';
import { ExpensePieChart, CategoryExpenseData } from './ExpensePieChart';

interface DashboardViewProps {
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  selectedMonth: string; // 'YYYY-MM' or 'all'
  onSelectMonth: (month: string) => void;
  onOpenAddModal: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToInsights: () => void;
  onNavigateToBudget: () => void;
  onExportCSV: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  budgets,
  selectedMonth,
  onSelectMonth,
  onOpenAddModal,
  onNavigateToTransactions,
  onNavigateToInsights,
  onNavigateToBudget,
  onExportCSV,
}) => {
  // Available months list for selector
  const availableMonths = useMemo(() => {
    return Array.from(
      new Set(transactions.map((t) => t.transaction_date.slice(0, 7)))
    ).sort().reverse();
  }, [transactions]);

  // Filtered transactions based on month
  const filtered = useMemo(() => {
    return selectedMonth === 'all'
      ? transactions
      : transactions.filter((t) => t.transaction_date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Totals
  const totalIncome = useMemo(() => {
    return filtered
      .filter((t) => t.transaction_type === 'Income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filtered]);

  const totalExpense = useMemo(() => {
    return filtered
      .filter((t) => t.transaction_type === 'Expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [filtered]);

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  // Target month for budget check
  const targetYearMonth = selectedMonth === 'all'
    ? (availableMonths[0] || new Date().toISOString().slice(0, 7))
    : selectedMonth;

  const [tYearStr, tMonthStr] = targetYearMonth.split('-');
  const targetYear = parseInt(tYearStr, 10);
  const targetMonth = parseInt(tMonthStr, 10);

  const targetMonthExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'Expense' && t.transaction_date.startsWith(targetYearMonth))
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions, targetYearMonth]);

  const currentBudget = useMemo(() => {
    return budgets.find(
      (b) => b.budget_year === targetYear && b.budget_month === targetMonth
    );
  }, [budgets, targetYear, targetMonth]);

  const budgetLimit = currentBudget ? Number(currentBudget.monthly_limit) : null;
  const budgetUsagePercent = budgetLimit && budgetLimit > 0
    ? (targetMonthExpenses / budgetLimit) * 100
    : 0;

  // Highest Expense Category (FR-07)
  const categoryMap = useMemo(() => {
    const map = new Map<string, number>();
    filtered
      .filter((t) => t.transaction_type === 'Expense')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + Number(t.amount));
      });
    return map;
  }, [filtered]);

  const highestCategory = useMemo(() => {
    if (categoryMap.size === 0 || totalExpense <= 0) return null;
    let maxCat = '';
    let maxAmt = 0;
    categoryMap.forEach((amt, cat) => {
      if (amt > maxAmt) {
        maxAmt = amt;
        maxCat = cat;
      }
    });
    return {
      name: maxCat,
      amount: maxAmt,
      percentage: Math.round((maxAmt / totalExpense) * 100),
    };
  }, [categoryMap, totalExpense]);

  const PIE_COLORS = [
    '#2563eb', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#14b8a6', // Teal
    '#64748b', // Slate
  ];

  const categoryExpensesData: CategoryExpenseData[] = useMemo(() => {
    return Array.from(categoryMap.entries())
      .map(([name, value], idx) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        color: PIE_COLORS[idx % PIE_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryMap, totalExpense]);

  // Recent transactions (6 newest)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date) || b.id - a.id)
      .slice(0, 6);
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Quick Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time balance, monthly budget tracking, and expense breakdown
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month selector */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-xs shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Time</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthName(ym)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-slate-300"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Income
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums font-mono">
            {formatCurrency(totalIncome)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{filtered.filter((t) => t.transaction_type === 'Income').length} income entries</span>
          </div>
        </div>

        {/* Expenses Card */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums font-mono">
            {formatCurrency(totalExpense)}
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{filtered.filter((t) => t.transaction_type === 'Expense').length} expense entries</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-bold tabular-nums font-mono ${
              netBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(netBalance)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {netBalance >= 0 ? 'Positive net savings' : 'Expenses exceed income'}
          </div>
        </div>

        {/* Savings Rate Card */}
        <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Savings Ratio
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 tabular-nums font-mono">
            {totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : '0.0%'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {savingsRate >= 20 ? 'Healthy savings margin' : 'Review discretionary spending'}
          </div>
        </div>
      </div>

      {/* Row 2: Budget Alert Widget + Highest Expense Category Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Management & Alert Card (2 cols) */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Monthly Budget Monitor ({formatMonthName(targetYearMonth)})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated threshold warnings and limit status
              </p>
            </div>
            <button
              onClick={onNavigateToBudget}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Budget</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {budgetLimit ? (
            <div className="space-y-4">
              {/* Alert status notification bar */}
              {budgetUsagePercent > 100 ? (
                <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
                  <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Budget Exceeded Alert: </span>
                    Current month spending ({formatCurrency(targetMonthExpenses)}) has surpassed
                    the allocated limit of {formatCurrency(budgetLimit)} by{' '}
                    {formatCurrency(targetMonthExpenses - budgetLimit)} ({budgetUsagePercent.toFixed(1)}% used).
                  </div>
                </div>
              ) : budgetUsagePercent >= 80 ? (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">Threshold Warning (≥80%): </span>
                    You have utilized {budgetUsagePercent.toFixed(1)}% of this month's budget.
                    Remaining allowance is {formatCurrency(budgetLimit - targetMonthExpenses)}.
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-3 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <div>
                    <span className="font-semibold">On Track: </span>
                    Spending is within comfortable limits ({budgetUsagePercent.toFixed(1)}% used).
                    Remaining balance: {formatCurrency(budgetLimit - targetMonthExpenses)}.
                  </div>
                </div>
              )}

              {/* Progress meter */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Spent: {formatCurrency(targetMonthExpenses)}</span>
                  <span>Limit: {formatCurrency(budgetLimit)}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      budgetUsagePercent > 100
                        ? 'bg-rose-600'
                        : budgetUsagePercent >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                  />
                  {/* 80% mark marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 opacity-60 z-10"
                    style={{ left: '80%' }}
                    title="80% Warning Threshold"
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                  <span>0%</span>
                  <span className="text-amber-700 font-semibold">80% Alert Mark</span>
                  <span>100% Max</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Spent</span>
                  <span className="font-semibold text-slate-900 tabular-nums font-mono text-sm">
                    {formatCurrency(targetMonthExpenses)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Remaining</span>
                  <span
                    className={`font-semibold tabular-nums font-mono text-sm ${
                      budgetLimit - targetMonthExpenses >= 0
                        ? 'text-emerald-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {formatCurrency(budgetLimit - targetMonthExpenses)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Status</span>
                  <span className="font-semibold text-slate-900 text-sm">
                    {budgetUsagePercent > 100
                      ? 'Exceeded'
                      : budgetUsagePercent >= 80
                      ? 'Warning (≥80%)'
                      : 'Nominal'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <p className="text-xs">
                No monthly spending budget established for {formatMonthName(targetYearMonth)}.
              </p>
              <button
                onClick={onNavigateToBudget}
                className="mt-3 px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
              >
                Set Monthly Budget Limit
              </button>
            </div>
          )}
        </div>

        {/* Highest Expense Category (FR-07) Card */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Spending Insight (FR-07)
            </span>
            <h3 className="text-sm font-semibold text-slate-900 mt-1">
              Top Expense Driver
            </h3>

            {highestCategory ? (
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="text-xs text-slate-500">Highest Category</div>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {highestCategory.name}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800 tabular-nums font-mono">
                  {formatCurrency(highestCategory.amount)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Accounts for {highestCategory.percentage}% of all expenses in selected view.
                </div>
              </div>
            ) : (
              <div className="mt-6 text-xs text-slate-500 py-6 text-center">
                No expenses logged for this selection yet.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={onNavigateToInsights}
              className="w-full flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              <span>View Full Charts & Regression</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Expense Category Pie Chart Visualization (Recharts) */}
      <ExpensePieChart
        data={categoryExpensesData}
        totalExpense={totalExpense}
        periodLabel={selectedMonth === 'all' ? 'All Time' : formatMonthName(selectedMonth)}
      />

      {/* Recent Transactions List (FR-04) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Recent Transactions (FR-04)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest transactions recorded in system
            </p>
          </div>
          <button
            onClick={onNavigateToTransactions}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold">Method</th>
                  <th className="py-2.5 px-3 font-semibold">Note</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {tx.transaction_date}
                    </td>
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3 font-medium text-slate-800">
                      {tx.category}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {tx.payment_method}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {tx.note || '—'}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-semibold tabular-nums text-right font-mono ${
                        tx.transaction_type === 'Income'
                          ? 'text-emerald-700'
                          : 'text-slate-900'
                      }`}
                    >
                      {tx.transaction_type === 'Income' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No transactions found. Click &quot;Add Record&quot; to log your first transaction.
          </div>
        )}
      </div>
    </div>
  );
};
