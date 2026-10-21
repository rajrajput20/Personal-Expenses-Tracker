import { Transaction, PaymentMethod, TransactionType } from '../types/finance';

/**
 * Generates CSV string and triggers browser file download (FR-10)
 */
export function exportTransactionsToCSV(transactions: Transaction[], filename: string = 'personal_expenses.csv'): void {
  const headers = ['id', 'transaction_date', 'transaction_type', 'category', 'amount', 'payment_method', 'note', 'created_at'];

  const rows = transactions.map((t) => [
    t.id,
    `"${t.transaction_date}"`,
    `"${t.transaction_type}"`,
    `"${t.category.replace(/"/g, '""')}"`,
    t.amount.toFixed(2),
    `"${t.payment_method}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${t.created_at}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses CSV text into Transaction array
 */
export function parseCSVToTransactions(csvText: string): Transaction[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file is empty or does not contain data rows.');
  }

  const result: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split by comma taking quoted strings into account
    const tokens: string[] = [];
    let current = '';
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' && (j === 0 || line[j - 1] !== '\\')) {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        tokens.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        current = '';
      } else {
        current += char;
      }
    }
    tokens.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    if (tokens.length >= 5) {
      const id = parseInt(tokens[0], 10) || Date.now() + i;
      const date = tokens[1];
      const type = (tokens[2] === 'Income' ? 'Income' : 'Expense') as TransactionType;
      const category = tokens[3] || 'Uncategorized';
      const amount = parseFloat(tokens[4]) || 0;
      const paymentMethod = (['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'].includes(tokens[5])
        ? tokens[5]
        : 'Other') as PaymentMethod;
      const note = tokens[6] || '';
      const createdAt = tokens[7] || new Date().toISOString();

      if (date && amount > 0) {
        result.push({
          id,
          transaction_date: date,
          transaction_type: type,
          category,
          amount,
          payment_method: paymentMethod,
          note,
          created_at: createdAt,
        });
      }
    }
  }

  return result;
}
