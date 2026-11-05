export type ApiError = {
  code: string;
  message: string;
};

export type ZohoRecord = {
  [key: string]: unknown;
};

export type ApiResult<T> = {
  ok: true;
  data: T;
  meta?: {
    page?: number;
    per_page?: number;
    has_more_page?: boolean;
  };
};

type ErrorResult = {
  ok: false;
  error: ApiError;
};

export class RequestError extends Error {
  code: string;
  status: number;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = "RequestError";
    this.code = error.code;
    this.status = status;
  }
}

const TOKEN_KEY = "karm-api-access-token";
export const AUTH_EXPIRED_EVENT = "karm:auth-expired";

export function getAccessToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function decode<T>(response: Response): Promise<ApiResult<T>> {
  let payload: ApiResult<T> | ErrorResult;
  try {
    payload = (await response.json()) as ApiResult<T> | ErrorResult;
  } catch {
    throw new RequestError(response.status, {
      code: "INVALID_RESPONSE",
      message: "The API returned an unreadable response. Check that the backend is running.",
    });
  }

  if (!response.ok || !payload.ok) {
    const error = "error" in payload ? payload.error : {
      code: "REQUEST_FAILED",
      message: `The API request failed (${response.status}).`,
    };
    if (response.status === 401) {
      clearAccessToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new RequestError(response.status, error);
  }
  return payload;
}

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<ApiResult<T>> {
  const token = getAccessToken();
  const response = await fetch(`/api/v1${path}`, {
    headers: token ? { Authorization: "Bearer " + token } : {},
    signal,
  });
  return decode<T>(response);
}

export async function apiPost<T>(path: string, body: ZohoRecord): Promise<ApiResult<T>> {
  const token = getAccessToken();
  const response = await fetch(`/api/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: JSON.stringify(body),
  });
  return decode<T>(response);
}

export async function apiWrite<T>(
  path: string,
  method: "POST" | "PUT",
  body: ZohoRecord,
  key: string,
  extraHeaders: Record<string, string> = {},
): Promise<ApiResult<T>> {
  const token = getAccessToken();
  const response = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": key,
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  return decode<T>(response);
}

export async function signIn(setupCode: string): Promise<void> {
  const response = await fetch("/api/v1/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setup_code: setupCode }),
  });
  const result = await decode<{ access_token: string }>(response);
  sessionStorage.setItem(TOKEN_KEY, result.data.access_token);
}

export function makeIdempotencyKey(action: string): string {
  return `${action}:${crypto.randomUUID()}`;
}

export function recordName(record: ZohoRecord): string {
  return stringField(record, "contact_name", "customer_name", "vendor_name", "name", "item_name") || "Unnamed record";
}

export function recordId(record: ZohoRecord): string {
  return stringField(
    record,
    "invoice_id",
    "contact_id",
    "item_id",
    "customer_id",
    "vendor_id",
    "tax_id",
    "id",
  );
}

export function invoiceId(invoice: ZohoRecord): string {
  return stringField(invoice, "invoice_id", "id");
}

export function stringField(record: ZohoRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return "";
}

export function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function invoiceStatus(invoice: ZohoRecord): string {
  return stringField(invoice, "status", "invoice_status").toLowerCase() || "unknown";
}

export function statusTone(status: string): "cyan" | "amber" | "rose" | "muted" {
  if (["paid", "closed", "approved", "active", "received"].includes(status)) return "cyan";
  if (["overdue", "over due", "pending", "draft", "unpaid"].includes(status)) return "amber";
  if (["void", "cancelled", "canceled", "rejected"].includes(status)) return "rose";
  return "muted";
}

export function isOpenInvoice(invoice: ZohoRecord): boolean {
  return !["paid", "void", "cancelled", "canceled", "closed"].includes(invoiceStatus(invoice));
}
