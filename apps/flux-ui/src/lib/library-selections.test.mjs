import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  isSelectionStorageKey,
  readSelections,
  saveSelection,
  SELECTIONS_EVENT,
  SELECTIONS_FIELD_STORAGE_PREFIX,
  SELECTIONS_STORAGE_KEY,
  selectionFieldStorageKey,
} from './library-selections.ts';

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const values = new Map();
let failOnKey = null;
let dispatchedEvents = [];

function installStorage(selections = []) {
  values.clear();
  failOnKey = null;
  dispatchedEvents = [];
  if (selections.length) values.set(SELECTIONS_STORAGE_KEY, JSON.stringify(selections));
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      get length() { return values.size; },
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => {
        if (key === failOnKey) {
          const error = new Error('Storage quota exceeded');
          error.name = 'QuotaExceededError';
          throw error;
        }
        values.set(key, String(value));
      },
      removeItem: (key) => values.delete(key),
      key: (index) => [...values.keys()][index] ?? null,
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { dispatchEvent: (event) => { dispatchedEvents.push(event); return true; } },
  });
}

function valueFor(referenceId, field) {
  const raw = values.get(selectionFieldStorageKey(referenceId, field));
  return raw === undefined ? undefined : JSON.parse(raw);
}

function sortedSelections() {
  return readSelections().sort((left, right) => left.referenceId.localeCompare(right.referenceId));
}

afterEach(() => {
  if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
  else Reflect.deleteProperty(globalThis, 'localStorage');
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

test('a favorite-only patch preserves the existing note and unrelated selections', () => {
  installStorage([
    { referenceId: 'ref-1', favorite: false, note: 'updated in another tab' },
    { referenceId: 'ref-2', favorite: true, note: 'leave untouched' },
  ]);

  saveSelection('ref-1', { favorite: true });

  assert.deepEqual(sortedSelections(), [
    { referenceId: 'ref-1', favorite: true, note: 'updated in another tab' },
    { referenceId: 'ref-2', favorite: true, note: 'leave untouched' },
  ]);
  assert.equal(values.has(SELECTIONS_STORAGE_KEY), false);
  assert.deepEqual(dispatchedEvents.map((event) => event.type), [SELECTIONS_EVENT]);
});

test('sequential writes to different fields and references keep independent values', () => {
  installStorage();

  saveSelection('ref-1', { favorite: true });
  saveSelection('ref-2', { note: 'saved in another tab' });
  saveSelection('ref-1', { note: 'kept alongside the favorite' });

  assert.deepEqual(sortedSelections(), [
    { referenceId: 'ref-1', favorite: true, note: 'kept alongside the favorite' },
    { referenceId: 'ref-2', favorite: false, note: 'saved in another tab' },
  ]);
  assert.equal(valueFor('ref-1', 'favorite'), true);
  assert.equal(valueFor('ref-1', 'note'), 'kept alongside the favorite');
  assert.equal(valueFor('ref-2', 'note'), 'saved in another tab');
  assert.notEqual(
    selectionFieldStorageKey('ref-1', 'favorite'),
    selectionFieldStorageKey('ref-1', 'note'),
  );
  assert.ok([...values.keys()].every((key) => key.startsWith(SELECTIONS_FIELD_STORAGE_PREFIX)));
});

test('a combined patch writes both fields and clearing retains explicit empty values', () => {
  installStorage([{ referenceId: 'ref-1', favorite: false, note: 'old note' }]);

  saveSelection('ref-1', { favorite: true, note: 'local note' });
  assert.deepEqual(sortedSelections(), [
    { referenceId: 'ref-1', favorite: true, note: 'local note' },
  ]);

  saveSelection('ref-1', { favorite: false, note: '' });
  assert.deepEqual(sortedSelections(), []);
  assert.equal(valueFor('ref-1', 'favorite'), false);
  assert.equal(valueFor('ref-1', 'note'), '');
});

test('legacy selections migrate once into independent field keys', () => {
  installStorage([
    { referenceId: 'ref-1', favorite: true, note: 'legacy note' },
    { referenceId: 'ref-2', favorite: false, note: 'another note' },
  ]);

  assert.deepEqual(sortedSelections(), [
    { referenceId: 'ref-1', favorite: true, note: 'legacy note' },
    { referenceId: 'ref-2', favorite: false, note: 'another note' },
  ]);
  assert.equal(values.has(SELECTIONS_STORAGE_KEY), false);
  assert.equal(valueFor('ref-1', 'favorite'), true);
  assert.equal(valueFor('ref-1', 'note'), 'legacy note');
  assert.equal(valueFor('ref-2', 'favorite'), false);
  assert.equal(valueFor('ref-2', 'note'), 'another note');
});

test('storage clear events are not selection changes', () => {
  assert.equal(isSelectionStorageKey(null), false);
  assert.equal(isSelectionStorageKey(SELECTIONS_STORAGE_KEY), true);
  assert.equal(isSelectionStorageKey(selectionFieldStorageKey('ref-1', 'note')), true);
});

test('quota failure preserves legacy data and migration can be retried', () => {
  installStorage([{ referenceId: 'ref-1', favorite: true, note: 'do not lose me' }]);
  failOnKey = selectionFieldStorageKey('ref-1', 'note');

  assert.throws(
    () => saveSelection('ref-2', { favorite: true }),
    { name: 'QuotaExceededError' },
  );
  assert.equal(values.has(SELECTIONS_STORAGE_KEY), true);
  assert.equal(valueFor('ref-1', 'favorite'), true);

  const originalConsoleError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    assert.deepEqual(sortedSelections(), [
      { referenceId: 'ref-1', favorite: true, note: 'do not lose me' },
    ]);
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /Could not migrate library selections/);

  failOnKey = null;
  assert.deepEqual(sortedSelections(), [
    { referenceId: 'ref-1', favorite: true, note: 'do not lose me' },
  ]);
  assert.equal(values.has(SELECTIONS_STORAGE_KEY), false);
  assert.equal(valueFor('ref-1', 'note'), 'do not lose me');
});

test('malformed legacy entries are not discarded by migration', () => {
  installStorage();
  values.set(SELECTIONS_STORAGE_KEY, JSON.stringify([
    { referenceId: 'ref-1', favorite: true, note: 'preserve the source' },
    { referenceId: 'invalid', favorite: 'yes', note: '' },
  ]));

  const originalConsoleError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    assert.deepEqual(sortedSelections(), [
      { referenceId: 'ref-1', favorite: true, note: 'preserve the source' },
    ]);
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(errors.length, 1);
  assert.match(errors[0][0], /Could not migrate library selections/);
  assert.equal(values.has(SELECTIONS_STORAGE_KEY), true);
  assert.equal(valueFor('ref-1', 'favorite'), undefined);
});
