export type ZohoRecord = Record<string, unknown>;

export type Health = {
  mode: "mock" | "live";
  authenticated: boolean;
  service: string;
  zohoConfigured?: boolean;
};

export class RequestError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "RequestError";
  }
}

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export async function signIn(setupCode: string): Promise<void> {
  const response = await fetch("/api/v1/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ setup_code: setupCode }),
  });
  const payload = (await response.json()) as { token?: string; ok?: boolean; error?: { message?: string } };
  if (!response.ok || !payload.token) throw new Error(payload.error?.message || "Sign-in failed.");
  accessToken = payload.token;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(init.headers as Record<string, string>) };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  const response = await fetch(`/api/v1${path}`, { ...init, headers });
  if (response.status === 401) {
    clearAccessToken();
    window.dispatchEvent(new Event("auth-expired"));
  }
  const payload = (await response.json()) as { data?: unknown; ok?: boolean; error?: { message?: string } };
  if (!response.ok) throw new RequestError(response.status, payload.error?.message || `Request failed (${response.status})`);
  return (payload.data ?? payload) as T;
}

export function apiGet<T>(path: string, signal?: AbortSignal): Promise<{ data: T; page_context?: unknown }> {
  return request(path, { signal });
}

export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<{ data: T }> {
  return request(path, { method: "POST", body: JSON.stringify(body), signal });
}

export function apiWrite<T>(
  path: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body: unknown,
  idempotencyKey: string,
  headers: Record<string, string> = {}
): Promise<{ data: T }> {
  return request(path, {
    method,
    body: JSON.stringify(body),
    headers: { "Idempotency-Key": idempotencyKey, ...headers },
  });
}

export function invoiceId(record: ZohoRecord): string | undefined {
  return String(record.invoice_id ?? record.id ?? "");
}

export function recordId(record: ZohoRecord): string | undefined {
  return String(record.id ?? record.contact_id ?? record.item_id ?? record.tax_id ?? "");
}

export function recordName(record: ZohoRecord): string {
  return String(record.contact_name ?? record.item_name ?? record.invoice_number ?? record.tax_name ?? record.name ?? "");
}

export function stringField(record: ZohoRecord, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return String(value);
  }
  return undefined;
}

export function invoiceStatus(record: ZohoRecord): string {
  return String(record.status ?? "draft");
}

export function isOpenInvoice(record: ZohoRecord): boolean {
  const status = invoiceStatus(record);
  return status !== "paid" && status !== "void";
}

export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

export function makeIdempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const AUTH_EXPIRED_EVENT = "auth-expired";

export function statusTone(status: string): "cyan" | "amber" | "rose" | "violet" | "green" {
  const s = status.toLowerCase();
  if (s === "paid" || s === "sent") return "green";
  if (s === "overdue") return "rose";
  if (s === "draft") return "amber";
  if (s === "void") return "violet";
  return "cyan";
}
