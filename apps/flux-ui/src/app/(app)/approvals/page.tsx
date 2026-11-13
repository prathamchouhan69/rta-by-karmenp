'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, EmptyState, InlineError, LoadingRow, Notice, PageHeader, Section } from '@/components/ui';
import { useSession, can } from '@/components/providers';
import { api, errorMessage } from '@/lib/api';

interface Proposal {
  id: string;
  kind: string;
  gate: string;
  summary: string;
  createdAt: string;
  status?: string;
}

interface ApprovedAction {
  token: string;
  expiresInSec: number;
  proposal: Proposal;
}

export default function ApprovalsPage() {
  const user = useSession();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [approved, setApproved] = useState<Record<string, ApprovedAction>>({});
  const [notice, setNotice] = useState('');
  const permitted = can(user, 'proposals:read');

  const load = useCallback(async () => {
    if (!permitted) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api<{ proposals: Proposal[] }>('v1/proposals?status=pending');
      setProposals(data.proposals);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [permitted]);

  useEffect(() => { void load(); }, [load]);

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      if (decision === 'approve') {
        const result = await api<{ token: string; expiresInSec: number; proposal: Proposal }>(
          `v1/proposals/${encodeURIComponent(id)}/approve`,
          { method: 'POST' },
        );
        setApproved((current) => ({ ...current, [id]: result }));
      } else {
        await api(`v1/proposals/${encodeURIComponent(id)}/reject`, {
          method: 'POST',
          body: { reason: 'Rejected from the approvals workspace.' },
        });
        setNotice('Proposal rejected.');
      }
      await load();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId('');
    }
  }

  async function execute(id: string) {
    const action = approved[id];
    if (!action) return;
    const gate = action.proposal.gate;
    if (!window.confirm(`Execute “${action.proposal.summary}” (${gate})? This can change business records. Continue only if this exact action is intended.`)) return;
    setBusyId(id);
    setError('');
    setNotice('');
    try {
      await api(`v1/proposals/${encodeURIComponent(id)}/execute`, {
        method: 'POST',
        body: { token: action.token },
      });
      setApproved((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setNotice('Action executed. Check the relevant record before taking further action.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="stack">
      <PageHeader
        eyebrow="Human review"
        title="Approvals"
        description="Review pending proposals. Approval is a separate step from execution; nothing is executed from this page."
      />
      {notice ? <p className="notice ok" role="status">{notice}</p> : null}
      {Object.entries(approved).map(([id, action]) => (
        <Notice key={id} tone="warn" title="Approval recorded — execution is still separate.">
          This one-time approval token stays in this page only and expires in about {Math.ceil(action.expiresInSec / 60)} minute(s). Reloading clears it.
          <div className="row" style={{ marginTop: '0.65rem' }}>
            <button className="button primary small" type="button" onClick={() => void execute(id)} disabled={busyId !== ''}>
              {busyId === id ? 'Executing…' : `Execute: ${action.proposal.summary}`}
            </button>
            <button className="button small" type="button" onClick={() => setApproved((current) => {
              const next = { ...current };
              delete next[id];
              return next;
            })} disabled={busyId !== ''}>
              Clear token
            </button>
          </div>
        </Notice>
      ))}
      <Section title="Pending proposals">
        {!permitted ? <EmptyState title="Approval access is not available">Your role does not have permission to review proposals.</EmptyState> : null}
        {permitted && loading ? <LoadingRow label="Loading pending proposals…" /> : null}
        {error ? <InlineError message={error} /> : null}
        {permitted && !loading && !error && proposals.length === 0 ? (
          <EmptyState title="No proposals are waiting">New proposals will appear here for human review.</EmptyState>
        ) : null}
        {proposals.length ? (
          <div className="stack">
            {proposals.map((proposal) => (
              <article className="panel flat" key={proposal.id}>
                <div className="row-between">
                  <Badge tone="accent">{proposal.gate}</Badge>
                  <span className="fineprint">{proposal.createdAt}</span>
                </div>
                <h3 style={{ marginTop: '0.55rem' }}>{proposal.summary || proposal.kind}</h3>
                <p className="fineprint mono">{proposal.kind} · {proposal.id}</p>
                <div className="row" style={{ marginTop: '0.8rem' }}>
                  <button className="button small" type="button" onClick={() => void decide(proposal.id, 'reject')} disabled={busyId !== ''}>
                    {busyId === proposal.id ? 'Saving…' : 'Reject'}
                  </button>
                  <button className="button primary small" type="button" onClick={() => void decide(proposal.id, 'approve')} disabled={busyId !== ''}>
                    {busyId === proposal.id ? 'Saving…' : 'Approve'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  );
}
