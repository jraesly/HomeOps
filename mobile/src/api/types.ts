/**
 * App-facing type aliases over the generated OpenAPI schema (`schema.d.ts`).
 *
 * The schema is generated from the FastAPI backend — regenerate with
 * `npm run generate:api` (see scripts) so these never drift from the API.
 */
import type { components } from './schema';

type Schemas = components['schemas'];

// Entities (read models)
export type Home = Schemas['HomeRead'];
export type Area = Schemas['AreaRead'];
export type Room = Schemas['RoomRead'];
export type Device = Schemas['DeviceRead'];
export type Task = Schemas['TaskRead'];
export type MaintenanceLog = Schemas['LogRead'];
export type Consumable = Schemas['ConsumableRead'];
export type TaskConsumable = Schemas['TaskConsumableRead'];
export type Dashboard = Schemas['Dashboard'];
export type DashboardCounts = Schemas['DashboardCounts'];
export type TaskCompletionResult = Schemas['TaskCompletionResult'];

// Request payloads
export type HomeCreate = Schemas['HomeCreate'];
export type AreaCreate = Schemas['AreaCreate'];
export type RoomCreate = Schemas['RoomCreate'];
export type RoomUpdate = Schemas['RoomUpdate'];
export type DeviceCreate = Schemas['DeviceCreate'];
export type TaskCreate = Schemas['TaskCreate'];
export type TaskUpdate = Schemas['TaskUpdate'];
export type TaskCompletion = Schemas['TaskCompletion'];
export type LogCreate = Schemas['LogCreate'];
export type ConsumableCreate = Schemas['ConsumableCreate'];
export type ConsumableUpdate = Schemas['ConsumableUpdate'];
export type TaskConsumableCreate = Schemas['TaskConsumableCreate'];

// Enums
export type DeviceType = Schemas['DeviceType'];
export type DeviceStatus = Schemas['DeviceStatus'];
export type TaskType = Schemas['TaskType'];
export type Priority = Schemas['Priority'];
export type RecurrenceType = Schemas['RecurrenceType'];
export type TaskStatus = Schemas['TaskStatus'];
