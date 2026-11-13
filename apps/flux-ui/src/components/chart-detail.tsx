'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, api, errorMessage } from '@/lib/api';
import { charts } from '@/lib/library-inventory';
import { countAgingBuckets, type AgingEvidence } from '@/lib/receivables-aging';
import { can, useSession } from '@/components/providers';
import { EmptyState, InlineError, LoadingRow, Notice, PageHeader, Section } from '@/components/ui';

type TaskRecord = Record<string, unknown>;
type TaskChartState = 'loading' | 'ready' | 'error' | 'denied';
type AgingChartState = 'loading' | 'ready' | 'empty' | 'no-briefing' | 'error' | 'denied';

function isRecord(value: unknown): value is TaskRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function taskStatus(value: TaskRecord) {
  const status = value.status;
  return typeof status === 'string' && status.trim() ? status.trim() : 'Unspecified';
}

function overdueItems(value: unknown): AgingEvidence[] {
  if (!isRecord(value) || !Array.isArray(value.sections)) throw new Error('The briefing response was invalid.');
  const section = value.sections.find((item) => isRecord(item) && item.id === 'overdue');
  if (!isRecord(section) || !Array.isArray(section.items)) throw new Error('The briefing overdue section was invalid.');
  const sectionVerified = section.status === 'Verified' || section.status === 'Partial';
  return section.items.filter(isRecord).flatMap((item) => {
    if (typeof item.text !== 'string' || !item.text.trim()) return [];
    return [{
      text: item.text,
      ...(sectionVerified && typeof item.daysOverdue === 'number' ? { daysOverdue: item.daysOverdue } : {}),
    }];
  });
}

export function ChartDetail({ id }: { id: string }) {
  const user = useSession();
  const chart = charts.find((item) => item.id === id);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [state, setState] = useState<TaskChartState>('loading');
  const [error, setError] = useState('');
  const [agingItems, setAgingItems] = useState<AgingEvidence[]>([]);
  const [agingState, setAgingState] = useState<AgingChartState>(() =>
    can(user, 'briefing:read') ? 'loading' : 'denied',
  );
  const [agingError, setAgingError] = useState('');
  const isTaskStatus = chart?.name === 'Task Status Chart';
  const isReceivablesAging = chart?.name === 'Accounts-Receivable Aging Chart';
  const canReadBriefing = can(user, 'briefing:read');

  const loadTasks = useCallback(async () => {
    setState('loading');
    setError('');
    try {
      const data = await api<unknown>('v1/tasks');
      if (!isRecord(data) || !Array.isArray(data.tasks)) throw new Error('The task response was invalid.');
      setTasks(data.tasks.filter(isRecord));
      setState('ready');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) setState('denied');
      else {
        setError(errorMessage(cause));
        setState('error');
      }
    }
  }, []);

  const loadAging = useCallback(async () => {
    if (!canReadBriefing) {
      setAgingItems([]);
      setAgingState('denied');
      return;
    }
    setAgingItems([]);
    setAgingState('loading');
    setAgingError('');
    try {
      const data = await api<unknown>('v1/briefing/today');
      const items = overdueItems(data);
      setAgingItems(items);
      setAgingState(items.some((item) => Number.isInteger(item.daysOverdue) && (item.daysOverdue ?? -1) >= 0) ? 'ready' : 'empty');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) setAgingState('denied');
      else if (cause instanceof ApiError && cause.status === 404) {
        setAgingItems([]);
        setAgingState('no-briefing');
      } else {
        setAgingError(errorMessage(cause));
        setAgingState('error');
      }
    }
  }, [canReadBriefing]);

  useEffect(() => {
    if (isTaskStatus) void loadTasks();
  }, [isTaskStatus, loadTasks]);

  useEffect(() => {
    if (!isReceivablesAging) return;
    if (canReadBriefing) void loadAging();
    else {
      setAgingItems([]);
      setAgingState('denied');
    }
  }, [isReceivablesAging, canReadBriefing, loadAging]);

  if (!chart) {
    return <div className="stack"><PageHeader eyebrow="Chart" title="Chart not found" description="This ID is not in the source inventory." /><Link href="/charts">Back to charts</Link></div>;
  }

  const statusCounts = tasks.reduce<Map<string, number>>((counts, task) => {
    const status = taskStatus(task);
    counts.set(status, (counts.get(status) ?? 0) + 1);
    return counts;
  }, new Map());

  return (
    <div className="stack library-screen">
      <PageHeader eyebrow={`Chart #${String(chart.ordinal).padStart(3, '0')} · ${chart.category}`} title={chart.name} description="Chart data is never synthesized; only verified API-backed sources are shown." />
      <div className="reference-toolbar"><Link href="/charts" className="text-link">← All charts</Link></div>
      {chart.connected && chart.href && chart.source ? (
        <Section title="Connected workflow">
          <p className="section-description">Verified source: {chart.source}</p>
          <div className="notice info">
            {isReceivablesAging
              ? 'Aging buckets use only daysOverdue; source evidence may include balances, but balances are not summed or graphed.'
              : 'Live data comes from the existing Flux workflow. Open the source workflow for its full visualization and controls.'}
          </div>
          {!isReceivablesAging ? <Link className="button small" href={chart.href}>Open {chart.href === '/tasks' ? 'Tasks' : 'Cash flow'}</Link> : null}
        </Section>
      ) : (
        <Notice>Not connected — no verified chart-data API is available for this chart. No values are displayed.</Notice>
      )}
      {isTaskStatus ? (
        <Section title="Task status visualization">
          <p className="section-description">Counts are computed from the current GET /v1/tasks response only.</p>
          {state === 'loading' ? <LoadingRow label="Loading task statuses…" /> : null}
          {state === 'denied' ? <EmptyState title="Task access is not available">Your role does not have permission to read task data.</EmptyState> : null}
          {state === 'error' ? <div className="stack-sm"><InlineError message={error || 'Task status data could not be loaded.'} /><button className="button small" type="button" onClick={() => void loadTasks()}>Try again</button></div> : null}
          {state === 'ready' && tasks.length === 0 ? <EmptyState title="No tasks returned">The connected API returned no task records.</EmptyState> : null}
          {state === 'ready' && tasks.length > 0 ? (
            <div className="task-status-visual" aria-label={`${tasks.length} tasks grouped by their actual status`}>
              {[...statusCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([status, count]) => (
                <div className="task-status-row" key={status}>
                  <span>{status}</span>
                  <span className="task-status-track"><span style={{ width: `${(count / tasks.length) * 100}%` }} /></span>
                  <strong>{count}</strong>
                </div>
              ))}
              <p>{tasks.length} task{tasks.length === 1 ? '' : 's'} received from the API.</p>
            </div>
          ) : null}
        </Section>
      ) : null}
      {isReceivablesAging ? (
        <Section title="Accounts-receivable aging">
          <p className="section-description">Source: GET /v1/briefing/today · X-axis: days overdue · Y-axis: invoice count. Aging buckets use only daysOverdue; source evidence may include balances, but balances are not summed or graphed.</p>
          {agingState === 'loading' ? <LoadingRow label="Loading overdue-invoice evidence…" /> : null}
          {agingState === 'denied' ? <EmptyState title="Permission denied">Your role does not have permission to read the briefing.</EmptyState> : null}
          {agingState === 'no-briefing' ? <EmptyState title="No briefing available">The API has no briefing for today yet.</EmptyState> : null}
          {agingState === 'error' ? (
            <div className="stack-sm">
              <InlineError message={agingError || 'Overdue-invoice data could not be loaded.'} />
              <button className="button small" type="button" onClick={() => void loadAging()}>Try again</button>
            </div>
          ) : null}
          {agingState === 'empty' ? <EmptyState title="No verified overdue invoices">The briefing returned no overdue items with a verified daysOverdue value.</EmptyState> : null}
          {agingState === 'ready' ? (
            <>
              <div className="table-wrap">
                <table className="aging-table">
                  <caption>Overdue invoices grouped by days overdue</caption>
                  <thead><tr><th scope="col">Days overdue (bucket)</th><th scope="col">Invoice count</th></tr></thead>
                  <tbody>{countAgingBuckets(agingItems).map((bucket) => (
                    <tr key={bucket.label}><th scope="row">{bucket.label}</th><td>{bucket.count}</td></tr>
                  ))}</tbody>
                </table>
              </div>
              <p className="fineprint">Buckets do not overlap: exactly 90 days is in 61–90; 90+ means more than 90 days.</p>
            </>
          ) : null}
          {(agingState === 'ready' || agingState === 'empty') && agingItems.length > 0 ? (
            <div className="aging-evidence">
              <h3>Briefing evidence items</h3>
              <ul>{agingItems.map((item, index) => <li key={`${item.text}-${index}`}>{item.text}</li>)}</ul>
            </div>
          ) : null}
        </Section>
      ) : null}
    </div>
  );
}
