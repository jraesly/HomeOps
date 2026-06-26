/**
 * Base URL for the HomeOps FastAPI backend.
 *
 * Override per environment with the EXPO_PUBLIC_API_URL env var, e.g.
 * `EXPO_PUBLIC_API_URL=http://192.168.1.20:8000 npx expo start`. On a physical
 * device `localhost` points at the phone, so set this to your machine's LAN IP.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * Optional shared API key sent as the X-API-Key header. Set EXPO_PUBLIC_API_KEY
 * at build time to match the backend's API_KEY. Empty = no header (open API).
 */
export const API_KEY = process.env.EXPO_PUBLIC_API_KEY ?? '';
