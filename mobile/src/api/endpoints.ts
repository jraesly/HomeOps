import { apiFetch } from './client';
import type {
  Dashboard,
  Device,
  DeviceCreate,
  Home,
  HomeCreate,
  MaintenanceLog,
  Room,
  RoomCreate,
  Task,
  TaskCompletion,
  TaskCompletionResult,
  TaskCreate,
} from './types';

// Homes
export const listHomes = () => apiFetch<Home[]>('/homes');
export const createHome = (payload: HomeCreate) =>
  apiFetch<Home>('/homes', { method: 'POST', body: payload });
export const getDashboard = (homeId: string) =>
  apiFetch<Dashboard>(`/homes/${homeId}/dashboard`);

// Rooms
export const listRooms = (homeId: string) =>
  apiFetch<Room[]>(`/homes/${homeId}/rooms`);
export const getRoom = (roomId: string) => apiFetch<Room>(`/rooms/${roomId}`);
export const createRoom = (homeId: string, payload: RoomCreate) =>
  apiFetch<Room>(`/homes/${homeId}/rooms`, { method: 'POST', body: payload });

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
export const completeTask = (taskId: string, payload: TaskCompletion) =>
  apiFetch<TaskCompletionResult>(`/tasks/${taskId}/complete`, {
    method: 'POST',
    body: payload,
  });

// Logs
export const listDeviceLogs = (deviceId: string) =>
  apiFetch<MaintenanceLog[]>(`/devices/${deviceId}/logs`);
