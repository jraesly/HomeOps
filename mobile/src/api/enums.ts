import type { DeviceType, Priority, RecurrenceType, TaskType } from './types';

/** Single source of truth for the selectable enum option lists. */

export const DEVICE_TYPES: readonly DeviceType[] = [
  'HVAC',
  'Water Treatment',
  'Appliance',
  'Plumbing',
  'Electrical',
  'Exterior',
  'Garden',
  'Safety',
  'Network',
  'Other',
];

export const TASK_TYPES: readonly TaskType[] = [
  'inspect',
  'clean',
  'test',
  'service',
  'refill',
  'replace_filter',
  'winterize',
  'other',
];

export const PRIORITIES: readonly Priority[] = [
  'low',
  'medium',
  'high',
  'critical',
];

export const RECURRENCE_OPTIONS: readonly RecurrenceType[] = [
  'none',
  'weekly',
  'monthly',
  'quarterly',
  'yearly',
  'custom_days',
];
