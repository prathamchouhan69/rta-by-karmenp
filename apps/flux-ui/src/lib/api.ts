export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown; requestId?: string };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isJson(response: Response): boolean {
  return String(response.headers.get('content-type') || '').includes('application/json');
}

export async function api<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const clean = path.replace(/^\/+/, '');
  const method = options.method || 'GET';
  const response = await fetch(`/api/flux/${clean}`, {
    method,
    headers: options.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (response.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event('flux:unauthorized'));
  }
  if (!isJson(response)) {
    if (!response.ok) throw new ApiError('The server returned an unreadable response.', 'BAD_RESPONSE', response.status);
    return (await response.blob()) as unknown as T;
  }
  const data = (await response.json()) as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(data?.error?.message || 'Request failed.', data?.error?.code || 'REQUEST_FAILED', response.status, data?.error?.details);
  }
  return data;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return `${error.message}${error.code ? ` (${error.code})` : ''}`;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}
