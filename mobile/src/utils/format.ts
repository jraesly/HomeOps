import type { Priority, RecurrenceType } from '@/api/types';

/** Format an ISO date (YYYY-MM-DD) or datetime as e.g. "Jun 24, 2026". */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Human relative due description, e.g. "Overdue by 3 days" / "Due in 12 days". */
export function describeDue(dueIso: string | null | undefined): string {
  if (!dueIso) return 'No due date';
  const due = new Date(`${dueIso}T00:00:00`);
  if (Number.isNaN(due.getTime())) return 'No due date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (days < 0) return `Overdue by ${Math.abs(days)} day${days === -1 ? '' : 's'}`;
  if (days === 0) return 'Due today';
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
}

/** Cents → "$18.00" (or "—" when absent). */
export function formatCost(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

/** snake_case enum → "Title Case" label. */
export function humanize(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function describeRecurrence(
  type: RecurrenceType,
  interval: number,
): string {
  if (type === 'none') return 'One-time';
  if (type === 'custom_days') return `Every ${interval} days`;
  const base = humanize(type);
  return interval > 1 ? `Every ${interval} × ${base}` : base;
}

/** Priority badge colors (work on both light and dark backgrounds). */
export const priorityColor: Record<Priority, string> = {
  low: '#6B7280',
  medium: '#2563EB',
  high: '#D97706',
  critical: '#DC2626',
};
