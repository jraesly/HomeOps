import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  completeTask,
  createDeviceInRoom,
  createHome,
  createRoom,
  createTask,
  getDashboard,
  getDevice,
  getRoom,
  getTask,
  listDeviceLogs,
  listDeviceTasks,
  listDevices,
  listHomeTasks,
  listHomes,
  listRooms,
} from './endpoints';
import { queryKeys } from './keys';
import type {
  DeviceCreate,
  RoomCreate,
  TaskCompletion,
  TaskCreate,
} from './types';

/**
 * Resolve the "current" home. Phase 1/2 is single-home: pick the first home,
 * creating a default one the first time the app runs.
 */
export function useCurrentHome() {
  return useQuery({
    queryKey: queryKeys.currentHome,
    queryFn: async () => {
      const homes = await listHomes();
      if (homes.length > 0) return homes[0];
      return createHome({ name: 'My Home' });
    },
  });
}

export function useDashboard(homeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dashboard(homeId ?? ''),
    queryFn: () => getDashboard(homeId as string),
    enabled: !!homeId,
  });
}

export function useRooms(homeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.rooms(homeId ?? ''),
    queryFn: () => listRooms(homeId as string),
    enabled: !!homeId,
  });
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: queryKeys.room(roomId),
    queryFn: () => getRoom(roomId),
  });
}

export function useDevices(homeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.devices(homeId ?? ''),
    queryFn: () => listDevices(homeId as string),
    enabled: !!homeId,
  });
}

export function useDevice(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.device(deviceId),
    queryFn: () => getDevice(deviceId),
  });
}

export function useDeviceTasks(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.deviceTasks(deviceId),
    queryFn: () => listDeviceTasks(deviceId),
  });
}

export function useDeviceLogs(deviceId: string) {
  return useQuery({
    queryKey: queryKeys.deviceLogs(deviceId),
    queryFn: () => listDeviceLogs(deviceId),
  });
}

export function useHomeTasks(homeId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.homeTasks(homeId ?? ''),
    queryFn: () => listHomeTasks(homeId as string),
    enabled: !!homeId,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: queryKeys.task(taskId),
    queryFn: () => getTask(taskId),
  });
}

export function useCreateRoom(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RoomCreate) => createRoom(homeId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rooms(homeId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(homeId) });
    },
  });
}

export function useCreateDevice(homeId: string, roomId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DeviceCreate) => createDeviceInRoom(roomId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices(homeId) });
      qc.invalidateQueries({ queryKey: queryKeys.room(roomId) });
    },
  });
}

export function useCreateTask(homeId: string, deviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCreate) => createTask(deviceId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.deviceTasks(deviceId) });
      qc.invalidateQueries({ queryKey: queryKeys.homeTasks(homeId) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(homeId) });
    },
  });
}

export function useCompleteTask(homeId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskId: string; payload: TaskCompletion }) =>
      completeTask(vars.taskId, vars.payload),
    onSuccess: (result) => {
      const { task, log } = result;
      qc.invalidateQueries({ queryKey: queryKeys.task(task.id) });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard(homeId) });
      qc.invalidateQueries({ queryKey: queryKeys.homeTasks(homeId) });
      if (task.device_id) {
        qc.invalidateQueries({
          queryKey: queryKeys.deviceTasks(task.device_id),
        });
        qc.invalidateQueries({
          queryKey: queryKeys.deviceLogs(task.device_id),
        });
      }
      if (log.device_id) {
        qc.invalidateQueries({
          queryKey: queryKeys.deviceLogs(log.device_id),
        });
      }
    },
  });
}
