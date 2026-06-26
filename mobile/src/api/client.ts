import { API_BASE_URL, API_KEY } from './config';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Generous timeout: the free Render tier can take ~50s to wake from idle.
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Thin typed wrapper around fetch for the HomeOps backend. Serializes JSON
 * bodies, surfaces FastAPI `detail` messages as ApiError, applies a timeout,
 * and maps network/timeout failures to friendly messages.
 */
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const { method = 'GET', body } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY ? { 'X-API-Key': API_KEY } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError(
        0,
        'The server took too long to respond — it may be waking up. Try again.',
      );
    }
    throw new ApiError(0, "Couldn't reach the server. Check your connection.");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const data = (await response.json()) as { detail?: string };
      if (data.detail) detail = data.detail;
    } catch {
      // Non-JSON error body; fall back to the status text.
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
