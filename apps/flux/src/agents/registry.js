// Every agent must declare a contract, a tool allow-list, a budget and an autonomy level, or it is refused.
// L0 observe, L1 propose, L2 act only through the approval executor. L3 (act alone) does not exist in version 1.
export const AUTONOMY = ['L0', 'L1', 'L2'];
export class AgentRegistry {
  constructor(knownTools = []) { this.known = new Set(knownTools); this.agents = new Map(); }
  register(a) {
    const bad = [];
    if (!/^[a-z][a-z0-9_]{2,40}$/.test(a?.id || '')) bad.push('id');
    if (!AUTONOMY.includes(a?.autonomy)) bad.push(a?.autonomy === 'L3' ? 'autonomy (L3 is not allowed)' : 'autonomy');
    if (!Array.isArray(a?.tools) || a.tools.some((t) => !this.known.has(t))) bad.push('tools (must be an allow-list of known tools)');
    if (!(a?.budget?.maxSteps > 0 && a?.budget?.maxModelCalls >= 0)) bad.push('budget');
    if (typeof a?.contract !== 'string' || a.contract.trim().length < 20) bad.push('contract');
    if (bad.length) throw new Error(`Agent "${a?.id}" rejected. Missing or invalid: ${bad.join(', ')}`);
    if (this.agents.has(a.id)) throw new Error(`Agent "${a.id}" is already registered`);
    this.agents.set(a.id, Object.freeze({ ...a })); return a;
  }
  get(id) { return this.agents.get(id) || null; }
  list() { return [...this.agents.values()]; }
}
