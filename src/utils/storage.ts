import { Transaction, MonthlyBudget } from '../types/finance';

const STORAGE_KEYS = {
  TRANSACTIONS: 'expense_tracker_transactions_v2',
  BUDGETS: 'expense_tracker_budgets_v2',
};

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed reading transactions from localStorage:', err);
    return [];
  }
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed saving transactions to localStorage:', err);
  }
}

export function getStoredBudgets(): MonthlyBudget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed reading budgets from localStorage:', err);
    return [];
  }
}

export function saveStoredBudgets(budgets: MonthlyBudget[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (err) {
    console.error('Failed saving budgets to localStorage:', err);
  }
}

export function clearAllData(): { transactions: Transaction[]; budgets: MonthlyBudget[] } {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify([]));
  return {
    transactions: [],
    budgets: [],
  };
}
