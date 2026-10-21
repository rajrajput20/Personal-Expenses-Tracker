import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  Sector,
  ComposedChart,
  Line,
  Scatter,
} from 'recharts';
import { Transaction } from '../types/finance';
import {
  calculateExpenseForecast,
  calculateMonthlySummaries,
  formatCurrency,
  formatMonthName,
} from '../utils/math';

interface InsightsViewProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
}

const CATEGORY_COLORS = [
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#64748b', // slate
];

export const InsightsView: React.FC<InsightsViewProps> = ({ transactions }) => {
  // Available months
  const availableMonths = useMemo(() => {
    return Array.from(new Set(transactions.map((t) => t.transaction_date.slice(0, 7)))).sort().reverse();
  }, [transactions]);

  const [selectedPieMonth, setSelectedPieMonth] = useState<string>(availableMonths[0] || 'all');
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);

  // Linear regression forecast result (FR-09 & SOW Section 11)
  const regressionResult = useMemo(() => {
    return calculateExpenseForecast(transactions);
  }, [transactions]);

  // Monthly summary bar chart data (FR-08)
  const monthlySummaries = useMemo(() => {
    return calculateMonthlySummaries(transactions);
  }, [transactions]);

  // Category breakdown for pie chart (FR-08)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    const filtered = selectedPieMonth === 'all'
      ? transactions.filter((t) => t.transaction_type === 'Expense')
      : transactions.filter((t) => t.transaction_type === 'Expense' && t.transaction_date.startsWith(selectedPieMonth));

    filtered.forEach((t) => {
      map.set(t.category, (map.get(t.category) || 0) + Number(t.amount));
    });

    const total = Array.from(map.values()).reduce((sum, v) => sum + v, 0);

    return Array.from(map.entries())
      .map(([category, amount], idx) => ({
        name: category,
        category,
        value: amount,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, selectedPieMonth]);

  const totalPieExpense = useMemo(() => {
    return categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
  }, [categoryBreakdown]);

  // Format Recharts data for Monthly Comparison
  const barChartData = useMemo(() => {
    return monthlySummaries.map((m) => ({
      month: m.monthName,
      Income: m.income,
      Expense: m.expense,
      Net: m.net,
    }));
  }, [monthlySummaries]);

  // Format Recharts data for Regression Chart
  const regressionChartData = useMemo(() => {
    if (!regressionResult.hasSufficientData) return [];

    const data = regressionResult.points.map((p) => {
      const fitted = regressionResult.intercept + regressionResult.slope * p.index;
      return {
        index: p.index,
        label: p.label,
        actual: p.actualExpense,
        trend: Math.max(0, Math.round(fitted * 100) / 100),
        forecast: null as number | null,
      };
    });

    // Add forecast point
    data.push({
      index: regressionResult.nextMonthIndex,
      label: `${regressionResult.nextMonthLabel} (Est)`,
      actual: null as unknown as number,
      trend: Math.max(0, Math.round(regressionResult.forecastAmount * 100) / 100),
      forecast: regressionResult.forecastAmount,
    });

    return data;
  }, [regressionResult]);

  // Active sector shape for Donut
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 2}
          outerRadius={outerRadius + 4}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 9}
          fill={fill}
          opacity={0.3}
        />
      </g>
    );
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Visual Analytics & Predictive Insights
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ordinary Least Squares (OLS) expense forecasting, monthly comparative analysis, and category breakdown
        </p>
      </div>

      {/* SECTION 1: PREDICTIVE EXPENSE FORECAST (FR-09 & SOW SECTION 11) */}
      <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Predictive Expense Forecast (FR-09)
              </h2>
              <span className="text-xs font-mono text-blue-600 font-semibold">
                · OLS Linear Regression
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Ordinary least squares model fitting <span className="font-mono text-slate-700 font-medium">y = a + bx</span> evaluated at index (n + 1)
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[11px] text-slate-400 block uppercase font-semibold">Dataset Sample Size</span>
            <span className="text-xs font-bold font-mono text-slate-800">
              n = {regressionResult.dataPointsCount} month(s)
            </span>
          </div>
        </div>

        {/* Forecast Result Card */}
        {regressionResult.hasSufficientData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50/70 rounded-xl border border-slate-200/80">
              {/* Card 1: Estimated Next Month */}
              <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Next Month Forecast
                </span>
                <div className="mt-2 text-2xl font-bold text-blue-700 tabular-nums font-mono">
                  {formatCurrency(regressionResult.forecastAmount)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Target: {formatMonthName(regressionResult.nextMonthLabel)}
                </div>
                {regressionResult.unclampedAmount < 0 && (
                  <div className="text-[11px] text-amber-700 mt-1">
                    (Clamped to zero per SOW Section 11)
                  </div>
                )}
              </div>

              {/* Card 2: Slope / Growth Rate */}
              <div className="border-b sm:border-b-0 lg:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Monthly Growth (Slope b)
                </span>
                <div className="mt-2 flex items-center gap-1.5 text-xl font-bold text-slate-800 tabular-nums font-mono">
                  {regressionResult.slope > 0 ? (
                    <TrendingUp className="w-5 h-5 text-rose-500 shrink-0" />
                  ) : regressionResult.slope < 0 ? (
                    <TrendingDown className="w-5 h-5 text-emerald-500 shrink-0" />
                  ) : null}
                  <span>
                    {regressionResult.slope > 0 ? '+' : ''}
                    {formatCurrency(regressionResult.slope)} / mo
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {regressionResult.slope > 0
                    ? 'Upward spending momentum'
                    : regressionResult.slope < 0
                    ? 'Decreasing expense trend'
                    : 'Stable spending trend'}
                </div>
              </div>

              {/* Card 3: Intercept (Base) */}
              <div className="border-b sm:border-b-0 sm:border-r border-slate-200 pb-3 sm:pb-0 sm:pr-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Base Intercept (a)
                </span>
                <div className="mt-2 text-xl font-bold text-slate-800 tabular-nums font-mono">
                  {formatCurrency(regressionResult.intercept)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Estimated baseline fixed expenses
                </div>
              </div>

              {/* Card 4: Fit R-Squared */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Goodness of Fit (R²)
                </span>
                <div className="mt-2 text-xl font-bold text-slate-800 tabular-nums font-mono">
                  {regressionResult.rSquared.toFixed(3)}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {regressionResult.rSquared >= 0.7
                    ? 'Strong linear fit'
                    : regressionResult.rSquared >= 0.4
                    ? 'Moderate linear fit'
                    : 'High variance in month totals'}
                </div>
              </div>
            </div>

            {/* Regression Chart using Recharts ComposedChart */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <span className="font-semibold font-mono text-[11px] text-slate-700">
                  Trend Model: y = {regressionResult.intercept.toFixed(2)} + ({regressionResult.slope.toFixed(2)} × x)
                </span>
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Actual Expenses
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 bg-emerald-500" />
                    Fitted Trend Line
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    Forecast Target
                  </span>
                </div>
              </div>

              <div className="h-64 w-full bg-slate-50/60 border border-slate-200/80 rounded-xl p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={regressionChartData} margin={{ top: 15, right: 25, bottom: 15, left: 15 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip
                      formatter={(val: unknown) => [formatCurrency(Number(val) || 0), '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    {/* Fitted trend line */}
                    <Line
                      type="monotone"
                      dataKey="trend"
                      name="Fitted Trend"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                    {/* Actual observations */}
                    <Line
                      type="monotone"
                      dataKey="actual"
                      name="Actual Expense"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                      connectNulls={false}
                    />
                    {/* Forecast point */}
                    <Scatter
                      dataKey="forecast"
                      name="Forecast"
                      fill="#e11d48"
                      shape="circle"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-300 space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              Insufficient Historical Data for Regression
            </h3>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Linear regression requires at least two distinct monthly expense observations (n ≥ 2) to compute slope and intercept. Currently recorded: {regressionResult.dataPointsCount} month.
            </p>
            <p className="text-xs text-blue-600 font-medium">
              Record transactions across at least two calendar months to activate predictive modeling.
            </p>
          </div>
        )}
      </div>

      {/* SECTION 2: CATEGORY BREAKDOWN (FR-08) & MONTHLY COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut / Pie Chart */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Category Breakdown (FR-08)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportional spending share
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPieMonth}
                onChange={(e) => setSelectedPieMonth(e.target.value)}
                className="border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Months</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthName(ym)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center pt-2">
              {/* Recharts Pie Chart (7 cols) */}
              <div className="sm:col-span-7 h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      {...({ activeIndex: activePieIndex, activeShape: renderActiveShape } as unknown as Record<string, unknown>)}
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      onMouseEnter={(_, idx) => setActivePieIndex(idx)}
                      onMouseLeave={() => setActivePieIndex(undefined)}
                    >
                      {categoryBreakdown.map((entry, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={entry.color}
                          stroke="#ffffff"
                          strokeWidth={2}
                          className="cursor-pointer"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {activePieIndex !== undefined ? categoryBreakdown[activePieIndex]?.name : 'Total Spent'}
                  </span>
                  <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                    {activePieIndex !== undefined
                      ? formatCurrency(categoryBreakdown[activePieIndex]?.amount || 0)
                      : formatCurrency(totalPieExpense)}
                  </span>
                </div>
              </div>

              {/* Legend List (5 cols) */}
              <div className="sm:col-span-5 space-y-2 text-xs max-h-56 overflow-y-auto pr-1">
                {categoryBreakdown.map((item, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setActivePieIndex(idx)}
                    onMouseLeave={() => setActivePieIndex(undefined)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      activePieIndex === idx ? 'bg-slate-100/80' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-800 truncate font-medium">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="text-slate-900 font-bold tabular-nums">
                          {formatCurrency(item.amount)}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No expenses recorded for this timeframe.
            </div>
          )}
        </div>

        {/* Monthly Income vs. Expense Comparison Bar Chart */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Monthly Comparison (FR-08)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Income versus expense balance per month
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                Income
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                Expense
              </span>
            </div>
          </div>

          {monthlySummaries.length > 0 ? (
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    formatter={(val: unknown) => [formatCurrency(Number(val) || 0), '']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              No historical monthly data recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
