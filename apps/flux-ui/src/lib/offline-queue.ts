export interface QueuedMessage {
  id: string;
  message: string;
  deep: boolean;
  verify: boolean;
  createdAt: string;
}

const KEY = 'flux_offline_queue';
const EVENT = 'flux:queue';

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

export function loadQueue(): QueuedMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is QueuedMessage => {
      const row = item as Partial<QueuedMessage> | null;
      return !!row && typeof row.id === 'string' && typeof row.message === 'string' && typeof row.createdAt === 'string';
    });
  } catch {
    return [];
  }
}

export function saveQueue(items: QueuedMessage[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(items.slice(-30)));
  emit();
}

export function enqueueMessage(message: string, deep: boolean, verify: boolean): QueuedMessage {
  const item: QueuedMessage = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    message,
    deep,
    verify,
    createdAt: new Date().toISOString(),
  };
  saveQueue([...loadQueue(), item]);
  return item;
}

export function removeQueued(id: string): QueuedMessage[] {
  const next = loadQueue().filter((item) => item.id !== id);
  saveQueue(next);
  return next;
}

export function clearQueue(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  emit();
}

export function queueEventName(): string {
  return EVENT;
}
