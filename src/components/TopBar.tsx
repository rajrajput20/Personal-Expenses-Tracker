import React from 'react';
import { Plus, Wallet, ArrowUpRight } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'transactions' | 'insights' | 'budget';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenAddModal: () => void;
  totalTransactionsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  totalTransactionsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark in display face */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Wallet className="w-4 h-4 stroke-[2.2]" />
            </div>
            <button
              onClick={() => onSelectTab('dashboard')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                Expense Tracker
              </span>
            </button>
          </div>

          {/* Zone 2: Concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'text-blue-600 bg-blue-50/70 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => onSelectTab('transactions')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'transactions'
                  ? 'text-blue-600 bg-blue-50/70 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <span>Transactions</span>
              {totalTransactionsCount > 0 && (
                <span className="ml-1.5 text-xs text-slate-400 font-mono">
                  {totalTransactionsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('insights')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'insights'
                  ? 'text-blue-600 bg-blue-50/70 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Insights & Forecast
            </button>
            <button
              onClick={() => onSelectTab('budget')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'budget'
                  ? 'text-blue-600 bg-blue-50/70 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              Monthly Budget
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition-all shadow-xs hover:shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-2 border-t border-slate-100 text-xs font-medium scrollbar-none">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('transactions')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'transactions'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Transactions {totalTransactionsCount > 0 ? `(${totalTransactionsCount})` : ''}
          </button>
          <button
            onClick={() => onSelectTab('insights')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'insights'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => onSelectTab('budget')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'budget'
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Budget
          </button>
        </div>
      </div>
    </header>
  );
};
