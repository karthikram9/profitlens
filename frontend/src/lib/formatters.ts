/**
 * Formatter utilities for ProfitLens - single source of truth.
 */

/**
 * Formats a number as Indian Rupee (INR) currency.
 * E.g., 482910 -> "₹4,82,910"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a number as a percentage.
 * Assumes the input value is already a percentage (e.g., 12.4 for 12.4%).
 */
export function formatPercent(value: number, includeSign = false): string {
  const formatted = `${value.toFixed(1)}%`;
  if (includeSign && value > 0) {
    return `+${formatted}`;
  }
  return formatted;
}

/**
 * Formats a date string or object to a standard readable format.
 * E.g., "2026-07-10" -> "Jul 10, 2026"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
