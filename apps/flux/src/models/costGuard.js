import { baseId, keyOf } from './registry.js';
// No silent paid-model usage: checked before the call (is this model allowed?) and after it (which model really answered?).
export class CostGuard {
  constructor({ registry }) { this.registry = registry; }
  allowBefore(m, { policy, paidApproved }) {
    if (m.costClass === 'free') return { ok: true };
    if (policy === 'paid-per-use' && paidApproved && m.costClass === 'paid') return { ok: true, paid: true };
    return { ok: false, reason: `${m.id} is ${m.costClass === 'paid' ? 'a paid model' : 'not proven free'}; policy is ${policy}${policy === 'paid-per-use' ? ' and this call was not approved as paid' : ''}` };
  }
  checkActual(requested, actualId, { policy, paidApproved }) {
    if (!actualId || baseId(actualId) === baseId(requested.id)) return { ok: true, substituted: false };
    const actual = this.registry.get(keyOf(requested.provider, actualId)) || this.registry.all().find((m) => baseId(m.id) === baseId(actualId));
    if (!actual) return { ok: false, substituted: true, reason: `Gateway answered with ${actualId}, which is not in the registry, so it cannot be shown to be free` };
    const v = this.allowBefore(actual, { policy, paidApproved });
    return { ...v, substituted: true, actual: actual.id, reason: v.ok ? undefined : `Gateway substituted ${actualId}. ${v.reason}` };
  }
}
