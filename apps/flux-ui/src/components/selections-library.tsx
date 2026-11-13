'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState, PageHeader, Section } from '@/components/ui';
import { references } from '@/lib/library-inventory';
import { readSelections, saveSelection, SELECTIONS_EVENT, type SavedSelection } from '@/lib/library-selections';

export function SelectionsLibrary() {
  const [selections, setSelections] = useState<SavedSelection[]>([]);
  const refresh = useCallback(() => setSelections(readSelections()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(SELECTIONS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SELECTIONS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const saved = selections
    .map((selection) => ({ selection, reference: references.find((item) => item.id === selection.referenceId) }))
    .filter((item): item is { selection: SavedSelection; reference: (typeof references)[number] } => Boolean(item.reference));

  return (
    <div className="stack library-screen">
      <PageHeader eyebrow="Personal" title="Selections" description="Your saved references and notes are stored in this browser only." />
      <Section title={`${saved.length} saved reference${saved.length === 1 ? '' : 's'}`}>
        <p className="section-description">Open any reference to continue editing.</p>
        {saved.length ? (
          <div className="selection-list">
            {saved.map(({ selection, reference }) => (
              <article className="selection-card" key={reference.id}>
                <div><span className="library-card-top">#{String(reference.ordinal).padStart(3, '0')} · {reference.category}</span><h3><Link href={`/references/${reference.id}`}>{reference.name}</Link></h3></div>
                <div className="selection-note">{selection.favorite ? <span className="favorite-mark">★ Favorite</span> : null}{selection.note ? <p>{selection.note}</p> : null}</div>
                <button className="button small" type="button" onClick={() => saveSelection(selection.referenceId, { favorite: false, note: '' })}>Remove</button>
              </article>
            ))}
          </div>
        ) : <EmptyState title="Nothing saved yet">Save a reference or add a note to see it here.</EmptyState>}
      </Section>
    </div>
  );
}
