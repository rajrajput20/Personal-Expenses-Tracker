import { useState, useEffect } from 'react';
import { TopBar, ActiveTab } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { InsightsView } from './components/InsightsView';
import { BudgetView } from './components/BudgetView';
import { AddTransactionModal } from './components/AddTransactionModal';
import { Transaction, MonthlyBudget } from './types/finance';
import {
  getStoredTransactions,
  saveStoredTransactions,
  getStoredBudgets,
  saveStoredBudgets,
  clearAllData,
} from './utils/storage';
import { exportTransactionsToCSV } from './utils/csv';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize data from localStorage
  useEffect(() => {
    const loadedTx = getStoredTransactions();
    const loadedBudgets = getStoredBudgets();
    setTransactions(loadedTx);
    setBudgets(loadedBudgets);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Keyboard shortcut: 'n' to open Add Transaction modal when not typing in an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !isAddModalOpen &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        setEditingTransaction(null);
        setIsAddModalOpen(true);
      }
      if (e.key === 'Escape' && isAddModalOpen) {
        setIsAddModalOpen(false);
        setEditingTransaction(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAddModalOpen]);

  // Save Transaction (Add or Edit) - FR-01
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'created_at'>,
    existingId?: number
  ) => {
    if (existingId) {
      // Edit
      const updated = transactions.map((t) =>
        t.id === existingId
          ? {
              ...t,
              ...txData,
            }
          : t
      );
      setTransactions(updated);
      saveStoredTransactions(updated);
      showToast(`Transaction #${existingId} updated successfully.`);
    } else {
      // Add
      const nextId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1;
      const newTx: Transaction = {
        ...txData,
        id: nextId,
        created_at: new Date().toISOString(),
      };
      const updated = [newTx, ...transactions];
      setTransactions(updated);
      saveStoredTransactions(updated);
      showToast(`${txData.transaction_type} of ₹${txData.amount.toFixed(2)} recorded.`);
    }
    setEditingTransaction(null);
  };

  // Delete Transaction - FR-03 & TC-05
  const handleDeleteTransaction = (id: number) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    saveStoredTransactions(updated);
    showToast(`Transaction #${id} deleted.`);
  };

  // Save Monthly Budget - FR-05 & TC-06
  const handleSaveBudget = (year: number, month: number, limit: number) => {
    const existingIndex = budgets.findIndex(
      (b) => b.budget_year === year && b.budget_month === month
    );
    let updated: MonthlyBudget[];
    if (existingIndex >= 0) {
      updated = [...budgets];
      updated[existingIndex] = {
        ...updated[existingIndex],
        monthly_limit: limit,
      };
    } else {
      const nextId = budgets.length > 0 ? Math.max(...budgets.map((b) => b.id)) + 1 : 1;
      const newBudget: MonthlyBudget = {
        id: nextId,
        budget_year: year,
        budget_month: month,
        monthly_limit: limit,
        created_at: new Date().toISOString(),
      };
      updated = [...budgets, newBudget];
    }
    setBudgets(updated);
    saveStoredBudgets(updated);
    showToast(`Budget of ₹${limit.toFixed(2)} saved for ${month}/${year}.`);
  };

  // CSV Export - FR-10 & TC-09
  const handleExportCSV = () => {
    exportTransactionsToCSV(transactions, `personal_expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Transactions exported to CSV file.');
  };

  // CSV Import
  const handleImportTransactions = (imported: Transaction[]) => {
    let maxId = transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) : 0;
    const sanitized = imported.map((item) => {
      maxId += 1;
      return {
        ...item,
        id: maxId,
      };
    });
    const updated = [...sanitized, ...transactions];
    setTransactions(updated);
    saveStoredTransactions(updated);
    showToast(`Imported ${imported.length} transactions from CSV.`);
  };

  // Clear all data
  const handleClearData = () => {
    const cleared = clearAllData();
    setTransactions(cleared.transactions);
    setBudgets(cleared.budgets);
    showToast('All transaction and budget data cleared.');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar with 3-Zone Contract */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        totalTransactionsCount={transactions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            transactions={transactions}
            budgets={budgets}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            onOpenAddModal={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            onNavigateToTransactions={() => setActiveTab('transactions')}
            onNavigateToInsights={() => setActiveTab('insights')}
            onNavigateToBudget={() => setActiveTab('budget')}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
            onEditTransaction={(tx) => {
              setEditingTransaction(tx);
              setIsAddModalOpen(true);
            }}
            onDeleteTransaction={handleDeleteTransaction}
            onExportCSV={handleExportCSV}
            onImportTransactions={handleImportTransactions}
            onClearData={handleClearData}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView
            transactions={transactions}
            onAddTransaction={() => {
              setEditingTransaction(null);
              setIsAddModalOpen(true);
            }}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            budgets={budgets}
            transactions={transactions}
            onSaveBudget={handleSaveBudget}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Personal Expense Tracker with Insights</span>
            <span aria-hidden="true">·</span>
            <span>Financial Analytics &amp; Forecasting</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Encrypted Local Storage</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Add / Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        initialTransaction={editingTransaction}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium flex items-center gap-2.5 border border-slate-800 backdrop-blur-md animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
