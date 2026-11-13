'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader, Section, Stat } from '@/components/ui';
import { references, VISUAL_FAMILIES, INVENTORY_COUNTS } from '@/lib/library-inventory';

export function ReferencesLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const categories = [...new Set(references.map((item) => item.category))];
  const filtered = useMemo(() => references.filter((item) =>
    (category === 'All categories' || item.category === category)
    && item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ), [category, query]);

  return (
    <div className="stack library-screen">
      <PageHeader eyebrow="Explore" title="Impossible nature library" description="Reference-driven visual concepts, presented as directions rather than verified scientific explanations." />
      <div className="library-stats">
        <Stat label="References" value={INVENTORY_COUNTS.references} />
        <Stat label="Visual directions" value={INVENTORY_COUNTS.visualOptions} />
        <Stat label="Families per reference" value={VISUAL_FAMILIES.length} />
      </div>
      <Section title="Browse references">
        <p className="section-description">Search the complete source inventory or narrow it by source-order group.</p>
        <div className="library-filters">
          <label className="field">
            <span>Search references</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name…" />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option>All categories</option>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        </div>
        <p className="library-result-count" aria-live="polite">{filtered.length} of {references.length} references</p>
        <div className="library-card-grid">
          {filtered.map((item) => (
            <Link className="library-card reference-card" href={`/references/${item.id}`} key={item.id}>
              <span className="library-card-top"><span>#{String(item.ordinal).padStart(3, '0')}</span><span>{item.category}</span></span>
              <strong>{item.name}</strong>
              <span className="library-card-bottom">5 visual directions <span aria-hidden="true">→</span></span>
            </Link>
          ))}
          {filtered.length === 0 ? <p className="library-empty">No references match this search.</p> : null}
        </div>
      </Section>
    </div>
  );
}
