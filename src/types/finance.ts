export type TransactionType = 'Income' | 'Expense';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other';

export interface Transaction {
  id: number;
  transaction_date: string; // YYYY-MM-DD
  transaction_type: TransactionType;
  category: string;
  amount: number;
  payment_method: PaymentMethod;
  note: string;
  created_at: string;
}

export interface MonthlyBudget {
  id: number;
  budget_year: number;
  budget_month: number; // 1-12
  monthly_limit: number;
  created_at: string;
}

export interface RegressionPoint {
  index: number;
  label: string; // 'YYYY-MM'
  actualExpense: number;
  predictedExpense?: number;
}

export interface RegressionResult {
  hasSufficientData: boolean;
  slope: number; // b
  intercept: number; // a
  nextMonthLabel: string;
  nextMonthIndex: number;
  forecastAmount: number; // clamped >= 0
  unclampedAmount: number;
  points: RegressionPoint[];
  rSquared: number;
  trendDirection: 'increasing' | 'decreasing' | 'stable';
  averageMonthlyExpense: number;
  dataPointsCount: number;
}


export interface MonthlySummary {
  yearMonth: string; // 'YYYY-MM'
  year: number;
  month: number;
  monthName: string;
  income: number;
  expense: number;
  net: number;
}
