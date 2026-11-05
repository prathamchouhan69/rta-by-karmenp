import { ADVISORS, ADVISOR_IDS, advisorPrompt, validateAdvice, validateSynthesis } from './advisors.js';
import { guardNumbers } from '../checks/numberGuard.js';
import { asData } from '../checks/injection.js';

const pool = async (items, limit, fn) => { const out = new Array(items.length); let i = 0; await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } })); return out; };
export const estimateCalls = (ids) => ids.length + (ids.length > 1 ? 1 : 0);

export class Board {
  constructor({ router, approvals, audit }) { Object.assign(this, { router, approvals, audit }); }
  resolveIds(ids) {
    const want = ids === 'all' || !ids?.length ? ADVISOR_IDS : [...new Set(ids)];
    const bad = want.filter((i) => !ADVISOR_IDS.includes(i)); if (bad.length) throw Object.assign(new Error(`Unknown advisor: ${bad.join(', ')}`), { status: 422, code: 'BAD_ADVISOR' });
    return want;
  }
  async meet({ question, ids, evidenceText = '', actor, confirmedCalls = null }) {
    const q = String(question || '').trim(); if (!q || q.length > 3000) throw Object.assign(new Error('Question must be 1 to 3000 characters'), { status: 422, code: 'BAD_QUESTION' });
    const list = this.resolveIds(ids); const calls = estimateCalls(list);
    if (calls > 6 && confirmedCalls !== calls) throw Object.assign(new Error(`This meeting needs ${calls} model calls. Confirm by sending confirmedCalls: ${calls}.`), { status: 409, code: 'CONFIRM_COST', extra: { estimatedCalls: calls } });
    const known = [q, evidenceText]; const body = `${evidenceText ? asData('evidence', evidenceText) + '\n\n' : ''}Question: ${q}`;
    const rows = await pool(list, 3, async (id) => {
      const a = ADVISORS.find((x) => x.id === id);
      try {
        const r = await this.router.runJson({ role: 'reasoning', actor: actor.id, privacy: 'D2', maxTokens: 900, messages: [{ role: 'system', content: advisorPrompt(a) }, { role: 'user', content: body }] }, validateAdvice);
        const advice = {}; const flagged = [];
        for (const [k, v] of Object.entries(r.data)) { if (typeof v === 'string') { const g = guardNumbers(v, known); advice[k] = g.answer; flagged.push(...g.unsupported); } else advice[k] = v; }
        if (a.disclaimer) advice.disclaimer = a.disclaimer;
        return { id, title: a.title, ok: true, advice, unsupportedNumbers: flagged, model: r.model };
      } catch (e) { return { id, title: a.title, ok: false, error: e.message }; }
    });
    const good = rows.filter((r) => r.ok); let synthesis = null;
    if (good.length > 1) {
      try {
        const s = await this.router.runJson({ role: 'reasoning', actor: actor.id, privacy: 'D2', maxTokens: 1200, messages: [{ role: 'system', content: 'You chair a board of advisors. Do not smooth over disagreement. Reply JSON only: {"conflicts":[string],"tradeoffs":[string],"rankedActions":[{"action":string,"priority":"High"|"Medium"|"Low","advisors":[string]}],"dissent":[string]}. De-duplicate actions and rank them. Never add numbers that the advisors did not give.' }, { role: 'user', content: JSON.stringify(good.map((g) => ({ advisor: g.title, ...g.advice }))) }] }, validateSynthesis);
        synthesis = { ...s.data, model: s.model };
      } catch (e) { synthesis = { error: e.message }; }
    }
    const meeting = { question: q, advisors: rows, synthesis, failed: rows.filter((r) => !r.ok).map((r) => r.id), callsUsed: calls };
    this.audit.append({ actor: actor.id, action: 'board.meeting', data: { advisors: list, failed: meeting.failed, callsUsed: calls } });
    return meeting;
  }
  /** Turns ranked actions into task proposals. Nothing is saved as a task until someone approves it. */
  toTaskProposals(meeting, actor) { return (meeting.synthesis?.rankedActions || []).map((a) => this.approvals.create({ kind: 'task.create', gate: 'G1', payload: { title: String(a.action).slice(0, 200), priority: a.priority, source: 'board' }, summary: `Task: ${String(a.action).slice(0, 120)}`, actor })); }
}
