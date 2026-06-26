import {
  describeDue,
  describeRecurrence,
  formatCost,
  formatDate,
  humanize,
  isOverdue,
  todayISO,
} from '@/utils/format';

function isoOffset(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('formatCost', () => {
  it('formats cents as dollars', () => {
    expect(formatCost(1800)).toBe('$18.00');
    expect(formatCost(0)).toBe('$0.00');
  });
  it('renders a dash when absent', () => {
    expect(formatCost(null)).toBe('—');
    expect(formatCost(undefined)).toBe('—');
  });
});

describe('humanize', () => {
  it('title-cases snake_case', () => {
    expect(humanize('needs_service')).toBe('Needs Service');
    expect(humanize('replace_filter')).toBe('Replace Filter');
  });
});

describe('describeRecurrence', () => {
  it('describes recurrence + interval', () => {
    expect(describeRecurrence('none', 1)).toBe('One-time');
    expect(describeRecurrence('custom_days', 90)).toBe('Every 90 days');
    expect(describeRecurrence('monthly', 1)).toBe('Monthly');
    expect(describeRecurrence('monthly', 2)).toBe('Every 2 × Monthly');
  });
});

describe('isOverdue', () => {
  it('is true only for past dates', () => {
    expect(isOverdue(isoOffset(-1))).toBe(true);
    expect(isOverdue(isoOffset(0))).toBe(false);
    expect(isOverdue(isoOffset(1))).toBe(false);
    expect(isOverdue(null)).toBe(false);
  });
});

describe('describeDue', () => {
  it('describes relative due dates', () => {
    expect(describeDue(isoOffset(0))).toBe('Due today');
    expect(describeDue(isoOffset(5))).toBe('Due in 5 days');
    expect(describeDue(isoOffset(1))).toBe('Due in 1 day');
    expect(describeDue(isoOffset(-3))).toBe('Overdue by 3 days');
    expect(describeDue(null)).toBe('No due date');
  });
});

describe('todayISO', () => {
  it('returns today as YYYY-MM-DD', () => {
    expect(todayISO()).toBe(isoOffset(0));
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('formatDate', () => {
  it('formats ISO dates and handles absence', () => {
    expect(formatDate('2026-06-24')).toContain('2026');
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
  });
});
