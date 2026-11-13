'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LibraryVisual } from '@/components/library-visual';
import { PageHeader, Section } from '@/components/ui';
import { references, VISUAL_FAMILIES } from '@/lib/library-inventory';
import { isSelectionStorageKey, mergeSelection, readSelections, saveSelectionSafely, SELECTIONS_EVENT, type SavedSelection, type SelectionPatch } from '@/lib/library-selections';

export function ReferenceDetail({ id }: { id: string }) {
  const reference = references.find((item) => item.id === id);
  const [favorite, setFavorite] = useState(false);
  const [note, setNote] = useState('');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unavailable'>('saved');
  const [ready, setReady] = useState(false);
  const pendingSelection = useRef<SavedSelection | null>(null);
  const dirtyFields = useRef(new Set<keyof SelectionPatch>());
  const fieldVersions = useRef({ favorite: 0, note: 0 });
  const writing = useRef(false);
  const timer = useRef<number | null>(null);
  const selectionReady = ready && pendingSelection.current?.referenceId === id;

  function persistPending(referenceId: string, updateStatus: boolean) {
    const current = pendingSelection.current;
    if (!dirtyFields.current.size || !current || current.referenceId !== referenceId) return;

    const patch: SelectionPatch = {};
    const versions = { ...fieldVersions.current };
    if (dirtyFields.current.has('favorite')) patch.favorite = current.favorite;
    if (dirtyFields.current.has('note')) patch.note = current.note;

    const latest = readSelections().find((item) => item.referenceId === referenceId);
    pendingSelection.current = mergeSelection(referenceId, latest, patch);
    const savedSelection = pendingSelection.current;
    if (updateStatus) {
      setFavorite(savedSelection.favorite);
      setNote(savedSelection.note);
    }

    writing.current = true;
    const saved = saveSelectionSafely(referenceId, patch);
    writing.current = false;
    if (saved) {
      if (dirtyFields.current.has('favorite') && fieldVersions.current.favorite === versions.favorite) {
        dirtyFields.current.delete('favorite');
      }
      if (dirtyFields.current.has('note') && fieldVersions.current.note === versions.note) {
        dirtyFields.current.delete('note');
      }
      const afterSave = readSelections().find((item) => item.referenceId === referenceId);
      const currentAfterSave = pendingSelection.current;
      if (currentAfterSave?.referenceId === referenceId) {
        pendingSelection.current = mergeSelection(referenceId, afterSave, {
          ...(dirtyFields.current.has('favorite') ? { favorite: currentAfterSave.favorite } : {}),
          ...(dirtyFields.current.has('note') ? { note: currentAfterSave.note } : {}),
        });
      }
    }
    if (updateStatus) {
      const allSaved = dirtyFields.current.size === 0;
      const selection = pendingSelection.current;
      if (selection?.referenceId === referenceId) {
        setFavorite(selection.favorite);
        setNote(selection.note);
      }
      setSaveState(saved ? (allSaved ? 'saved' : 'saving') : 'unavailable');
    }
  }

  function scheduleSave(referenceId: string, delay: number) {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setSaveState('saving');
    timer.current = window.setTimeout(() => {
      timer.current = null;
      persistPending(referenceId, true);
    }, delay);
  }

  function updateSelection(update: Partial<Pick<SavedSelection, 'favorite' | 'note'>>, delay: number) {
    const current = pendingSelection.current;
    if (!selectionReady || !current) return;
    const next = { ...current, ...update };
    pendingSelection.current = next;
    if (update.favorite !== undefined) {
      dirtyFields.current.add('favorite');
      fieldVersions.current.favorite += 1;
    }
    if (update.note !== undefined) {
      dirtyFields.current.add('note');
      fieldVersions.current.note += 1;
    }
    setFavorite(next.favorite);
    setNote(next.note);
    scheduleSave(next.referenceId, delay);
  }

  useEffect(() => {
    setReady(false);
    const existing = readSelections().find((item) => item.referenceId === id);
    const selection = { referenceId: id, favorite: existing?.favorite ?? false, note: existing?.note ?? '' };
    pendingSelection.current = selection;
    dirtyFields.current.clear();
    fieldVersions.current = { favorite: 0, note: 0 };
    setFavorite(selection.favorite);
    setNote(selection.note);
    setSaveState('saved');
    setReady(true);

    function syncExternalSelection() {
      if (writing.current) return;
      const current = pendingSelection.current;
      if (!current || current.referenceId !== id) return;
      const external = readSelections().find((item) => item.referenceId === id);
      const next = mergeSelection(id, external, {
        ...(dirtyFields.current.has('favorite') ? { favorite: current.favorite } : {}),
        ...(dirtyFields.current.has('note') ? { note: current.note } : {}),
      });
      pendingSelection.current = next;
      setFavorite(next.favorite);
      setNote(next.note);
      if (!dirtyFields.current.size) setSaveState('saved');
    }

    function syncStorage(event: StorageEvent) {
      if (!isSelectionStorageKey(event.key)) return;
      syncExternalSelection();
    }
    window.addEventListener('storage', syncStorage);
    window.addEventListener(SELECTIONS_EVENT, syncExternalSelection);

    return () => {
      window.removeEventListener('storage', syncStorage);
      window.removeEventListener(SELECTIONS_EVENT, syncExternalSelection);
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      persistPending(id, false);
    };
  }, [id]);

  if (!reference) {
    return <div className="stack"><PageHeader eyebrow="Reference" title="Reference not found" description="This ID is not in the source inventory." /><Link href="/references">Back to references</Link></div>;
  }

  return (
    <div className="stack library-screen">
      <PageHeader eyebrow={`Reference #${String(reference.ordinal).padStart(3, '0')} · ${reference.category}`} title={reference.name} description="Five visual directions for exploration. These are visual concepts, not verified scientific explanations." />
      <div className="reference-toolbar">
        <Link href="/references" className="text-link">← All references</Link>
        <button className={`button small${favorite ? ' primary' : ''}`} type="button" aria-pressed={favorite} disabled={!selectionReady} onClick={() => updateSelection({ favorite: !favorite }, 500)}>
          {favorite ? '★ Saved to selections' : '☆ Save reference'}
        </button>
      </div>
      <div className="notice warn">Scientific detail: needs verification. The source inventory provides a name and design directions, not an explanatory science source.</div>
      {reference.guideOption ? <div className="notice info">Existing guide direction: <strong>{reference.guideOption}</strong>. This is a visual mapping suggestion, not a verified data connection.</div> : null}
      <Section title="Visual directions">
        <p className="section-description">{VISUAL_FAMILIES.length} distinct families, individualized for this reference.</p>
        <div className="visual-options">
          {VISUAL_FAMILIES.map((family, index) => (
            <article className="visual-option" key={family}>
              <LibraryVisual title={reference.name} category={reference.category} index={reference.ordinal * 5 + index} />
              <span className="visual-option-index">Direction {String(index + 1).padStart(2, '0')}</span>
            </article>
          ))}
        </div>
      </Section>
      <Section title="Your note">
        <p className="section-description">Saved in this browser only. Notes are not sent to Flux or a server.</p>
        <label className="field">
          <span>Private note</span>
          <textarea rows={4} value={note} disabled={!selectionReady} onChange={(event) => updateSelection({ note: event.target.value }, 800)} placeholder="Add a thought or reminder…" />
        </label>
        <p className="save-state" role="status">{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved on this device' : 'Could not save on this device'}</p>
      </Section>
    </div>
  );
}
