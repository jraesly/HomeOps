/** Centralized TanStack Query keys so invalidation stays consistent. */
export const queryKeys = {
  homes: ['homes'] as const,
  currentHome: ['currentHome'] as const,
  dashboard: (homeId: string) => ['dashboard', homeId] as const,
  areas: (homeId: string) => ['areas', homeId] as const,
  rooms: (homeId: string) => ['rooms', homeId] as const,
  room: (roomId: string) => ['room', roomId] as const,
  devices: (homeId: string) => ['devices', homeId] as const,
  device: (deviceId: string) => ['device', deviceId] as const,
  homeTasks: (homeId: string) => ['homeTasks', homeId] as const,
  deviceTasks: (deviceId: string) => ['deviceTasks', deviceId] as const,
  task: (taskId: string) => ['task', taskId] as const,
  deviceLogs: (deviceId: string) => ['deviceLogs', deviceId] as const,
  consumables: (homeId: string) => ['consumables', homeId] as const,
  taskConsumables: (taskId: string) => ['taskConsumables', taskId] as const,
};
