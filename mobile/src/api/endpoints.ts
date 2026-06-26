import { apiFetch } from './client';
import type {
  Area,
  AreaCreate,
  Consumable,
  ConsumableCreate,
  ConsumableUpdate,
  Dashboard,
  Device,
  DeviceCreate,
  Home,
  HomeCreate,
  LogCreate,
  MaintenanceLog,
  Room,
  RoomCreate,
  RoomUpdate,
  Task,
  TaskCompletion,
  TaskCompletionResult,
  TaskConsumable,
  TaskConsumableCreate,
  TaskCreate,
} from './types';

// Homes
export const listHomes = () => apiFetch<Home[]>('/homes');
export const createHome = (payload: HomeCreate) =>
  apiFetch<Home>('/homes', { method: 'POST', body: payload });
export const getDashboard = (homeId: string) =>
  apiFetch<Dashboard>(`/homes/${homeId}/dashboard`);

// Areas
export const listAreas = (homeId: string) =>
  apiFetch<Area[]>(`/homes/${homeId}/areas`);
export const createArea = (homeId: string, payload: AreaCreate) =>
  apiFetch<Area>(`/homes/${homeId}/areas`, { method: 'POST', body: payload });

// Rooms
export const listRooms = (homeId: string) =>
  apiFetch<Room[]>(`/homes/${homeId}/rooms`);
export const getRoom = (roomId: string) => apiFetch<Room>(`/rooms/${roomId}`);
export const createRoom = (homeId: string, payload: RoomCreate) =>
  apiFetch<Room>(`/homes/${homeId}/rooms`, { method: 'POST', body: payload });
export const updateRoom = (roomId: string, payload: RoomUpdate) =>
  apiFetch<Room>(`/rooms/${roomId}`, { method: 'PATCH', body: payload });

// Devices
export const listDevices = (homeId: string) =>
  apiFetch<Device[]>(`/homes/${homeId}/devices`);
export const getDevice = (deviceId: string) =>
  apiFetch<Device>(`/devices/${deviceId}`);
export const createDeviceInRoom = (roomId: string, payload: DeviceCreate) =>
  apiFetch<Device>(`/rooms/${roomId}/devices`, {
    method: 'POST',
    body: payload,
  });

// Tasks
export const listHomeTasks = (homeId: string) =>
  apiFetch<Task[]>(`/homes/${homeId}/tasks`);
export const listDeviceTasks = (deviceId: string) =>
  apiFetch<Task[]>(`/devices/${deviceId}/tasks`);
export const getTask = (taskId: string) => apiFetch<Task>(`/tasks/${taskId}`);
export const createTask = (deviceId: string, payload: TaskCreate) =>
  apiFetch<Task>(`/devices/${deviceId}/tasks`, {
    method: 'POST',
    body: payload,
  });
export const deleteTask = (taskId: string) =>
  apiFetch<void>(`/tasks/${taskId}`, { method: 'DELETE' });
export const completeTask = (taskId: string, payload: TaskCompletion) =>
  apiFetch<TaskCompletionResult>(`/tasks/${taskId}/complete`, {
    method: 'POST',
    body: payload,
  });

// Consumables
export const listConsumables = (homeId: string) =>
  apiFetch<Consumable[]>(`/homes/${homeId}/consumables`);
export const createConsumable = (homeId: string, payload: ConsumableCreate) =>
  apiFetch<Consumable>(`/homes/${homeId}/consumables`, {
    method: 'POST',
    body: payload,
  });
export const updateConsumable = (
  consumableId: string,
  payload: ConsumableUpdate,
) =>
  apiFetch<Consumable>(`/consumables/${consumableId}`, {
    method: 'PATCH',
    body: payload,
  });
export const deleteConsumable = (consumableId: string) =>
  apiFetch<void>(`/consumables/${consumableId}`, { method: 'DELETE' });

export const listTaskConsumables = (taskId: string) =>
  apiFetch<TaskConsumable[]>(`/tasks/${taskId}/consumables`);
export const linkTaskConsumable = (
  taskId: string,
  payload: TaskConsumableCreate,
) =>
  apiFetch<TaskConsumable>(`/tasks/${taskId}/consumables`, {
    method: 'POST',
    body: payload,
  });
export const unlinkTaskConsumable = (linkId: string) =>
  apiFetch<void>(`/task-consumables/${linkId}`, { method: 'DELETE' });

// Logs
export const listDeviceLogs = (deviceId: string) =>
  apiFetch<MaintenanceLog[]>(`/devices/${deviceId}/logs`);
export const createDeviceLog = (deviceId: string, payload: LogCreate) =>
  apiFetch<MaintenanceLog>(`/devices/${deviceId}/logs`, {
    method: 'POST',
    body: payload,
  });
