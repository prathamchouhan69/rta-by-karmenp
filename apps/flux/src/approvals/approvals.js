import { newId } from '../util/ids.js';
import { canonical, sha256 } from '../util/json.js';
import { can } from '../security/roles.js';
import { signToken, verifyToken } from '../security/tokens.js';

export const GATES = { G1: 'internal save', G2: 'create or change a Zoho Books record', G3: 'finalise or issue a document', G4: 'send outside the system' };
const TOKEN_TTL_SEC = 300;

// An approval is a single-use, short-lived token bound to the exact payload. Change one character of the
// payload after approval and the hash no longer matches, so the token is void.
export class Approvals {
  constructor({ store, secret, audit, now = () => Date.now() }) {
    this.col = store.collection('proposals'); this.used = store.collection('approval_used');
    this.secret = secret; this.audit = audit; this.now = now;
  }
  create({ kind, gate, payload, summary, actor, ttlMin = 60 }) {
    if (!GATES[gate]) throw new Error('Unknown gate');
    const p = { id: newId('prop'), kind, gate, summary: String(summary || '').slice(0, 300), payload, payloadHash: sha256(canonical(payload)), createdBy: actor.id, createdAt: new Date(this.now()).toISOString(), expiresAt: new Date(this.now() + ttlMin * 60000).toISOString(), status: 'pending' };
    this.col.put(p.id, p);
    this.audit.append({ actor: actor.id, action: 'proposal.created', data: { id: p.id, kind, gate, payloadHash: p.payloadHash } });
    return p;
  }
  get(id) { return this.col.get(id); }
  list(status) { return this.col.all().filter((p) => !status || p.status === status).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
  #expired(p) { return Date.parse(p.expiresAt) <= this.now(); }

  approve(id, actor) {
    const p = this.col.get(id);
    if (!p) throw httpErr(404, 'NOT_FOUND', 'Proposal not found');
    if (!can(actor.role, `approve:${p.gate}`)) throw httpErr(403, 'FORBIDDEN', `Your role cannot approve ${p.gate} (${GATES[p.gate]})`);
    if (p.status !== 'pending') throw httpErr(409, 'BAD_STATE', `Proposal is ${p.status}`);
    if (this.#expired(p)) { p.status = 'expired'; this.col.put(id, p); throw httpErr(410, 'EXPIRED', 'Proposal expired. Create a new one.'); }
    if (sha256(canonical(p.payload)) !== p.payloadHash) throw httpErr(409, 'TAMPERED', 'Stored payload no longer matches its hash');
    const jti = newId('apr');
    const token = signToken({ typ: 'approval', pid: id, ph: p.payloadHash, jti, gate: p.gate, kind: p.kind }, this.secret, TOKEN_TTL_SEC, this.now());
    p.status = 'approved'; p.approvedBy = actor.id; p.approvedAt = new Date(this.now()).toISOString(); p.tokenId = jti;
    this.col.put(id, p);
    this.audit.append({ actor: actor.id, action: 'proposal.approved', data: { id, gate: p.gate, kind: p.kind, payloadHash: p.payloadHash } });
    return { proposal: p, token, expiresInSec: TOKEN_TTL_SEC };
  }
  reject(id, actor, reason = '') {
    const p = this.col.get(id);
    if (!p) throw httpErr(404, 'NOT_FOUND', 'Proposal not found');
    if (!['pending', 'approved'].includes(p.status)) throw httpErr(409, 'BAD_STATE', `Proposal is ${p.status}`);
    p.status = 'rejected'; this.col.put(id, p);
    this.audit.append({ actor: actor.id, action: 'proposal.rejected', data: { id, reason: String(reason).slice(0, 200) } });
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
    p.status = 'executing'; this.col.put(p.id, p);
    return p;
  }
  complete(id, result, actor) { const p = this.col.get(id); p.status = 'executed'; p.result = result; this.col.put(id, p); this.audit.append({ actor, action: 'proposal.executed', data: { id, kind: p.kind, result } }); return p; }
  fail(id, error, actor) { const p = this.col.get(id); p.status = 'failed'; p.error = String(error).slice(0, 300); this.col.put(id, p); this.audit.append({ actor, action: 'proposal.failed', data: { id, error: p.error } }); return p; }
}

export function httpErr(status, code, message, extra) { const e = new Error(message); e.status = status; e.code = code; if (extra) e.extra = extra; return e; }
