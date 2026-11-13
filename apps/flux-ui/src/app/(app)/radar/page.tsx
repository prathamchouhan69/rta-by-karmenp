'use client';

import { useState } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, Section } from '@/components/ui';
import { Icon } from '@/components/icons';
import { useUi } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface Item {
  id?: string;
  whatHappened: string;
  whyItMatters?: string;
  moneyOpportunity?: string;
  deadline?: string | null;
  firstAction?: string;
  jugaadAction?: string;
  risk?: string;
  source?: string;
  sourceUrl?: string | null;
  confidence: string;
}

interface Radar {
  ok: boolean;
  disclaimer: string;
  generatedAt: string;
  alerts: Item[];
  limitations: string[];
}

const TONE: Record<string, 'ok' | 'warn' | 'danger' | undefined> = {
  high: 'ok', medium: 'ok', low: 'warn', uncertain: 'warn',
};

export default function RadarPage() {
  const { t } = useUi();
  const [raw, setRaw] = useState('{\n  "alerts": [\n    {\n      "whatHappened": "New tender for a warehouse in Mandideep",\n      "source": "tender portal",\n      "confidence": "medium"\n    }\n  ]\n}');
  const [radar, setRadar] = useState<Radar | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { setError('Enter valid JSON.'); return; }
    setBusy(true); setError('');
    try {
      const data = await api<Radar>('v1/radar/opportunities', { method: 'POST', body: parsed });
      setRadar(data); setState(data.alerts.length ? 'idle' : 'empty');
    } catch (e) { setError(errorMessage(e)); setState('error'); } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h2>{t('radar.title')}</h2>
      </div>
      <p className="lede">{t('radar.subtitle')}</p>

      <Section title={t('radar.opportunities')}>
        <Notice tone="info" title="Caller-supplied only.">
          An alert without a named source is downgraded to "uncertain". Flux never invents a tender, scheme or price.
        </Notice>
        <label className="field">
          <span>Opportunity alerts (JSON)</span>
          <textarea className="textarea" value={raw} onChange={(e) => setRaw(e.target.value)} rows={10} style={{ fontFamily: 'monospace' }} />
        </label>
        <div className="row" style={{ marginTop: '0.8rem' }}>
          <button className="button primary" type="button" onClick={run} disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={15} />}
            {busy ? 'Building…' : t('radar.build')}
          </button>
        </div>
      </Section>

      {state === 'loading' ? <LoadingRow label={t('common.loadingData')} /> : null}
      {error ? <InlineError message={error} /> : null}
      {state === 'empty' ? <EmptyState title={t('radar.noItems')} /> : null}
      {radar ? (
        <div className="stack">
          {radar.alerts.map((a, i) => (
            <article key={i} className="panel flat">
              <div className="row-between">
                <h3 style={{ fontSize: '1rem' }}>{a.whatHappened || 'Untitled'}</h3>
                <Badge tone={TONE[a.confidence]}>{a.confidence}</Badge>
              </div>
              <p className="fineprint">source: {a.source || 'not named'}{a.deadline ? ` · deadline: ${a.deadline}` : ''}</p>
              {a.whyItMatters ? <p className="soft" style={{ marginTop: '0.4rem' }}><strong>Why it matters:</strong> {a.whyItMatters}</p> : null}
              {a.moneyOpportunity ? <p className="soft"><strong>Money opportunity:</strong> {a.moneyOpportunity}</p> : null}
              {a.firstAction ? <p className="soft"><strong>First action:</strong> {a.firstAction}</p> : null}
              {a.jugaadAction ? <p className="soft"><strong>Jugaad:</strong> {a.jugaadAction}</p> : null}
              {a.risk ? <p className="soft"><strong>Risk:</strong> {a.risk}</p> : null}
              {a.sourceUrl ? <p className="fineprint"><a href={a.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a></p> : null}
            </article>
          ))}
          <Notice tone="warn" title={radar.disclaimer}>{radar.limitations.slice(0, 2).join(' ')}</Notice>
        </div>
      ) : null}
    </div>
  );
}