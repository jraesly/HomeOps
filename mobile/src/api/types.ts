// Mirrors the FastAPI Phase 1 response schemas.

export type DeviceType =
  | 'HVAC'
  | 'Water Treatment'
  | 'Appliance'
  | 'Plumbing'
  | 'Electrical'
  | 'Exterior'
  | 'Garden'
  | 'Safety'
  | 'Network'
  | 'Other';

export type DeviceStatus = 'active' | 'watching' | 'needs_service' | 'retired';

export type TaskType =
  | 'replace_filter'
  | 'inspect'
  | 'clean'
  | 'test'
  | 'service'
  | 'refill'
  | 'winterize'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'seasonal'
  | 'custom_days';

export type TaskStatus = 'active' | 'paused' | 'completed_once' | 'archived';

export interface Home {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Area {
  id: string;
  home_id: string;
  name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  home_id: string;
  area_id: string | null;
  name: string;
  room_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  home_id: string;
  room_id: string | null;
  name: string;
  device_type: DeviceType;
  manufacturer: string | null;
  model_number: string | null;
  serial_number: string | null;
  install_date: string | null;
  purchase_date: string | null;
  warranty_end_date: string | null;
  status: DeviceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  home_id: string;
  device_id: string | null;
  title: string;
  description: string | null;
  task_type: TaskType;
  priority: Priority;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  due_date: string | null;
  last_completed_at: string | null;
  estimated_minutes: number | null;
  instructions: string | null;
  requires_parts: boolean;
  contractor_required: boolean;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceLog {
  id: string;
  home_id: string;
  device_id: string | null;
  task_id: string | null;
  completed_at: string;
  title: string;
  notes: string | null;
  cost_cents: number | null;
  performed_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardCounts {
  overdue: number;
  due_soon: number;
  upcoming: number;
}

export interface Dashboard {
  home_id: string;
  home_name: string;
  home_health_score: number;
  counts: DashboardCounts;
  overdue: Task[];
  due_soon: Task[];
  upcoming: Task[];
  recently_completed: MaintenanceLog[];
}

export interface TaskCompletionResult {
  task: Task;
  log: MaintenanceLog;
}

// ---- Request payloads ----

export interface HomeCreate {
  name: string;
  address?: string | null;
  timezone?: string;
}

export interface AreaCreate {
  name: string;
  sort_order?: number;
}

export interface RoomCreate {
  name: string;
  area_id?: string | null;
  room_type?: string | null;
  notes?: string | null;
}

export interface DeviceCreate {
  name: string;
  device_type?: DeviceType;
  room_id?: string | null;
  manufacturer?: string | null;
  model_number?: string | null;
  serial_number?: string | null;
  notes?: string | null;
}

export interface TaskCreate {
  title: string;
  description?: string | null;
  task_type?: TaskType;
  priority?: Priority;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  due_date?: string | null;
  estimated_minutes?: number | null;
  instructions?: string | null;
  requires_parts?: boolean;
  contractor_required?: boolean;
}

export interface LogCreate {
  title: string;
  completed_at?: string | null;
  notes?: string | null;
  cost_cents?: number | null;
  performed_by?: string | null;
  task_id?: string | null;
}

export interface TaskCompletion {
  completed_at?: string | null;
  notes?: string | null;
  cost_cents?: number | null;
  performed_by?: string | null;
  title?: string | null;
}
