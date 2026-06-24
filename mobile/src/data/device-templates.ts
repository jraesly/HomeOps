import type { DeviceType, RecurrenceType } from '@/api/types';

export interface TemplateTask {
  title: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
}

export interface DeviceTemplate {
  key: string;
  label: string;
  defaultName: string;
  device_type: DeviceType;
  suggestedTasks: TemplateTask[];
}

/**
 * Hardcoded starter templates that speed up device creation and suggest the
 * recurring maintenance a homeowner typically tracks for each device.
 */
export const DEVICE_TEMPLATES: DeviceTemplate[] = [
  {
    key: 'hvac',
    label: 'HVAC System',
    defaultName: 'HVAC System',
    device_type: 'HVAC',
    suggestedTasks: [
      { title: 'Replace filter', recurrence_type: 'custom_days', recurrence_interval: 60 },
      { title: 'Clean outdoor unit', recurrence_type: 'seasonal', recurrence_interval: 1 },
      { title: 'Schedule professional service', recurrence_type: 'yearly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'water_softener',
    label: 'Water Softener',
    defaultName: 'Water Softener',
    device_type: 'Water Treatment',
    suggestedTasks: [
      { title: 'Check salt level', recurrence_type: 'monthly', recurrence_interval: 1 },
      { title: 'Clean brine tank', recurrence_type: 'yearly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'whole_house_filter',
    label: 'Whole-House Filter',
    defaultName: 'Whole-House Filter',
    device_type: 'Water Treatment',
    suggestedTasks: [
      { title: 'Replace sediment filter', recurrence_type: 'custom_days', recurrence_interval: 90 },
    ],
  },
  {
    key: 'refrigerator',
    label: 'Refrigerator',
    defaultName: 'Refrigerator',
    device_type: 'Appliance',
    suggestedTasks: [
      { title: 'Replace water filter', recurrence_type: 'custom_days', recurrence_interval: 180 },
      { title: 'Clean condenser coils', recurrence_type: 'yearly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'dishwasher',
    label: 'Dishwasher',
    defaultName: 'Dishwasher',
    device_type: 'Appliance',
    suggestedTasks: [
      { title: 'Clean filter', recurrence_type: 'monthly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'dryer',
    label: 'Dryer',
    defaultName: 'Dryer',
    device_type: 'Appliance',
    suggestedTasks: [
      { title: 'Clean lint vent', recurrence_type: 'quarterly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'smoke_detector',
    label: 'Smoke Detector',
    defaultName: 'Smoke Detector',
    device_type: 'Safety',
    suggestedTasks: [
      { title: 'Test alarm', recurrence_type: 'monthly', recurrence_interval: 1 },
      { title: 'Replace battery', recurrence_type: 'yearly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'sump_pump',
    label: 'Sump Pump',
    defaultName: 'Sump Pump',
    device_type: 'Plumbing',
    suggestedTasks: [
      { title: 'Test pump', recurrence_type: 'quarterly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'router',
    label: 'Router / Network',
    defaultName: 'Router',
    device_type: 'Network',
    suggestedTasks: [
      { title: 'Check for firmware updates', recurrence_type: 'quarterly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'deck',
    label: 'Deck',
    defaultName: 'Deck',
    device_type: 'Exterior',
    suggestedTasks: [
      { title: 'Inspect and reseal', recurrence_type: 'yearly', recurrence_interval: 1 },
    ],
  },
  {
    key: 'garden_bed',
    label: 'Garden Bed',
    defaultName: 'Garden Bed',
    device_type: 'Garden',
    suggestedTasks: [
      { title: 'Seasonal prep', recurrence_type: 'seasonal', recurrence_interval: 1 },
    ],
  },
];
