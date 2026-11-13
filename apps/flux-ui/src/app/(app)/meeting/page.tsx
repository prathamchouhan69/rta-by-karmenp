'use client';

import { useState } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, Section } from '@/components/ui';
import { Icon } from '@/components/icons';
import { useUi } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface ActionItem { id: string; text: string; owner: string; due: string | null; status: string; }
interface Meeting {
  ok: boolean;
  date: string | null;
  title: string;
  attendees: string[];
  summary: string;
  decisions: string[];
  actionItems: ActionItem[];
  followUps: string[];
  disclaimer: string;
  limitations: string[];
}

export default function MeetingPage() {
  const { t } = useUi();
  const [text, setText] = useState('2026-11-04\n- Action: order steel by Friday\n- Decision: use supplier B\nAttendees: Rta, Karm');
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true); setError('');
    try {
      const data = await api<Meeting>('v1/meeting/structure', { method: 'POST', body: { text } });
      setMeeting(data); setState('idle');
    } catch (e) { setError(errorMessage(e)); setState('error'); } finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div className="section-head">
        <h2>{t('meeting.title')}</h2>
      </div>
      <p className="lede">{t('meeting.subtitle')}</p>

      <Section title={t('meeting.text')}>
        <label className="field">
          <span>{t('meeting.text')}</span>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} rows={10} />
        </label>
        <div className="row" style={{ marginTop: '0.8rem' }}>
          <button className="button primary" type="button" onClick={run} disabled={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="spark" size={15} />}
            {busy ? 'Structuring…' : t('meeting.build')}
          </button>
        </div>
      </Section>

      {state === 'loading' ? <LoadingRow label="Working…" /> : null}
      {error ? <InlineError message={error} /> : null}
      {meeting ? (
        <div className="stack">
          <div className="panel flat">
            <div className="row-between">
              <h3 style={{ fontSize: '1rem' }}>{meeting.title}</h3>
              <span className="fineprint">{meeting.date || 'No date'}</span>
            </div>
            <p className="soft" style={{ marginTop: '0.4rem' }}>{meeting.summary}</p>
            <p className="fineprint" style={{ marginTop: '0.4rem' }}>Attendees: {meeting.attendees.length ? meeting.attendees.join(', ') : 'none listed'}</p>
          </div>

          {meeting.decisions.length ? (
            <Section title={t('meeting.decisions')}>
              <ul className="bullets">{meeting.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul>
            </Section>
          ) : null}

          <Section title={t('meeting.actions')} aside={<Badge tone="accent">{meeting.actionItems.length}</Badge>}>
            {meeting.actionItems.length ? (
              <div className="stack-sm">
                {meeting.actionItems.map((a) => (
                  <article key={a.id} className="panel flat">
                    <div className="row-between">
                      <Badge tone="accent">{a.id}</Badge>
                      <span className="fineprint">owner: {a.owner}{a.due ? ` · due ${a.due}` : ''}</span>
                    </div>
                    <p className="soft" style={{ marginTop: '0.3rem' }}>{a.text}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">{t('meeting.noActions')}</p>
            )}
          </Section>

          <Notice tone="warn" title={meeting.disclaimer}>{meeting.limitations[0]}</Notice>
        </div>
      ) : null}
    </div>
  );
}