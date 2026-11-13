'use client';

import { useState } from 'react';
import { Badge, Disclaimer, EmptyState, InlineError, LoadingRow, Notice, Section, Tabs } from '@/components/ui';
import { ResultHeaderNote } from '@/components/result-view';
import { Icon } from '@/components/icons';
import { useSession, useUi } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface Proposal {
  kind: string;
  title: string;
  summary: string;
  priority: string;
  confidence: string;
  gate: string;
}

interface Reminder {
  kind: string;
  title: string;
  summary: string;
  priority: string;
  gate: string;
}

interface Auto {
  ok: boolean;
  proposals: Proposal[];
  generatedAt: string;
  limitations: string[];
}

interface HealthAuto {
  ok: boolean;
  reminders: Reminder[];
  disclaimer: string;
  limitations: string[];
}

const TONE: Record<string, 'ok' | 'warn' | 'danger' | undefined> = {
  critical: 'danger', high: 'warn', medium: 'ok', low: 'ok',
};

export default function AutomationsPage() {
  const user = useSession();
  const { t } = useUi();
  const [tab, setTab] = useState<'business' | 'health'>('business');
  const [raw, setRaw] = useState('{\n  "invoices": [\n    { "id": "INV-1", "number": "INV-100", "customerName": "Sharma", "dueDate": "2026-10-01", "balance": "50000" }\n  ],\n  "projects": [\n    { "id": "P-1", "name": "Shed A", "marginPercent": 6 }\n  ],\n  "materialPrices": [\n    { "material": "Steel", "location": "Bhopal", "unit": "MT", "currentPrice": 62000, "priceChangePercent": 12, "confidence": "medium" }\n  ],\n  "marginThreshold": 10,\n  "priceRiseThreshold": 5\n}');
  const [auto, setAuto] = useState<Auto | null>(null);
  const [healthAuto, setHealthAuto] = useState<HealthAuto | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { setError('Enter valid JSON.'); return; }
    setBusy(true); setError('');
    try {
      if (tab === 'business') {
        const data = await api<Auto>('v1/automations/business', { method: 'POST', body: parsed });
        setAuto(data); setState(data.proposals.length ? 'idle' : 'empty');
      } else {
        const data = await api<HealthAuto>('v1/automations/health', { method: 'POST', body: parsed });
        setHealthAuto(data); setState(data.reminders.length ? 'idle' : 'empty');
      }
    } catch (e) { setError(errorMessage(e)); setState('error'); } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h2>{t('automation.title')}</h2>
      </div>
      <p className="lede">{t('automation.subtitle')}</p>

      <Tabs
        tabs={[
          { id: 'business', label: t('automation.business') },
          { id: 'health', label: t('automation.health') },
        ]}
        active={tab}
        onChange={(id) => { setTab(id as 'business' | 'health'); setAuto(null); setHealthAuto(null); }}
      />

      <Section title={tab === 'business' ? t('automation.business') : t('automation.health')}>
        <Notice tone="info" title="Drafts only.">
          Every rule below prepares a draft, alert or reminder. Nothing is sent, created or executed without an explicit approval.
        </Notice>
        <label className="field">
          <span>{tab === 'business' ? 'Business data (JSON)' : 'Health data (JSON)'}</span>
          <textarea className="textarea" value={raw} onChange={(e) => setRaw(e.target.value)} rows={14} style={{ fontFamily: 'monospace' }} />
        </label>
        <div className="row" style={{ marginTop: '0.8rem' }}>
          <button className="button primary" type="button" onClick={run} disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={15} />}
            {busy ? 'Evaluating…' : t('automation.run')}
          </button>
        </div>
      </Section>

      {state === 'loading' ? <LoadingRow label={t('common.loadingData')} /> : null}
      {error ? <InlineError message={error} /> : null}
      {state === 'empty' ? <EmptyState title="No rules fired.">Provide overdue invoices, thin-margin projects, rising material prices, or a health profile with vitals.</EmptyState> : null}

      {tab === 'business' && auto ? (
        <div className="stack">
          <ResultHeaderNote>{auto.proposals.length} {t('automation.proposals')}</ResultHeaderNote>
          {auto.proposals.map((p, i) => (
            <article key={i} className="panel flat">
              <div className="row-between">
                <Badge tone="accent">{p.kind}</Badge>
                <Badge tone={TONE[p.priority]}>{p.priority}</Badge>
              </div>
              <h3 style={{ marginTop: '0.4rem', fontSize: '1rem' }}>{p.title}</h3>
              <p className="soft" style={{ marginTop: '0.3rem' }}>{p.summary}</p>
              <p className="fineprint">gate: {p.gate} · confidence: {p.confidence}</p>
            </article>
          ))}
          <Disclaimer>{auto.limitations[0] || 'Proposals are drafts. They create nothing and send nothing until an owner approves each one.'}</Disclaimer>
        </div>
      ) : null}

      {tab === 'health' && healthAuto ? (
        <div className="stack">
          <ResultHeaderNote>{healthAuto.reminders.length} {t('automation.reminders')}</ResultHeaderNote>
          {healthAuto.reminders.map((r, i) => (
            <article key={i} className="panel flat">
              <div className="row-between">
                <Badge tone="accent">{r.kind}</Badge>
                <Badge tone={TONE[r.priority]}>{r.priority}</Badge>
              </div>
              <h3 style={{ marginTop: '0.4rem', fontSize: '1rem' }}>{r.title}</h3>
              <p className="soft" style={{ marginTop: '0.3rem' }}>{r.summary}</p>
              <p className="fineprint">gate: {r.gate}</p>
            </article>
          ))}
          <Notice tone="warn" title={healthAuto.disclaimer}>{healthAuto.limitations[0]}</Notice>
        </div>
      ) : null}
    </div>
  );
}