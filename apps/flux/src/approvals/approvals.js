import { newId } from '../util/ids.js';
import { canonical, sha256 } from '../util/json.js';
import { can } from '../security/roles.js';
import { signToken, verifyToken } from '../security/tokens.js';

export const GATES = {
  G1: 'internal save',
  G2: 'create or change a Zoho Books record',
  G3: 'finalise or issue a document',
  G4: 'send outside the system'
};

export const PROPOSAL_KINDS = {
  'invoice.create': { gate: 'G2', template: 'Create invoice for {customer}' },
  'invoice.edit': { gate: 'G2', template: 'Edit invoice {invoiceNumber}' },
  'invoice.send': { gate: 'G4', template: 'Send invoice {invoiceNumber} to customer' },
  'invoice.void': { gate: 'G3', template: 'Void invoice {invoiceNumber}' },
  'bill.create': { gate: 'G2', template: 'Create bill from {vendor}' },
  'bill.pay': { gate: 'G4', template: 'Pay bill {billNumber} to {vendor}' },
  'contact.create': { gate: 'G2', template: 'Create contact {name}' },
  'contact.edit': { gate: 'G2', template: 'Edit contact {name}' },
  'item.create': { gate: 'G2', template: 'Create item {name}' },
  'task.create': { gate: 'G1', template: 'Create task: {title}' },
  'task.edit': { gate: 'G1', template: 'Edit task: {title}' },
  'automation.create': { gate: 'G1', template: 'Create automation: {name}' },
  'write_preview': { gate: 'G2', template: 'Preview write operation' },
  'generic': { gate: 'G2', template: '{summary}' }
};

const TOKEN_TTL_SEC = 300;

export class Approvals {
  constructor({ store, secret, audit, now = () => Date.now() }) {
    this.col = store.collection('proposals');
    this.used = store.collection('approval_used');
    this.secret = secret;
    this.audit = audit;
    this.now = now;
  }

  create({ kind, gate, payload, summary, actor, ttlMin = 60, tags = [] }) {
    if (!GATES[gate]) throw new Error('Unknown gate');
    const kindDef = PROPOSAL_KINDS[kind] || PROPOSAL_KINDS.generic;
    const effectiveGate = gate || kindDef.gate;
    const p = {
      id: newId('prop'),
      kind,
      gate: effectiveGate,
      summary: String(summary || kindDef.template).slice(0, 300),
      payload,
      payloadHash: sha256(canonical(payload)),
      tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
      createdBy: actor.id,
      createdAt: new Date(this.now()).toISOString(),
      expiresAt: new Date(this.now() + ttlMin * 60000).toISOString(),
      status: 'pending',
      approvalHistory: [],
      escalationLevel: 0
    };
    this.col.put(p.id, p);
    this.audit.append({
      actor: actor.id,
      action: 'proposal.created',
      data: { id: p.id, kind, gate: effectiveGate, payloadHash: p.payloadHash, tags: p.tags }
    });
    return p;
  }

  get(id) { return this.col.get(id); }

  list({ status, kind, actorId, limit = 50, offset = 0 } = {}) {
    let results = this.col.all();
    if (status) results = results.filter(p => p.status === status);
    if (kind) results = results.filter(p => p.kind === kind);
    if (actorId) results = results.filter(p => p.createdBy === actorId || p.approvedBy === actorId);
    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return results.slice(offset, offset + limit);
  }

  #expired(p) { return Date.parse(p.expiresAt) <= this.now(); }

  approve(id, actor, { note = '' } = {}) {
    const p = this.col.get(id);
    if (!p) throw httpErr(404, 'NOT_FOUND', 'Proposal not found');
    if (!can(actor.role, `approve:${p.gate}`)) throw httpErr(403, 'FORBIDDEN', `Your role cannot approve ${p.gate} (${GATES[p.gate]})`);
    if (p.status !== 'pending') throw httpErr(409, 'BAD_STATE', `Proposal is ${p.status}`);
    if (this.#expired(p)) {
      p.status = 'expired';
      this.col.put(id, p);
      throw httpErr(410, 'EXPIRED', 'Proposal expired. Create a new one.');
    }
    if (sha256(canonical(p.payload)) !== p.payloadHash) throw httpErr(409, 'TAMPERED', 'Stored payload no longer matches its hash');

    const jti = newId('apr');
    const token = signToken({ typ: 'approval', pid: id, ph: p.payloadHash, jti, gate: p.gate, kind: p.kind }, this.secret, TOKEN_TTL_SEC, this.now());

    p.status = 'approved';
    p.approvedBy = actor.id;
    p.approvedAt = new Date(this.now()).toISOString();
    p.tokenId = jti;
    p.approvalNote = note.slice(0, 500);
    p.approvalHistory.push({ action: 'approve', actor: actor.id, at: new Date(this.now()).toISOString(), note });
    this.col.put(id, p);

    this.audit.append({
      actor: actor.id,
      action: 'proposal.approved',
      data: { id, gate: p.gate, kind: p.kind, payloadHash: p.payloadHash, note }
    });

    return { proposal: p, token, expiresInSec: TOKEN_TTL_SEC };
  }

  reject(id, actor, { reason = '', escalate = false } = {}) {
    const p = this.col.get(id);
    if (!p) throw httpErr(404, 'NOT_FOUND', 'Proposal not found');
    if (!['pending', 'approved'].includes(p.status)) throw httpErr(409, 'BAD_STATE', `Proposal is ${p.status}`);

    p.status = 'rejected';
    p.rejectionReason = reason.slice(0, 500);
    p.rejectedBy = actor.id;
    p.rejectedAt = new Date(this.now()).toISOString();
    p.approvalHistory.push({ action: 'reject', actor: actor.id, at: new Date(this.now()).toISOString(), reason });

    if (escalate && p.escalationLevel < 3) {
      p.escalationLevel += 1;
      p.status = 'pending';
      p.rejectedBy = null;
      p.rejectedAt = null;
      p.rejectionReason = null;
      // Reset for re-approval at higher level
    }
    this.col.put(id, p);

    this.audit.append({
      actor: actor.id,
      action: escalate ? 'proposal.escalated' : 'proposal.rejected',
      data: { id, reason: p.rejectionReason, escalationLevel: p.escalationLevel }
    });

    return p;
  }

  /** Called by an executor just before it acts. Burns the token; a second use fails. */
  consume(token, { kind, gate }) {
    const t = verifyToken(token, this.secret, 'approval', this.now());
    if (!t) throw httpErr(401, 'BAD_TOKEN', 'Approval token is invalid or expired');
    if (this.used.get(t.jti)) throw httpErr(409, 'REPLAY', 'Approval token was already used');
    const p = this.col.get(t.pid);
    if (!p || p.status !== 'approved' || p.tokenId !== t.jti) throw httpErr(409, 'BAD_STATE', 'Proposal is not in an approved state for this token');
    if (p.kind !== kind || p.gate !== gate || t.kind !== kind || t.gate !== gate) throw httpErr(409, 'MISMATCH', 'Token does not match this action');
    if (sha256(canonical(p.payload)) !== t.ph || p.payloadHash !== t.ph) throw httpErr(409, 'TAMPERED', 'Payload changed after approval. Approval is void.');

    this.used.put(t.jti, { at: new Date(this.now()).toISOString(), pid: p.id });
    p.status = 'executing';
    p.executedAt = new Date(this.now()).toISOString();
    p.approvalHistory.push({ action: 'execute', actor: t.pid, at: new Date(this.now()).toISOString() });
    this.col.put(p.id, p);
    return p;
  }

  complete(id, result, actor) {
    const p = this.col.get(id);
    p.status = 'executed';
    p.result = result;
    p.completedAt = new Date(this.now()).toISOString();
    p.completedBy = actor.id;
    p.approvalHistory.push({ action: 'complete', actor: actor.id, at: new Date(this.now()).toISOString(), result });
    this.col.put(id, p);
    this.audit.append({ actor, action: 'proposal.executed', data: { id, kind: p.kind, result } });
    return p;
  }

  fail(id, error, actor) {
    const p = this.col.get(id);
    p.status = 'failed';
    p.error = String(error).slice(0, 300);
    p.failedAt = new Date(this.now()).toISOString();
    p.failedBy = actor.id;
    p.approvalHistory.push({ action: 'fail', actor: actor.id, at: new Date(this.now()).toISOString(), error: p.error });
    this.col.put(id, p);
    this.audit.append({ actor, action: 'proposal.failed', data: { id, error: p.error } });
    return p;
  }

  /** Premium: batch approve multiple proposals */
  async batchApprove(ids, actor) {
    const results = [];
    for (const id of ids) {
      try {
        const r = this.approve(id, actor);
        results.push({ id, success: true, proposal: r.proposal, token: r.token });
      } catch (e) {
        results.push({ id, success: false, error: e.message });
      }
    }
    return results;
  }

  /** Premium: get proposal statistics */
  getStats({ actorId, since } = {}) {
    const proposals = this.list({ actorId });
    const filtered = since ? proposals.filter(p => new Date(p.createdAt) >= new Date(since)) : proposals;
    return {
      total: filtered.length,
      pending: filtered.filter(p => p.status === 'pending').length,
      approved: filtered.filter(p => p.status === 'approved').length,
      executed: filtered.filter(p => p.status === 'executed').length,
      rejected: filtered.filter(p => p.status === 'rejected').length,
      failed: filtered.filter(p => p.status === 'failed').length,
      expired: filtered.filter(p => p.status === 'expired').length,
      byKind: Object.entries(filtered.reduce((acc, p) => { acc[p.kind] = (acc[p.kind] || 0) + 1; return acc; }, {})).map(([kind, count]) => ({ kind, count })),
      byGate: Object.entries(filtered.reduce((acc, p) => { acc[p.gate] = (acc[p.gate] || 0) + 1; return acc; }, {})).map(([gate, count]) => ({ gate, count }))
    };
  }
}

export function httpErr(status, code, message, extra) {
  const e = new Error(message);
  e.status = status;
  e.code = code;
  if (extra) e.extra = extra;
  return e;
}