'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PageHeader, Section, Stat } from '@/components/ui';
import { charts, INVENTORY_COUNTS } from '@/lib/library-inventory';

export function ChartsLibrary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const categories = [...new Set(charts.map((item) => item.category))];
  const filtered = useMemo(() => charts.filter((item) =>
    (category === 'All categories' || item.category === category)
    && item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  ), [category, query]);

  return (
    <div className="stack library-screen">
      <PageHeader eyebrow="Explore" title="Charts library" description="Every chart named in the source inventory, with live data shown only where an existing backend source is verified." />
      <div className="library-stats">
        <Stat label="Charts" value={INVENTORY_COUNTS.charts} />
        <Stat label="Connected sources" value={charts.filter((chart) => chart.connected).length} />
        <Stat label="Not connected" value={charts.filter((chart) => !chart.connected).length} />
      </div>
      <Section title="Browse charts">
        <p className="section-description">Source-order groups reflect the organization of the inventory.</p>
        <div className="library-filters">
          <label className="field"><span>Search charts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chart name…" /></label>
          <label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
        </div>
        <p className="library-result-count" aria-live="polite">{filtered.length} of {charts.length} charts</p>
        <div className="library-card-grid">
          {filtered.map((chart) => (
            <Link className="library-card chart-card" href={`/charts/${chart.id}`} key={chart.id}>
              <span className="library-card-top"><span>#{String(chart.ordinal).padStart(3, '0')}</span><span>{chart.category}</span></span>
              <strong>{chart.name}</strong>
              <span className={`connection-state${chart.connected ? ' connected' : ''}`}>{chart.connected ? 'Source available' : 'Not connected'}</span>
            </Link>
          ))}
          {filtered.length === 0 ? <p className="library-empty">No charts match this search.</p> : null}
        </div>
      </Section>
    </div>
  );
}
