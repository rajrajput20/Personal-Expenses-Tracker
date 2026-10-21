import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';
import { PieChart as PieIcon, LayoutGrid, List } from 'lucide-react';
import { formatCurrency } from '../utils/math';

export interface CategoryExpenseData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ExpensePieChartProps {
  data: CategoryExpenseData[];
  totalExpense: number;
  periodLabel: string;
}

interface TooltipPayloadItem {
  payload: CategoryExpenseData;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl text-xs shadow-xl font-sans border border-slate-700/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-semibold text-slate-100">{item.name}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-2 font-mono text-[11px]">
          <span className="text-white font-bold tabular-nums">
            {formatCurrency(item.value)}
          </span>
          <span className="text-slate-400">
            ({item.percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
    );
  }
  return null;
};

// Render active enlarged shape for smooth hover interaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 8}
        outerRadius={outerRadius + 11}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export const ExpensePieChart: React.FC<ExpensePieChartProps> = ({
  data,
  totalExpense,
  periodLabel,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'donut' | 'bars'>('donut');

  return (
    <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-4">
      {/* Component Header with View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Expense Distribution by Category
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Spending composition for {periodLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalExpense > 0 && (
            <div className="hidden sm:block text-right pr-3 border-r border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-semibold tracking-wider">
                Total Expenses
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          )}

          {data.length > 0 && (
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setViewMode('donut')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'donut'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Donut Chart View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('bars')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'bars'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Detailed Bars View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {data.length > 0 ? (
        viewMode === 'donut' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-1">
            {/* Recharts Pie Chart (7 cols) */}
            <div className="md:col-span-7 h-68 relative min-w-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    {...({ activeIndex, activeShape: renderActiveShape } as unknown as Record<string, unknown>)}
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={600}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="cursor-pointer transition-all duration-200"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Ring Stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  {activeIndex !== undefined ? data[activeIndex]?.name : 'Total Spent'}
                </span>
                <span className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                  {activeIndex !== undefined
                    ? formatCurrency(data[activeIndex]?.value || 0)
                    : formatCurrency(totalExpense)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                  {activeIndex !== undefined
                    ? `${data[activeIndex]?.percentage.toFixed(1)}% of total`
                    : `${data.length} categories`}
                </span>
              </div>
            </div>

            {/* Category Interactive Legend (5 cols) */}
            <div className="md:col-span-5 space-y-2 max-h-68 overflow-y-auto pr-1 text-xs">
              {data.map((item, idx) => {
                const isHovered = activeIndex === idx;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(undefined)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isHovered
                        ? 'bg-slate-50 border-slate-300 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-semibold text-slate-800 truncate" title={item.name}>
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <span className="font-bold text-slate-900 tabular-nums">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5 font-medium">
                          ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Proportional visual track */}
                    <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(3, item.percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Detailed Horizontal Bars View */
          <div className="space-y-3 pt-2">
            {data.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <div className="font-mono text-right">
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.value)}
                    </span>
                    <span className="text-slate-500 ml-2 font-normal">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="py-14 text-center text-slate-500 text-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">No expenses recorded yet</div>
            <p className="text-slate-400 max-w-sm mx-auto text-xs mt-1">
              Add your daily expenses like Food, Rent, or Entertainment to visualize your category breakdown here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
