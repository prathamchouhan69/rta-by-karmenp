'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, PageHeader, Section } from '@/components/ui';
import { useSession, can } from '@/components/providers';
import { ApiError, api, errorMessage } from '@/lib/api';

interface Scheme {
  id: string;
  title: string;
  author: string;
  year: number | string;
  officialUrl: string | null;
  source: string;
  whatItIs: string | null;
  practicalSteps: string[];
  avoid: string[];
  limitations: string[];
  confidence: string;
}

interface SchemesResponse {
  count: number;
  lastReviewed: string;
  live: false;
  sourceType: 'curated_static';
  schemes: Scheme[];
  verificationRequired: true;
  verifyNote: string;
  disclaimer: string;
  limitations: string[];
}

export default function SchemesPage() {
  const user = useSession();
  const permitted = can(user, 'knowledge:read');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);
  const [results, setResults] = useState<SchemesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async (searchQuery: string | null = null) => {
    if (!permitted) return;
    setLoading(true);
    setError('');
    setForbidden(false);
    setResults(null);
    setSubmittedQuery(searchQuery);
    try {
      const response = searchQuery === null
        ? await api<SchemesResponse>('v1/opportunities/schemes')
        : await api<SchemesResponse>('v1/opportunities/schemes/search', {
          method: 'POST',
          body: { query: searchQuery, limit: 100 },
        });
      setResults(response);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) {
        setForbidden(true);
      } else {
        setError(errorMessage(cause));
      }
    } finally {
      setLoading(false);
    }
  }, [permitted]);

  useEffect(() => { void load(); }, [load]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void load(query.trim() || null);
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Knowledge · India"
        title="Government schemes"
        description="Browse a small, curated directory of government schemes and official references. This is not a live availability check, eligibility assessment, or promise of funding."
      />

      <Notice tone="warn" title="Curated static directory · not live">
        Scheme details, application windows, funding, and eligibility can change. Verify every detail on the official source before acting; a listing does not mean you qualify or that the scheme is currently available.
      </Notice>

      <Section title="Find schemes">
        <form className="row" onSubmit={submitSearch}>
          <label className="field" htmlFor="scheme-search" style={{ flex: '1 1 16rem', margin: 0 }}>
            <span>Search this curated directory</span>
            <input
              id="scheme-search"
              className="input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value.slice(0, 300))}
              maxLength={300}
              autoComplete="off"
              placeholder="Try a sector, activity, or scheme name"
              disabled={!permitted || loading}
            />
          </label>
          <button className="button primary" type="submit" disabled={!permitted || loading}>
            {loading ? <span className="spinner" aria-hidden="true" /> : null}
            {loading ? 'Searching…' : 'Search'}
          </button>
          {submittedQuery !== null ? (
            <button className="button" type="button" disabled={loading} onClick={() => { setQuery(''); void load(); }}>
              Show all
            </button>
          ) : null}
        </form>
      </Section>

      {!permitted ? (
        <EmptyState title="Scheme access is not available">
          Your account needs the <code>knowledge:read</code> permission to view this curated directory.
        </EmptyState>
      ) : null}
      {permitted && loading ? <LoadingRow label="Loading curated scheme information…" /> : null}
      {forbidden ? (
        <EmptyState title="Permission denied">
          The backend denied access. Your account needs <code>knowledge:read</code> to view government schemes.
        </EmptyState>
      ) : null}
      {error ? (
        <div className="stack-sm">
          <InlineError message={error} />
          <div><button className="button" type="button" onClick={() => void load(submittedQuery)}>Retry</button></div>
        </div>
      ) : null}

      {results ? (
        <>
          <Section
            title={submittedQuery ? 'Search results' : 'Curated directory'}
            aside={<Badge tone="warn">Not live</Badge>}
          >
            <p className="fineprint" aria-live="polite">
              {results.schemes.length} {results.schemes.length === 1 ? 'entry' : 'entries'}
              {submittedQuery ? ` for “${submittedQuery}”` : ''}. Last reviewed {results.lastReviewed}.
            </p>
            {!results.schemes.length ? (
              <EmptyState title={submittedQuery ? 'No matching schemes found' : 'No schemes are listed'}>
                {submittedQuery ? 'Try different keywords. Search only checks this curated directory.' : 'There are currently no entries in this curated directory.'}
              </EmptyState>
            ) : (
              <div className="grid-2" style={{ marginTop: '1rem' }}>
                {results.schemes.map((scheme) => (
                  <article className="panel flat stack" key={scheme.id}>
                    <div className="row-between">
                      <Badge tone="accent">Curated · not live</Badge>
                      <span className="fineprint">{scheme.year}</span>
                    </div>
                    <div className="stack-sm">
                      <h3>{scheme.title}</h3>
                      {scheme.whatItIs ? <p className="soft">{scheme.whatItIs}</p> : null}
                    </div>
                    <p className="fineprint">Author / publisher: {scheme.author}</p>
                    <p className="fineprint">Source confidence: {scheme.confidence} (not an eligibility or availability score).</p>
                    <div>
                      <h4>Practical steps in the source</h4>
                      {scheme.practicalSteps.length ? (
                        <ul>{scheme.practicalSteps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}</ul>
                      ) : <p className="soft">No practical steps provided.</p>}
                    </div>
                    {scheme.avoid.length ? (
                      <div><h4>Points to avoid</h4><ul>{scheme.avoid.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
                    ) : null}
                    {scheme.limitations.length ? (
                      <div><h4>Limitations noted</h4><ul>{scheme.limitations.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div>
                    ) : null}
                    <div className="stack-sm">
                      <h4>Source</h4>
                      <p className="fineprint">{scheme.source}</p>
                      {scheme.officialUrl ? (
                        <p><a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer">Open official source (new tab)</a></p>
                      ) : <p className="fineprint">No separate official link is available for this entry; verify the source independently.</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Section>

          <Section title="Verification and limitations">
            <Notice tone="warn" title="Verification required">
              {results.verifyNote}
            </Notice>
            <p className="soft" style={{ marginTop: '0.75rem' }}>{results.disclaimer}</p>
            {results.limitations.length ? (
              <ul>{results.limitations.map((limitation, index) => <li key={`${index}-${limitation}`}>{limitation}</li>)}</ul>
            ) : null}
          </Section>
        </>
      ) : null}
    </div>
  );
}
