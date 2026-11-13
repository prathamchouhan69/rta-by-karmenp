'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, PageHeader, Section } from '@/components/ui';
import { useSession, can } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface LiveDomain {
  domain: string;
  label: string;
  status: string;
  alternative: string;
  officialSources: Array<{ name: string; url: string | null }>;
}

interface LiveStatus {
  liveDataAvailable: boolean;
  code: string;
  message: string;
  domains: LiveDomain[];
}

export default function SettingsPage() {
  const user = useSession();
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const permitted = can(user, 'live:read');

  const load = useCallback(async () => {
    if (!permitted) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setStatus(await api<LiveStatus>('v1/live/status'));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [permitted]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="System status"
        title="Data sources"
        description="Source availability reported by the Flux backend. A configured source is not proof that every individual record is current or verified."
      />
      <Section title="Live data">
        {!permitted ? <EmptyState title="Live status access is not available">Your role does not have permission to read source status.</EmptyState> : null}
        {permitted && loading ? <LoadingRow label="Checking source status…" /> : null}
        {error ? <InlineError message={error} /> : null}
        {status ? (
          <div className="stack">
            <Notice tone={status.liveDataAvailable ? 'ok' : 'warn'} title={status.message}>
              Backend status: <strong>{status.code}</strong>. Use the source and record timestamps when deciding whether information is current.
            </Notice>
            {status.domains.length ? (
              <div className="grid-2">
                {status.domains.map((domain) => (
                  <article className="panel flat" key={domain.domain}>
                    <div className="row-between">
                      <h3>{domain.label}</h3>
                      <Badge tone={domain.status === 'live' ? 'ok' : 'warn'}>{domain.status}</Badge>
                    </div>
                    <p className="soft" style={{ marginTop: '0.4rem' }}>{domain.alternative}</p>
                    {domain.officialSources.map((source) => (
                      <p className="fineprint" key={source.name}>
                        {source.url ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a> : source.name}
                      </p>
                    ))}
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Section>
    </div>
  );
}
