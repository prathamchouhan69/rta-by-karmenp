'use client';

import { useCallback, useState } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, Section } from '@/components/ui';
import { ResultHeaderNote } from '@/components/result-view';
import { Icon } from '@/components/icons';
import { useSession, useUi } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface EconomyEvent {
  event: string;
  date: string | null;
  source: string;
  sourceUrl: string | null;
  whatHappened: string;
  whyItMatters: string;
  impactOnRTA: string;
  impactOnMyMoney: string;
  opportunity: string;
  risk: string;
  recommendedAction: string;
  jugaadAction: string;
  confidence: string;
}

interface Brief {
  ok: boolean;
  disclaimer: string;
  generatedAt: string;
  events: EconomyEvent[];
  limitations: string[];
  confidence: string;
}

const TONE: Record<string, 'ok' | 'warn' | 'danger' | undefined> = {
  high: 'ok', medium: 'ok', low: 'warn', uncertain: 'warn',
};

export default function EconomyPage() {
  const user = useSession();
  const { t } = useUi();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [raw, setRaw] = useState('{\n  "events": [\n    {\n      "event": "Steel price",\n      "whatHappened": "TMT rose 4% in Bhopal",\n      "source": "supplier rate card",\n      "confidence": "medium"\n    }\n  ]\n}');

  const run = useCallback(async () => {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { setError('Enter valid JSON.'); return; }
    setBusy(true); setError('');
    try {
      const data = await api<Brief>('v1/economy/brief', { method: 'POST', body: parsed });
      setBrief(data); setState(data.events.length ? 'idle' : 'empty');
    } catch (e) { setError(errorMessage(e)); setState('error'); } finally { setBusy(false); }
  }, [raw]);

  return (
    <div className="stack">
      <div className="section-head">
        <h2>{t('economy.title')}</h2>
      </div>
      <p className="lede">{t('economy.subtitle')}</p>

      <Section title="Input">
        <Notice tone="info" title="Every entry is caller-supplied.">
          Flux will downgrade an entry to "uncertain" when no source is named, and will never invent a market figure.
        </Notice>
        <label className="field">
          <span>Economy events (JSON)</span>
          <textarea className="textarea" value={raw} onChange={(e) => setRaw(e.target.value)} rows={10} style={{ fontFamily: 'monospace' }} />
        </label>
        <div className="row" style={{ marginTop: '0.8rem' }}>
          <button className="button primary" type="button" onClick={run} disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={15} />}
            {busy ? 'Building…' : t('economy.build')}
          </button>
        </div>
      </Section>

      {state === 'loading' ? <LoadingRow label={t('common.loadingData')} /> : null}
      {error ? <InlineError message={error} /> : null}
      {state === 'empty' ? <EmptyState title={t('economy.noEvents')} /> : null}
      {brief ? (
        <div className="stack">
          <ResultHeaderNote>
            {brief.events.length} event(s) · overall confidence: <strong>{brief.confidence}</strong>
          </ResultHeaderNote>
          {brief.events.map((e, i) => (
            <article key={i} className="panel flat">
              <div className="row-between">
                <h3 style={{ fontSize: '1rem' }}>{e.event || 'Untitled'}</h3>
                <Badge tone={TONE[e.confidence]}>{e.confidence}</Badge>
              </div>
              <p className="fineprint">{e.date || 'No date'} · source: {e.source || 'not named'}</p>
              {e.whatHappened ? <p className="soft" style={{ marginTop: '0.4rem' }}>{e.whatHappened}</p> : null}
              {e.whyItMatters ? <p className="soft" style={{ marginTop: '0.2rem' }}><strong>Why it matters:</strong> {e.whyItMatters}</p> : null}
              <div className="grid-2" style={{ marginTop: '0.5rem' }}>
                {e.impactOnRTA ? <p className="soft"><strong>Impact on RTA:</strong> {e.impactOnRTA}</p> : null}
                {e.impactOnMyMoney ? <p className="soft"><strong>Impact on your money:</strong> {e.impactOnMyMoney}</p> : null}
                {e.opportunity ? <p className="soft"><strong>Opportunity:</strong> {e.opportunity}</p> : null}
                {e.risk ? <p className="soft"><strong>Risk:</strong> {e.risk}</p> : null}
              </div>
              {e.recommendedAction ? <p className="soft" style={{ marginTop: '0.4rem' }}><strong>Recommended:</strong> {e.recommendedAction}</p> : null}
              {e.jugaadAction ? <p className="soft" style={{ marginTop: '0.2rem' }}><strong>Jugaad:</strong> {e.jugaadAction}</p> : null}
              {e.sourceUrl ? <p className="fineprint"><a href={e.sourceUrl} target="_blank" rel="noopener noreferrer">Source</a></p> : null}
            </article>
          ))}
          <Notice tone="warn" title={brief.disclaimer}>
            {brief.limitations.slice(0, 2).join(' ')}
          </Notice>
        </div>
      ) : null}
    </div>
  );
}