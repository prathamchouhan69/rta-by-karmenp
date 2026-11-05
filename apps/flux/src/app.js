import { join } from 'node:path';
import { Store } from './store/store.js';
import { AuditLog } from './audit/auditLog.js';
import { Approvals } from './approvals/approvals.js';
import { Users } from './security/users.js';
import { RateLimiter } from './security/ratelimit.js';
import { ModelRegistry } from './models/registry.js';
import { Gateway } from './models/gateway.js';
import { CostGuard } from './models/costGuard.js';
import { Usage } from './models/usage.js';
import { ModelRouter } from './models/router.js';
import { ZohoTokens, ZohoError } from './zoho/auth.js';
import { ZohoReader } from './zoho/client.js';
import { ZohoWriter } from './zoho/writer.js';
import { HsnService } from './hsn/hsn.js';
import { DocumentEngine } from './documents/documents.js';
import { buildBriefing, BriefingScheduler } from './briefing/briefing.js';
import { AgentRegistry } from './agents/registry.js';
import { ADVISORS } from './agents/advisors.js';
import { createTools } from './agents/tools.js';
import { createAgentBrowserReader } from './agents/browserReader.js';
import { CORE_TOOLS, Orchestrator } from './agents/orchestrator.js';
import { Board } from './agents/board.js';
import { Memory } from './agents/memory.js';
import { istDate, nextRun } from './util/time.js';

// Stands in for Zoho Books when it is not configured: every call fails clearly instead of crashing.
class UnconfiguredReader {}
for (const m of ['listInvoices', 'getInvoice', 'invoicePdf', 'listContacts', 'getContact', 'listItems', 'listBills']) UnconfiguredReader.prototype[m] = async () => { throw new ZohoError('ZOHO_NOT_CONFIGURED', 'Zoho Books is not connected on this server yet', 503); };

export function createFlux({ config, fetchFn = fetch, now = () => new Date(), sleep, research = null, hsnLookup = null, browserReader = null }) {
  const store = new Store(config.dataDir);
  const audit = new AuditLog({ key: config.auditKey, file: config.dataDir ? join(config.dataDir, 'audit.jsonl') : null, now });
  const users = new Users(store); const limiter = new RateLimiter(() => now().getTime());
  const approvals = new Approvals({ store, secret: config.approvalSecret, audit, now: () => now().getTime() });
  const registry = new ModelRegistry(store), usage = new Usage(store, now), guard = new CostGuard({ registry });
  const gateways = { openrouter: new Gateway({ name: 'openrouter', ...config.providers.openrouter, fetchFn }), omniroute: new Gateway({ name: 'omniroute', ...config.providers.omniroute, fetchFn }) };
  const router = new ModelRouter({ registry, gateways, usage, guard, audit, config, sleep, now: () => now().getTime() });

  const z = config.zoho;
  const tok = (creds) => new ZohoTokens({ accountsBase: z.accountsBase, creds, fetchFn, now: () => now().getTime() });
  const reader = z.readConfigured ? new ZohoReader({ apiBase: z.apiBase, orgId: z.orgId, tokens: tok(z.read), fetchFn }) : new UnconfiguredReader();
  const writer = z.writeEnabled ? new ZohoWriter({ apiBase: z.apiBase, orgId: z.orgId, tokens: tok(z.write), fetchFn }) : null;

  const hsn = new HsnService({ store, reader, audit, lookup: hsnLookup, now });
  const docs = new DocumentEngine({ router, reader, hsn, approvals, writer, store, audit, now });
  const memory = new Memory(store, audit);
  const publicPageReader = browserReader || createAgentBrowserReader({ allowedDomains: config.browserAllowedDomains });
  const tools = createTools({ reader, hsn, memory, browserReader: publicPageReader, now });

  const agents = new AgentRegistry(tools.names);
  const L = (id, autonomy, toolsList, contract, maxSteps = 1, maxModelCalls = 1) => agents.register({ id, autonomy, tools: toolsList, contract, budget: { maxSteps, maxModelCalls } });
  L('flux_chat', 'L0', CORE_TOOLS.filter((name) => tools.names.includes(name)), 'Answers questions about the open screen using server-fetched evidence and read-only tools. Cannot write, send or approve.', 6, 8);
  L('verifier', 'L0', [], 'Lists statements in an answer that the evidence does not support. Reads only.');
  L('numbers_auditor', 'L0', [], 'Deterministic check that every figure in an answer appears in the evidence. No model involved.', 1, 0);
  L('document_agent', 'L1', ['lookup_hsn', 'find_customer'], 'Turns one instruction into a document draft and a proposal. A proposal has no effect until approved.', 4, 2);
  L('hsn_agent', 'L1', ['lookup_hsn'], 'Proposes HSN or SAC status from confirmed sources only and never invents a code.', 2, 1);
  L('collections_agent', 'L1', ['find_invoices', 'rank_dues'], 'Ranks overdue invoices and drafts reminders. Drafts are never sent.', 3, 2);
  L('board_chair', 'L1', [], 'Chairs an advisory meeting, records conflicts and dissent, and ranks actions into task proposals.', 1, 1);
  for (const a of ADVISORS) L(`advisor_${a.id}`, 'L0', [], `Gives ${a.title} advice within its scope using only supplied evidence and says what data is missing.`);

  const orchestrator = new Orchestrator({ router, tools, reader, audit, agents, now });
  const board = new Board({ router, approvals, audit });

  const briefings = store.collection('briefings');
  const briefing = {
    get: (date) => briefings.get(date), today: () => briefings.get(istDate(now())),
    async run(actor = 'system') {
      const b = await buildBriefing({ reader, research, now: now() }); const { evidenceTexts, ...saved } = b;
      briefings.put(b.date, saved); audit.append({ actor, action: 'briefing.built', data: { date: b.date, unverified: b.unverified.length } }); return saved;
    },
    setStatus(date, action, actor, until) {
      const b = briefings.get(date); if (!b) throw Object.assign(new Error('No briefing for that date'), { status: 404, code: 'NOT_FOUND' });
      const map = { save: 'saved', snooze: 'snoozed', dismiss: 'dismissed', open: 'opened' }; if (!map[action]) throw Object.assign(new Error('Action must be save, snooze, dismiss or open'), { status: 422, code: 'BAD_ACTION' });
      b.status = map[action]; if (action === 'snooze') b.snoozeUntil = until || new Date(now().getTime() + 3600000).toISOString(); briefings.put(date, b);
      audit.append({ actor: actor.id, action: `briefing.${action}`, data: { date } }); return b;
    },
  };
  let scheduler = null;
  const startBriefing = () => { if (!config.briefingEnabled || scheduler) return; scheduler = new BriefingScheduler({ run: () => briefing.run('scheduler'), nextAt: (n) => nextRun(n, config.briefingHour), hour: config.briefingHour, now, hasToday: () => !!briefing.today(), onError: (e) => { audit.append({ actor: 'scheduler', action: 'briefing.failed', data: { error: e.message } }); } }); scheduler.start(); };
  const stop = () => scheduler?.stop();

  return { config, store, audit, users, limiter, approvals, registry, usage, router, reader, writer, hsn, docs, memory, tools, agents, orchestrator, board, briefing, startBriefing, stop, now };
}
