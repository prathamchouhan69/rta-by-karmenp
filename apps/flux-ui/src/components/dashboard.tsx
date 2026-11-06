'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, Section } from './ui';
import { ResultHeaderNote } from './result-view';
import { Icon, type IconName } from './icons';
import { useSession, useUi, can } from './providers';
import { api, errorMessage } from '@/lib/api';

interface BriefingItem {
  text: string;
  evidence?: string;
  daysOverdue?: number;
}

interface BriefingSection {
  id: string;
  title: string;
  status: string;
  items: BriefingItem[];
  reason?: string;
}

interface Briefing {
  date: string;
  generatedAt: string;
  headline: string;
  sections: BriefingSection[];
  unverified: string[];
}

interface Proposal {
  id: string;
  kind: string;
  gate: string;
  summary: string;
  createdAt: string;
}

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

const QUICK_ACTIONS: Array<{ href: string; label: string; note: string; icon: IconName }> = [
  { href: '/chat', label: 'Ask Flux', note: 'Evidence, uncertainty and a next step.', icon: 'chat' },
  { href: '/money', label: 'Money plan', note: 'Budget, goals, EMI and cash flow.', icon: 'money' },
  { href: '/construction', label: 'Site desk', note: 'Estimates, quantities and prices.', icon: 'construction' },
  { href: '/health', label: 'Health check', note: 'General guidance, never a diagnosis.', icon: 'health' },
  { href: '/knowledge', label: 'Knowledge', note: 'Principles with cited sources.', icon: 'knowledge' },
  { href: '/jugaad', label: 'Jugaad', note: 'Proper, fast and lawful frugal options.', icon: 'jugaad' },
];

function statusTone(status: string): 'ok' | 'warn' | 'danger' | undefined {
  if (status === 'Verified') return 'ok';
  if (status === 'Partial' || status === 'Uncertain') return 'warn';
  if (status === 'Could not verify') return 'danger';
  return undefined;
}

function BriefingSectionCard({ section }: { section: BriefingSection }) {
  return (
    <article className="panel flat">
      <div className="row-between" style={{ marginBottom: '0.45rem' }}>
        <h3 style={{ fontSize: '1rem' }}>{section.title}</h3>
        <Badge tone={statusTone(section.status)}>{section.status}</Badge>
      </div>
      {section.items.length ? (
        <ul className="bullets">
          {section.items.map((item, index) => (
            <li key={index}>
              {item.text}
              {item.evidence ? <span className="fineprint"> · evidence: {item.evidence}</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted" style={{ fontSize: '0.85rem' }}>
          {section.reason || 'No verified item for this section.'}
        </p>
      )}
      {section.items.length && section.reason ? <p className="fineprint">{section.reason}</p> : null}
    </article>
  );
}

export function Dashboard() {
  const user = useSession();
  const { t, lang } = useUi();
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingState, setBriefingState] = useState<'idle' | 'loading' | 'empty' | 'error'>('loading');
  const [briefingError, setBriefingError] = useState('');
  const [building, setBuilding] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [dateLine, setDateLine] = useState('');

  const loadBriefing = useCallback(async () => {
    setBriefingState('loading');
    try {
      const data = await api<Briefing>('v1/briefing/today');
      setBriefing(data);
      setBriefingState('idle');
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status === 404) {
        setBriefing(null);
        setBriefingState('empty');
      } else {
        setBriefingError(errorMessage(error));
        setBriefingState('error');
      }
    }
  }, []);

  useEffect(() => {
    setDateLine(new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date()));
  }, [lang]);

  useEffect(() => {
    if (can(user, 'briefing:read')) void loadBriefing();
    else setBriefingState('empty');
  }, [user, loadBriefing]);

  useEffect(() => {
    if (can(user, 'proposals:read')) {
      api<{ proposals: Proposal[] }>('v1/proposals?status=pending')
        .then((data) => setProposals(data.proposals.slice(0, 4)))
        .catch(() => setProposals([]));
    }
    if (can(user, 'live:read')) {
      api<LiveStatus>('v1/live/status').then(setLive).catch(() => setLive(null));
    }
  }, [user]);

  async function buildBriefing() {
    if (building) return;
    setBuilding(true);
    setBriefingError('');
    try {
      await api('v1/briefing/run', { method: 'POST', body: {} });
      await loadBriefing();
      window.dispatchEvent(new Event('flux:refresh'));
    } catch (error) {
      setBriefingError(errorMessage(error));
    } finally {
      setBuilding(false);
    }
  }

  const canBuild = can(user, 'read:zoho');

  return (
    <div className="stack-lg">
      <section className="hero">
        <p className="eyebrow">{t('dashboard.today')} · {dateLine || '—'}</p>
        <h1>{t('dashboard.greeting')}, {user.name || user.id}.</h1>
        <p className="lede">{t('dashboard.subtitle')}</p>
        <div className="row" style={{ marginTop: '1.1rem' }}>
          <Link className="button primary" href="/chat">
            <Icon name="chat" size={17} />
            {t('nav.chat')}
          </Link>
          <Link className="button" href="/approvals">
            <Icon name="approvals" size={17} />
            {t('approvals.pending')}{proposals.length ? ` · ${proposals.length}` : ''}
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="quick-actions">
        <div className="section-head">
          <h2 id="quick-actions">{t('dashboard.quickActions')}</h2>
        </div>
        <div className="tile-grid">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className="tile">
              <span className="tile-icon"><Icon name={action.icon} size={19} /></span>
              <strong>{action.label}</strong>
              <span>{action.note}</span>
            </Link>
          ))}
        </div>
      </section>

      <Section
        title={t('dashboard.today')}
        aside={canBuild ? (
          <button className="button small" type="button" onClick={buildBriefing} disabled={building}>
            {building ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={15} />}
            {building ? 'Building…' : t('dashboard.buildBriefing')}
          </button>
        ) : undefined}
      >
        {briefingError ? <InlineError message={briefingError} /> : null}
        {briefingState === 'loading' ? <LoadingRow label={t('common.loadingData')} /> : null}
        {briefingState === 'empty' ? (
          <EmptyState title={t('dashboard.noBriefing')}>
            {canBuild
              ? 'Build it from Zoho Books and the configured research sources. Sections with no source stay marked “could not verify”.'
              : 'Your role can read a briefing but cannot build one. Ask an owner or accountant to build it.'}
          </EmptyState>
        ) : null}
        {briefingState === 'error' ? (
          <EmptyState title={t('common.error')}>
            <button className="button small" type="button" onClick={() => void loadBriefing()}>{t('common.retry')}</button>
          </EmptyState>
        ) : null}
        {briefing ? (
          <div className="stack">
            <div className="panel">
              <div className="row-between">
                <div>
                  <p className="eyebrow">{briefing.date}</p>
                  <h3 style={{ marginTop: '0.25rem' }}>{briefing.headline}</h3>
                </div>
                <Badge tone="accent">{briefing.sections.filter((section) => section.status === 'Verified').length} verified</Badge>
              </div>
              <p className="fineprint" style={{ marginTop: '0.5rem' }}>
                Generated {briefing.generatedAt}. Unverified: {briefing.unverified.length ? briefing.unverified.join(', ') : 'none'}.
              </p>
            </div>
            <div className="grid-2">
              {briefing.sections.map((section) => <BriefingSectionCard key={section.id} section={section} />)}
            </div>
          </div>
        ) : null}
      </Section>

      {can(user, 'proposals:read') ? (
        <Section title={t('shell.pendingApprovals')} aside={<Link className="button ghost small" href="/approvals">View all</Link>}>
          {proposals.length ? (
            <div className="grid-2">
              {proposals.map((proposal) => (
                <article key={proposal.id} className="panel flat">
                  <div className="row-between">
                    <Badge tone="accent">{proposal.gate}</Badge>
                    <span className="fineprint">{proposal.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  <p className="soft" style={{ marginTop: '0.45rem', fontSize: '0.9rem' }}>{proposal.summary || proposal.kind}</p>
                  <p className="fineprint mono">{proposal.id}</p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing waiting for approval">
              Flux cannot write anything without a human approval. New proposals will appear here.
            </EmptyState>
          )}
        </Section>
      ) : null}

      <Section title={t('dashboard.dataHonesty')} aside={<Link className="button ghost small" href="/settings#live">{t('shell.viewStatus')}</Link>}>
        <div className="panel warning">
          <div className="row-between">
            <div>
              <h3>{live?.liveDataAvailable ? 'A live source is configured' : t('shell.liveOffline')}</h3>
              <p className="muted" style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>{t('dashboard.liveFeedNote')}</p>
            </div>
            <Badge tone={live?.liveDataAvailable ? 'ok' : 'warn'}>{live?.code || 'LIVE_DATA_NOT_CONFIGURED'}</Badge>
          </div>
          {live ? (
            <div className="chip-row" style={{ marginTop: '0.85rem' }}>
              {live.domains.map((domain) => (
                <span key={domain.domain} className="chip" title={domain.alternative}>{domain.label}</span>
              ))}
            </div>
          ) : null}
        </div>
        <Notice tone="info" title="What Flux will do instead:">
          use caller-supplied rates, dated material-price observations, curated knowledge with sources, and an explicit “uncertain” when a number or headline cannot be verified.
        </Notice>
        <ResultHeaderNote>
          Role: <strong>{user.role}</strong>. Permissions are enforced on the server for every request, not only in this interface.
        </ResultHeaderNote>
      </Section>
    </div>
  );
}
