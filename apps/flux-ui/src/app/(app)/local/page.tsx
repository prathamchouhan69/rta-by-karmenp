'use client';

import { useState } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, Section } from '@/components/ui';
import { Icon } from '@/components/icons';
import { useUi } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface Item {
  area: string;
  whatHappened: string;
  whyItMatters?: string;
  opportunity?: string;
  whoToContact?: string;
  howToEarn?: string;
  jugaadApproach?: string;
  risk?: string;
  source?: string;
  sourceUrl?: string | null;
  verifiedAt?: string | null;
  confidence: string;
}

interface Local {
  ok: boolean;
  disclaimer: string;
  generatedAt: string;
  insights: Item[];
  limitations: string[];
}

const TONE: Record<string, 'ok' | 'warn' | 'danger' | undefined> = {
  high: 'ok', medium: 'ok', low: 'warn', uncertain: 'warn',
};

export default function LocalPage() {
  const { t } = useUi();
  const [raw, setRaw] = useState('{\n  "insights": [\n    {\n      "area": "Mandideep",\n      "whatHappened": "A new factory is being set up near the industrial area",\n      "source": "site visit",\n      "confidence": "medium"\n    }\n  ]\n}');
  const [local, setLocal] = useState<Local | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { setError('Enter valid JSON.'); return; }
    setBusy(true); setError('');
    try {
      const data = await api<Local>('v1/local/insights', { method: 'POST', body: parsed });
      setLocal(data); setState(data.insights.length ? 'idle' : 'empty');
    } catch (e) { setError(errorMessage(e)); setState('error'); } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h2>{t('local.title')}</h2>
      </div>
      <p className="lede">{t('local.subtitle')}</p>

      <Section title={t('local.insights')}>
        <Notice tone="info" title="Caller-supplied only.">
          Verify tenders, prices and government notifications on the official source before acting on them.
        </Notice>
        <label className="field">
          <span>Local insights (JSON)</span>
          <textarea className="textarea" value={raw} onChange={(e) => setRaw(e.target.value)} rows={10} style={{ fontFamily: 'monospace' }} />
        </label>
        <div className="row" style={{ marginTop: '0.8rem' }}>
          <button className="button primary" type="button" onClick={run} disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={15} />}
            {busy ? 'Building…' : t('local.build')}
          </button>
        </div>
      </Section>

      {state === 'loading' ? <LoadingRow label={t('common.loadingData')} /> : null}
      {error ? <InlineError message={error} /> : null}
      {state === 'empty' ? <EmptyState title={t('local.noItems')} /> : null}
      {local ? (
        <div className="stack">
          {local.insights.map((a, i) => (
            <article key={i} className="panel flat">
              <div className="row-between">
                <h3 style={{ fontSize: '1rem' }}>{a.whatHappened || 'Untitled'}</h3>
                <Badge tone={TONE[a.confidence]}>{a.confidence}</Badge>
              </div>
              <p className="fineprint">{a.area} · source: {a.source || 'not named'}{a.verifiedAt ? ` · verified ${a.verifiedAt}` : ''}</p>
              {a.whyItMatters ? <p className="soft" style={{ marginTop: '0.4rem' }}><strong>Why it matters:</strong> {a.whyItMatters}</p> : null}
              {a.opportunity ? <p className="soft"><strong>Opportunity:</strong> {a.opportunity}</p> : null}
              {a.whoToContact ? <p className="soft"><strong>Who to contact:</strong> {a.whoToContact}</p> : null}
              {a.howToEarn ? <p className="soft"><strong>How to earn:</strong> {a.howToEarn}</p> : null}
              {a.jugaadApproach ? <p className="soft"><strong>Jugaad:</strong> {a.jugaadApproach}</p> : null}
              {a.risk ? <p className="soft"><strong>Risk:</strong> {a.risk}</p> : null}
              {a.sourceUrl ? <p className="fineprint"><a href={a.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a></p> : null}
            </article>
          ))}
          <Notice tone="warn" title={local.disclaimer}>{local.limitations.slice(0, 2).join(' ')}</Notice>
        </div>
      ) : null}
    </div>
  );
}