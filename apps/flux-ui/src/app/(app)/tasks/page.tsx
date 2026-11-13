'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, Field, InlineError, LoadingRow, Notice, PageHeader, Section, Stat } from '@/components/ui';
import { useSession, useUi, can } from '@/components/providers';
import { ApiError, api, errorMessage } from '@/lib/api';

type TaskRecord = Record<string, unknown>;
type PageState = 'loading' | 'ready' | 'error' | 'denied';

function isRecord(value: unknown): value is TaskRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeTask(value: unknown): TaskRecord {
  if (isRecord(value)) return value;
  return { details: value };
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value.trim() ? value : '—';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value) ?? '—';
  } catch {
    return 'Unavailable';
  }
}

function fieldLabel(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ');
}

function statusLabel(task: TaskRecord): string {
  const status = displayValue(task.status);
  return status === '—' ? 'Unspecified' : status;
}

export default function TasksPage() {
  const user = useSession();
  const { t } = useUi();
  const permitted = can(user, 'proposals:read');
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [query, setQuery] = useState('');
  const [state, setState] = useState<PageState>(permitted ? 'loading' : 'denied');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!permitted) {
      setState('denied');
      return;
    }

    setState('loading');
    setError('');
    try {
      const data = await api<unknown>('v1/tasks');
      if (!isRecord(data) || !Array.isArray(data.tasks)) {
        throw new Error('The task response was invalid.');
      }
      setTasks(data.tasks.map(normalizeTask));
      setState('ready');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 403) {
        setState('denied');
      } else {
        setError(errorMessage(cause));
        setState('error');
      }
    }
  }, [permitted]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const task of tasks) {
      const status = statusLabel(task);
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return tasks;
    return tasks.filter((task) => Object.entries(task)
      .some(([key, value]) => `${key} ${displayValue(value)}`.toLocaleLowerCase().includes(normalizedQuery)));
  }, [query, tasks]);

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Work"
        title={t('nav.tasks')}
        description="Review tasks saved in Flux."
      />

      <Notice>
        Read-only task list. Flux exposes only GET /v1/tasks; there is no task-update endpoint.
      </Notice>

      {state === 'denied' ? (
        <EmptyState title="Task access is not available">
          Your role does not have the proposals:read permission required to view tasks.
        </EmptyState>
      ) : null}
      {state === 'loading' ? <LoadingRow label="Loading tasks…" /> : null}
      {state === 'error' ? (
        <div className="stack-sm">
          <InlineError message={error || 'Tasks could not be loaded.'} />
          <div>
            <button className="button small" type="button" onClick={() => void load()}>Try again</button>
          </div>
        </div>
      ) : null}

      {state === 'ready' ? (
        <>
          <Section title="Task status summary">
            <div className="stat-grid">
              <Stat label="All tasks" value={tasks.length} />
              {statusCounts.map(([status, count]) => (
                <Stat key={status} label={status} value={count} />
              ))}
            </div>
          </Section>

          <Section title="Task list">
            <Field label="Search tasks" htmlFor="task-search">
              <input
                id="task-search"
                className="input"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search any task field"
                aria-describedby="task-search-results"
              />
            </Field>
            <p id="task-search-results" className="fineprint" role="status" aria-live="polite">
              {filteredTasks.length} of {tasks.length} tasks
            </p>

            {tasks.length === 0 ? (
              <EmptyState title="No tasks yet">Tasks will appear here after they are saved in Flux.</EmptyState>
            ) : filteredTasks.length === 0 ? (
              <EmptyState title="No matching tasks">Try a different search term.</EmptyState>
            ) : (
              <ul className="stack" aria-label="Tasks" style={{ listStyle: 'none', padding: 0 }}>
                {filteredTasks.map((task, index) => {
                  const id = displayValue(task.id);
                  const titleValue = displayValue(task.title);
                  const title = titleValue !== '—' ? titleValue : id !== '—' ? id : `Task ${index + 1}`;
                  const entries = Object.entries(task);
                  return (
                    <li key={`${id}:${index}`}>
                      <article className="panel flat">
                        <div className="row-between">
                          <h3>{title}</h3>
                          <Badge>{statusLabel(task)}</Badge>
                        </div>
                        {task.priority !== undefined && task.priority !== null ? (
                          <p className="fineprint">Priority: {displayValue(task.priority)}</p>
                        ) : null}
                        <details style={{ marginTop: '0.65rem' }}>
                          <summary className="button ghost small" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                            Task details
                          </summary>
                          <dl className="stack-sm" style={{ marginTop: '0.7rem' }}>
                            {entries.map(([key, value]) => (
                              <div key={key}>
                                <dt className="fineprint">{fieldLabel(key)}</dt>
                                <dd className="soft" style={{ margin: 0, overflowWrap: 'anywhere' }}>{displayValue(value)}</dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      </article>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </>
      ) : null}
    </div>
  );
}
