import { Transaction, RegressionResult, RegressionPoint, MonthlySummary } from '../types/finance';

/**
 * Format currency with tabular figures friendly numbers
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${currency}${formatted}`;
}

export function formatCompactCurrency(amount: number, currency: string = '₹'): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount);
  if (absVal >= 10000000) {
    return `${isNegative ? '-' : ''}${currency}${(absVal / 10000000).toFixed(2)} Cr`;
  }
  if (absVal >= 100000) {
    return `${isNegative ? '-' : ''}${currency}${(absVal / 100000).toFixed(2)} L`;
  }
  if (absVal >= 1000) {
    return `${isNegative ? '-' : ''}${currency}${(absVal / 1000).toFixed(1)}k`;
  }
  return `${isNegative ? '-' : ''}${currency}${absVal.toFixed(0)}`;
}

/**
 * Aggregate transactions by month (YYYY-MM)
 */
export function aggregateMonthlyExpenses(transactions: Transaction[]): Map<string, number> {
  const expenseMap = new Map<string, number>();

  transactions
    .filter((t) => t.transaction_type === 'Expense')
    .forEach((t) => {
      const ym = t.transaction_date.slice(0, 7); // YYYY-MM
      const current = expenseMap.get(ym) || 0;
      expenseMap.set(ym, current + Number(t.amount));
    });

  return expenseMap;
}

/**
 * Full monthly summary for income, expenses, and net balance
 */
export function calculateMonthlySummaries(transactions: Transaction[]): MonthlySummary[] {
  const summaryMap = new Map<string, { income: number; expense: number }>();

  transactions.forEach((t) => {
    const ym = t.transaction_date.slice(0, 7);
    if (!summaryMap.has(ym)) {
      summaryMap.set(ym, { income: 0, expense: 0 });
    }
    const current = summaryMap.get(ym)!;
    if (t.transaction_type === 'Income') {
      current.income += Number(t.amount);
    } else {
      current.expense += Number(t.amount);
    }
  });

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const sortedMonths = Array.from(summaryMap.keys()).sort();

  return sortedMonths.map((ym) => {
    const [yearStr, monthStr] = ym.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const data = summaryMap.get(ym)!;

    return {
      yearMonth: ym,
      year,
      month,
      monthName: `${monthNames[month - 1]} ${year}`,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    };
  });
}

/**
 * Ordinary Least-Squares (OLS) Linear Regression
 * Exactly following SOW Section 11:
 * - ordered from oldest to newest monthly expense totals
 * - fits line y = a + bx
 * - evaluates at next month index (n + 1)
 * - clamped to 0 if negative
 * - requires >= 2 monthly observations
 */
export function calculateExpenseForecast(transactions: Transaction[]): RegressionResult {
  const monthlyExpenses = aggregateMonthlyExpenses(transactions);
  const sortedMonths = Array.from(monthlyExpenses.keys()).sort();

  const n = sortedMonths.length;

  if (n < 2) {
    return {
      hasSufficientData: false,
      slope: 0,
      intercept: 0,
      nextMonthLabel: getNextMonthLabel(sortedMonths[0]),
      nextMonthIndex: n + 1,
      forecastAmount: 0,
      unclampedAmount: 0,
      points: sortedMonths.map((ym, idx) => ({
        index: idx + 1,
        label: ym,
        actualExpense: monthlyExpenses.get(ym) || 0,
      })),
      rSquared: 0,
      trendDirection: 'stable',
      averageMonthlyExpense: n === 1 ? (monthlyExpenses.get(sortedMonths[0]) || 0) : 0,
      dataPointsCount: n,
    };
  }

  // x values are 1, 2, ..., n
  // y values are monthly expense totals
  const points: { x: number; y: number; label: string }[] = sortedMonths.map((ym, idx) => ({
    x: idx + 1,
    y: monthlyExpenses.get(ym) || 0,
    label: ym,
  }));

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  points.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumX2 += p.x * p.x;
  });

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  // Next month calculation
  const nextMonthIdx = n + 1;
  const unclampedPrediction = intercept + slope * nextMonthIdx;
  const forecastAmount = Math.max(0, Math.round(unclampedPrediction * 100) / 100);

  // Compute R-squared (coefficient of determination)
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;

  const regressionPoints: RegressionPoint[] = points.map((p) => {
    const predicted = intercept + slope * p.x;
    ssTot += Math.pow(p.y - meanY, 2);
    ssRes += Math.pow(p.y - predicted, 2);

    return {
      index: p.x,
      label: p.label,
      actualExpense: p.y,
      predictedExpense: Math.max(0, Math.round(predicted * 100) / 100),
    };
  });

  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 1;

  let trendDirection: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (slope > 10) trendDirection = 'increasing';
  else if (slope < -10) trendDirection = 'decreasing';

  const lastMonth = sortedMonths[sortedMonths.length - 1];
  const nextMonthLabel = getNextMonthLabel(lastMonth);

  return {
    hasSufficientData: true,
    slope: Math.round(slope * 100) / 100,
    intercept: Math.round(intercept * 100) / 100,
    nextMonthLabel,
    nextMonthIndex: nextMonthIdx,
    forecastAmount,
    unclampedAmount: Math.round(unclampedPrediction * 100) / 100,
    points: regressionPoints,
    rSquared: Math.round(rSquared * 1000) / 1000,
    trendDirection,
    averageMonthlyExpense: Math.round(meanY * 100) / 100,
    dataPointsCount: n,
  };
}

/**
 * Calculates next month label 'YYYY-MM' given 'YYYY-MM'
 */
export function getNextMonthLabel(yearMonthStr?: string): string {
  if (!yearMonthStr) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
  }
  const [yearStr, monthStr] = yearMonthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Get readable month title from 'YYYY-MM' (e.g. "October 2026")
 */
export function formatMonthName(yearMonthStr: string): string {
  const [yearStr, monthStr] = yearMonthStr.split('-');
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(parseInt(yearStr, 10), month, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
