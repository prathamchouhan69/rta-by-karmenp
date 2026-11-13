export interface SavedSelection {
  referenceId: string;
  favorite: boolean;
  note: string;
}

export type SelectionPatch = Partial<Pick<SavedSelection, 'favorite' | 'note'>>;

export const SELECTIONS_STORAGE_KEY = 'flux.library-selections.v1';
export const SELECTIONS_FIELD_STORAGE_PREFIX = 'flux.library-selections.v2:';
export const SELECTIONS_EVENT = 'flux:library-selections';

type SelectionField = keyof SelectionPatch;

export function selectionFieldStorageKey(referenceId: string, field: SelectionField): string {
  return `${SELECTIONS_FIELD_STORAGE_PREFIX}${encodeURIComponent(referenceId)}:${field}`;
}

export function isSelectionStorageKey(key: string | null): boolean {
  return key !== null && (
    key === SELECTIONS_STORAGE_KEY
    || key.startsWith(SELECTIONS_FIELD_STORAGE_PREFIX)
  );
}

export function mergeSelection(
  referenceId: string,
  current: SavedSelection | undefined,
  patch: SelectionPatch,
): SavedSelection {
  return {
    referenceId,
    favorite: patch.favorite ?? current?.favorite ?? false,
    note: patch.note ?? current?.note ?? '',
  };
}

function parseSelections(raw: string | null): SavedSelection[] {
  if (!raw) return [];
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): SavedSelection[] => {
    if (
      item === null
      || typeof item !== 'object'
      || typeof item.referenceId !== 'string'
      || typeof item.favorite !== 'boolean'
      || typeof item.note !== 'string'
    ) return [];
    return [{ referenceId: item.referenceId, favorite: item.favorite, note: item.note }];
  });
}

function parseCompleteLegacySelections(raw: string): SavedSelection[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('Legacy selections are not an array.');
  return value.map((item): SavedSelection => {
    if (
      item === null
      || typeof item !== 'object'
      || typeof item.referenceId !== 'string'
      || typeof item.favorite !== 'boolean'
      || typeof item.note !== 'string'
    ) throw new Error('Legacy selections contain an invalid entry.');
    return { referenceId: item.referenceId, favorite: item.favorite, note: item.note };
  });
}

function hasValidStoredField(referenceId: string, field: SelectionField): boolean {
  const raw = localStorage.getItem(selectionFieldStorageKey(referenceId, field));
  if (raw === null) return false;
  try {
    const value: unknown = JSON.parse(raw);
    return field === 'favorite' ? typeof value === 'boolean' : typeof value === 'string';
  } catch {
    return false;
  }
}

function migrateLegacySelections(): SavedSelection[] {
  const raw = localStorage.getItem(SELECTIONS_STORAGE_KEY);
  if (raw === null) return [];
  const legacy = parseCompleteLegacySelections(raw);

  for (const selection of legacy) {
    for (const field of ['favorite', 'note'] as const) {
      const key = selectionFieldStorageKey(selection.referenceId, field);
      if (!hasValidStoredField(selection.referenceId, field)) {
        localStorage.setItem(key, JSON.stringify(selection[field]));
      }
    }
  }

  localStorage.removeItem(SELECTIONS_STORAGE_KEY);
  return legacy;
}

function storedField<T extends boolean | string>(
  referenceId: string,
  field: SelectionField,
  isExpectedType: (value: unknown) => value is T,
  fallback: T,
): T {
  const raw = localStorage.getItem(selectionFieldStorageKey(referenceId, field));
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    return isExpectedType(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function selectionIdsFromStorage(): Set<string> {
  const ids = new Set<string>();
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(SELECTIONS_FIELD_STORAGE_PREFIX)) continue;
    const fieldSeparator = key.lastIndexOf(':');
    const field = key.slice(fieldSeparator + 1);
    if (field !== 'favorite' && field !== 'note') continue;
    try {
      ids.add(decodeURIComponent(key.slice(SELECTIONS_FIELD_STORAGE_PREFIX.length, fieldSeparator)));
    } catch {
      continue;
    }
  }
  return ids;
}

export function readSelections(): SavedSelection[] {
  try {
    const raw = localStorage.getItem(SELECTIONS_STORAGE_KEY);
    const legacy = parseSelections(raw);
    if (raw !== null) {
      try {
        migrateLegacySelections();
      } catch (error) {
        console.error('Could not migrate library selections on this device.', error);
      }
    }

    const legacyById = new Map(legacy.map((selection) => [selection.referenceId, selection]));
    const referenceIds = selectionIdsFromStorage();
    for (const referenceId of legacyById.keys()) referenceIds.add(referenceId);

    return [...referenceIds]
      .map((referenceId) => {
        const old = legacyById.get(referenceId);
        return {
          referenceId,
          favorite: storedField(referenceId, 'favorite', (value): value is boolean => typeof value === 'boolean', old?.favorite ?? false),
          note: storedField(referenceId, 'note', (value): value is string => typeof value === 'string', old?.note ?? ''),
        };
      })
      .filter((selection) => selection.favorite || selection.note.trim());
  } catch (error) {
    console.error('Could not read library selections on this device.', error);
    return [];
  }
}

export function saveSelection(referenceId: string, patch: SelectionPatch) {
  migrateLegacySelections();
  for (const field of ['favorite', 'note'] as const) {
    const value = patch[field];
    if (value !== undefined) {
      localStorage.setItem(selectionFieldStorageKey(referenceId, field), JSON.stringify(value));
    }
  }
  window.dispatchEvent(new CustomEvent(SELECTIONS_EVENT));
}

export function saveSelectionSafely(referenceId: string, patch: SelectionPatch): boolean {
  try {
    saveSelection(referenceId, patch);
    return true;
  } catch (error) {
    console.error('Could not save library selection on this device.', error);
    return false;
  }
}
