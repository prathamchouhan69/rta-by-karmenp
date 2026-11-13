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

interface Task {
  id: string;
  title?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
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
  { href: '/wealth', label: 'Wealth snapshot', note: 'Scenarios from your own numbers.', icon: 'wealth' },
  { href: '/startup', label: 'Startup runway', note: 'Runway and unit-economics tools.', icon: 'startup' },
  { href: '/economy', label: 'Economy brief', note: 'Assess caller-supplied events.', icon: 'economy' },
  { href: '/radar', label: 'Opportunity radar', note: 'Review sourced opportunities.', icon: 'radar' },
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
  const [proposalsState, setProposalsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [proposalsError, setProposalsError] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksState, setTasksState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [tasksError, setTasksError] = useState('');
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [liveState, setLiveState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [liveError, setLiveError] = useState('');
  const [dateLine, setDateLine] = useState('');

  const loadBriefing = useCallback(async () => {
    setBriefingError('');
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
        .then((data) => {
          setProposals(data.proposals);
          setProposalsState('ready');
        })
        .catch((error) => {
          setProposalsError(errorMessage(error));
          setProposalsState('error');
        });
      api<{ tasks: Task[] }>('v1/tasks')
        .then((data) => {
          setTasks(Array.isArray(data.tasks) ? data.tasks : []);
          setTasksState('ready');
        })
        .catch((error) => {
          setTasksError(errorMessage(error));
          setTasksState('error');
        });
    } else {
      setTasksState('ready');
    }
    if (can(user, 'live:read')) {
      api<LiveStatus>('v1/live/status')
        .then((data) => {
          setLive(data);
          setLiveState('ready');
        })
        .catch((error) => {
          setLiveError(errorMessage(error));
          setLiveState('error');
        });
    } else {
      setLiveState('ready');
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
  const taskStatusCounts = tasks.reduce<Record<string, number>>((counts, task) => {
    const status = task.status?.trim() || 'Unspecified';
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const taskStatuses = Object.entries(taskStatusCounts).sort((a, b) => b[1] - a[1]);
  const openTasks = taskStatusCounts.open || 0;

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
        <Section title="Work in progress">
          {tasksState === 'loading' ? <LoadingRow label="Loading saved tasks…" /> : null}
          {tasksState === 'error' ? (
            <InlineError message={tasksError || 'Saved tasks could not be loaded.'} />
          ) : null}
          {tasksState === 'ready' && tasks.length === 0 ? (
            <EmptyState title="No saved tasks yet">
              Tasks appear here after an approved task proposal is executed. This view does not include draft proposals.
            </EmptyState>
          ) : null}
          {tasksState === 'ready' && tasks.length > 0 ? (
            <div className="panel flat task-snapshot">
              <div className="row-between">
                <div>
                  <p className="eyebrow">Saved task records</p>
                  <h3>{tasks.length} task{tasks.length === 1 ? '' : 's'}</h3>
                </div>
                <Badge tone={openTasks ? 'warn' : 'ok'}>{openTasks} open</Badge>
              </div>
              <p className="fineprint">Current status distribution from Flux task records · not a time series.</p>
              <ul className="task-status-chart" aria-label="Task count by current status">
                {taskStatuses.map(([status, count]) => (
                  <li key={status}>
                    <div className="row-between">
                      <span>{status}</span>
                      <strong>{count}</strong>
                    </div>
                    <span className="task-status-track" aria-hidden="true">
                      <span style={{ width: `${Math.max(4, (count / tasks.length) * 100)}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>
      ) : null}

      {can(user, 'proposals:read') ? (
        <Section title={t('shell.pendingApprovals')} aside={<Link className="button ghost small" href="/approvals">View all</Link>}>
          {proposalsState === 'loading' ? <LoadingRow label="Loading pending proposals…" /> : null}
          {proposalsState === 'error' ? <InlineError message={proposalsError || 'Pending proposals could not be loaded.'} /> : null}
          {proposalsState === 'ready' && proposals.length ? (
            <div className="grid-2">
              {proposals.slice(0, 4).map((proposal) => (
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
          ) : null}
          {proposalsState === 'ready' && proposals.length === 0 ? (
            <EmptyState title="Nothing waiting for approval">
              Flux cannot write anything without a human approval. New proposals will appear here.
            </EmptyState>
          ) : null}
        </Section>
      ) : null}

      <Section title={t('dashboard.dataHonesty')} aside={<Link className="button ghost small" href="/settings#live">{t('shell.viewStatus')}</Link>}>
        <div className="panel warning">
          <div className="row-between">
            <div>
              <h3>
                {!can(user, 'live:read') ? 'Live-source status is not available for this role' : null}
                {can(user, 'live:read') && liveState === 'loading' ? 'Checking live-source status…' : null}
                {can(user, 'live:read') && liveState === 'error' ? 'Live-source status could not be checked' : null}
                {can(user, 'live:read') && liveState === 'ready' ? (live?.liveDataAvailable ? 'A live source is configured' : t('shell.liveOffline')) : null}
              </h3>
              <p className="muted" style={{ fontSize: '0.88rem', marginTop: '0.3rem' }}>{t('dashboard.liveFeedNote')}</p>
            </div>
            <Badge tone={liveState === 'ready' && live?.liveDataAvailable ? 'ok' : 'warn'}>
              {!can(user, 'live:read') ? 'RESTRICTED' : live?.code || (liveState === 'error' ? 'STATUS_UNAVAILABLE' : liveState === 'loading' ? 'CHECKING' : 'NOT_CHECKED')}
            </Badge>
          </div>
          {can(user, 'live:read') && liveState === 'error' ? <p className="fineprint" style={{ marginTop: '0.55rem' }}>{liveError}</p> : null}
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
