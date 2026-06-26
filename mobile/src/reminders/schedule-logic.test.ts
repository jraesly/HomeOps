import type { Task } from '@/api/types';
import {
  buildPendingReminders,
  MAX_SCHEDULED,
  scheduleSignature,
  triggerDateFor,
} from '@/reminders/schedule-logic';
import type { ReminderSettings } from '@/reminders/settings';

function makeTask(over: Partial<Task>): Task {
  return {
    id: 't',
    home_id: 'h',
    device_id: null,
    title: 'Task',
    description: null,
    task_type: 'other',
    priority: 'medium',
    recurrence_type: 'monthly',
    recurrence_interval: 1,
    due_date: null,
    last_completed_at: null,
    estimated_minutes: null,
    instructions: null,
    requires_parts: false,
    contractor_required: false,
    status: 'active',
    created_at: '',
    updated_at: '',
    ...over,
  };
}

function settings(over: Partial<ReminderSettings> = {}): ReminderSettings {
  return { enabled: true, leadDays: [0], hour: 9, minute: 0, ...over };
}

describe('triggerDateFor', () => {
  it('builds a local date at the configured time', () => {
    const d = triggerDateFor('2026-07-01', 0, 9, 30);
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2026);
    expect(d!.getMonth()).toBe(6); // July
    expect(d!.getDate()).toBe(1);
    expect(d!.getHours()).toBe(9);
    expect(d!.getMinutes()).toBe(30);
  });
  it('subtracts the lead days', () => {
    const d = triggerDateFor('2026-07-01', 1, 9, 0);
    expect(d!.getDate()).toBe(30);
    expect(d!.getMonth()).toBe(5); // June
  });
  it('returns null for an invalid date', () => {
    expect(triggerDateFor('nope', 0, 9, 0)).toBeNull();
  });
});

describe('scheduleSignature', () => {
  const tasks = [
    makeTask({ id: 'a', due_date: '2026-07-01', title: 'A' }),
    makeTask({ id: 'b', due_date: '2026-08-01', title: 'B' }),
  ];

  it('is stable regardless of task order', () => {
    expect(scheduleSignature(tasks, settings())).toBe(
      scheduleSignature([...tasks].reverse(), settings()),
    );
  });
  it('changes when a due date changes', () => {
    const changed = [makeTask({ id: 'a', due_date: '2026-09-09', title: 'A' }), tasks[1]];
    expect(scheduleSignature(tasks, settings())).not.toBe(
      scheduleSignature(changed, settings()),
    );
  });
  it('changes when settings change', () => {
    expect(scheduleSignature(tasks, settings())).not.toBe(
      scheduleSignature(tasks, settings({ leadDays: [0, 1] })),
    );
  });
});

describe('buildPendingReminders', () => {
  const now = new Date(2026, 5, 25, 12, 0, 0).getTime();

  it('is empty when reminders are disabled', () => {
    const tasks = [makeTask({ due_date: '2026-07-01' })];
    expect(buildPendingReminders(tasks, settings({ enabled: false }), now)).toEqual([]);
  });

  it('schedules future tasks and skips past ones', () => {
    const tasks = [
      makeTask({ id: 'future', due_date: '2026-07-01', title: 'Future' }),
      makeTask({ id: 'past', due_date: '2026-01-01', title: 'Past' }),
      makeTask({ id: 'no-date', due_date: null }),
      makeTask({ id: 'paused', due_date: '2026-07-01', status: 'paused' }),
    ];
    const pending = buildPendingReminders(tasks, settings(), now);
    expect(pending).toHaveLength(1);
    expect(pending[0].taskId).toBe('future');
    expect(pending[0].title).toBe('Future');
  });

  it('emits one reminder per still-future lead time', () => {
    const tasks = [makeTask({ due_date: '2026-07-01' })];
    // now is 2026-06-25, so lead times of 0/1/3 days all land in the future.
    const pending = buildPendingReminders(tasks, settings({ leadDays: [0, 1, 3] }), now);
    expect(pending).toHaveLength(3);
    // Soonest first.
    expect(pending[0].date.getTime()).toBeLessThan(pending[1].date.getTime());
  });

  it('drops lead times that have already passed', () => {
    const tasks = [makeTask({ due_date: '2026-07-01' })];
    // 10 days before 2026-07-01 is 2026-06-21, before now (2026-06-25).
    const pending = buildPendingReminders(tasks, settings({ leadDays: [10] }), now);
    expect(pending).toHaveLength(0);
  });

  it('caps the number scheduled', () => {
    const tasks = Array.from({ length: 200 }, (_, i) =>
      makeTask({ id: `t${i}`, due_date: '2026-07-01', title: `T${i}` }),
    );
    expect(buildPendingReminders(tasks, settings(), now).length).toBe(
      MAX_SCHEDULED,
    );
  });
});
