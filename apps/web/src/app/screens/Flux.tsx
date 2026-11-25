import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUp,
  BrainCircuit,
  Database,
  Eraser,
  HardHat,
  Quote,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRound,
} from 'lucide-react';
import { useWorkspace } from '../workspace';
import {
  Avatar,
  Button,
  Chip,
  PageHeader,
  Panel,
  ScoreDial,
  SectionHead,
  toneVar,
} from '../ui';
import { cx, timeStamp } from '../format';
import type { FluxMessage } from '../types';

const SUGGESTIONS = [
  'What needs my attention before 11am?',
  'Can we release the Dilip Buildcon retention?',
  'Where is working capital leaking?',
  'What should we tell the Bhopal Metro client today?',
];

const CONFIDENCE_TONE = {
  high: 'cyan',
  medium: 'amber',
  low: 'rose',
} as const;

export const FluxScreen: React.FC = () => {
  const { snapshot, messages, asking, askFlux, clearConversation, source } = useWorkspace();
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
  }, [messages, asking]);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const message = draft.trim();
    if (!message || asking) return;
    setDraft('');
    void askFlux(message);
  };

  const ask = (message: string) => {
    if (asking) return;
    void askFlux(message);
  };

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Flux · operating intelligence"
        title={
          <>
            See the signal. <em>Make the decision.</em>
          </>
        }
        description="Flux answers from the records that are loaded — invoices, gates, dispatch, projects — and says plainly when it cannot see something. It never invents a number."
        meta={
          <>
            <Chip tone="violet" dot>Flux ready</Chip>
            <Chip tone="neutral">{source === 'demo' ? 'Demo records' : 'Connected records'}</Chip>
            <Chip tone="cyan">source-grounded</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => clearConversation()}>
              <Eraser size={14} /> Clear thread
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                inputRef.current?.focus();
              }}
            >
              <Sparkles size={14} /> New question
            </Button>
          </>
        }
      />

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <Panel className="flex min-h-[620px] flex-col overflow-hidden !p-0">
          <div className="flex items-center justify-between border-b border-[var(--k-line)] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--k-violet)]/25 bg-[var(--k-violet-soft)] text-[var(--k-violet)]">
                <BrainCircuit size={15} />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--k-cyan)] shadow-[0_0_7px_var(--k-cyan)]" />
              </span>
              <div>
                <div className="text-[11.5px] font-bold text-[var(--k-t1)]">Flux operating layer</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-[8.5px] k-faint">
                  <span className="k-dot k-dot-pulse text-[var(--k-cyan)]" /> reading {snapshot.invoices.length} invoices · {snapshot.gates.length} gates · {snapshot.projects.length} sites
                </div>
              </div>
            </div>
            <span className="k-mono hidden text-[8px] uppercase tracking-[0.12em] k-faint sm:block">
              {source === 'demo' ? 'demo mode' : 'live context'}
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-5">
            <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
              <div className="flex items-start gap-2">
                <ShieldCheck size={13} className="mt-0.5 shrink-0 text-[var(--k-cyan)]" />
                <p className="text-[9.5px] leading-relaxed k-muted">
                  Answers are grounded in this workspace. Amounts, tax and statutory positions are read-only; any write
                  requires an explicit human approval inside Zoho Books.
                </p>
              </div>
            </div>

            {messages.map((message: FluxMessage) => (
              <div
                key={message.id}
                className={cx('flex gap-2.5', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                {message.role === 'assistant' ? (
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--k-violet)]/25 bg-[var(--k-violet-soft)] text-[var(--k-violet)]">
                    <Sparkles size={13} />
                  </span>
                ) : (
                  <Avatar name={snapshot.operator} size={28} tone="cyan" className="mt-0.5" />
                )}

                <div className={cx('max-w-[88%] md:max-w-[82%]', message.role === 'user' && 'text-right')}>
                  <div
                    className={cx(
                      'inline-block rounded-2xl px-3.5 py-3 text-left',
                      message.role === 'assistant'
                        ? 'rounded-tl-md border border-[var(--k-line)] bg-[var(--k-panel-solid)]'
                        : 'rounded-tr-md border border-[var(--k-cyan)]/20 bg-[var(--k-cyan-soft)]',
                    )}
                  >
                    {message.pending ? (
                      <div className="flex items-center gap-1.5 py-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--k-violet)] [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--k-violet)] [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--k-violet)]" />
                        <span className="ml-1.5 text-[10px] k-faint">{message.content}</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-[11.5px] leading-[1.8] text-[var(--k-t1)]">{message.content}</p>
                    )}

                    {message.role === 'assistant' && !message.pending && (message.evidence?.length || message.confidence) ? (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-[var(--k-line)] pt-2.5">
                        {message.confidence ? (
                          <Chip tone={CONFIDENCE_TONE[message.confidence]}>{message.confidence} confidence</Chip>
                        ) : null}
                        {message.evidence?.map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-[var(--k-line)] bg-[var(--k-inset)] px-2 py-0.5 text-[8px] k-faint"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div className={cx('mt-1 text-[8px] k-faint', message.role === 'user' && 'text-right')}>
                    {message.role === 'assistant' ? 'Flux' : snapshot.operator} · {message.time}
                  </div>
                </div>
              </div>
            ))}

            {messages.length <= 1 ? (
              <div className="pt-2">
                <div className="k-rule mb-2.5">try asking</div>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {SUGGESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => ask(question)}
                      className="group flex items-center justify-between gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5 text-left text-[10px] text-[var(--k-t2)] transition-colors hover:border-[var(--k-violet)]/30 hover:text-[var(--k-t1)]"
                    >
                      <span className="flex items-center gap-2">
                        <Quote size={11} className="text-[var(--k-violet)]" />
                        {question}
                      </span>
                      <ArrowRight size={11} className="shrink-0 text-[var(--k-t4)] transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-[var(--k-line)] p-3 md:p-4">
            <form onSubmit={submit} className="relative">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={2}
                placeholder="Ask about cash, a project, a gate, a dispatch — or the next best action…"
                className="k-input k-textarea min-h-[64px] !py-3 pr-14 text-[12px]"
                aria-label="Ask Flux a question"
              />
              <button
                type="submit"
                disabled={asking || !draft.trim()}
                className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--k-violet)] text-white transition-opacity disabled:opacity-35"
                aria-label="Send question"
              >
                <ArrowUp size={16} />
              </button>
            </form>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[8.5px] k-faint">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={10} /> 2–500 characters · no write without approval
              </span>
              <span className="k-mono">{timeStamp()} IST · {snapshot.organization}</span>
            </div>
          </div>
        </Panel>

        <div className="space-y-3">
          <Panel className="p-5">
            <SectionHead eyebrow="Assessment" title="The picture Flux can see." />
            <div className="mt-4">
              <ScoreDial score={94} risk="stable" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--k-line)] pt-3">
              <div>
                <div className="k-eyebrow !text-[7.5px]">records</div>
                <div className="mt-1 k-num text-[13px] font-semibold">{snapshot.invoices.length + snapshot.gates.length + snapshot.projects.length}</div>
              </div>
              <div>
                <div className="k-eyebrow !text-[7.5px]">gates</div>
                <div className="mt-1 k-num text-[13px] font-semibold text-[var(--k-rose)]">{snapshot.gates.filter((gate) => gate.severity === 'critical').length} critical</div>
              </div>
              <div>
                <div className="k-eyebrow !text-[7.5px]">source</div>
                <div className="mt-1 k-num text-[13px] font-semibold capitalize">{source}</div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Context" title="What Flux is reading." />
            <div className="mt-3 space-y-2.5">
              {[
                { name: 'Zoho Books ledger', detail: `${snapshot.invoices.length} invoices · ${snapshot.bills.length} bills`, icon: Database, tone: 'cyan' as const },
                { name: 'Project programme', detail: `${snapshot.projects.length} sites · ${snapshot.projects.reduce((sum, project) => sum + project.milestones.length, 0)} milestones`, icon: HardHat, tone: 'violet' as const },
                { name: 'Fleet & dispatch', detail: `${snapshot.fleet.length} units · ${snapshot.dispatches.length} challans`, icon: Truck, tone: 'amber' as const },
                { name: 'Compliance register', detail: `${snapshot.gates.length} gates · 2 critical`, icon: ShieldCheck, tone: 'rose' as const },
              ].map((sourceItem) => (
                <div key={sourceItem.name} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{ background: `color-mix(in srgb, ${toneVar(sourceItem.tone)} 10%, transparent)`, color: toneVar(sourceItem.tone) }}
                  >
                    <sourceItem.icon size={11} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--k-t1)]">{sourceItem.name}</div>
                    <div className="mt-0.5 text-[8.5px] k-faint">{sourceItem.detail}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-[var(--k-line)] pt-2.5">
              <div className="flex items-center gap-1.5 text-[8.5px] k-faint">
                <UserRound size={9} /> Last refreshed {snapshot.syncedAt}
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Try next" title="Questions with a decision inside." />
            <div className="mt-3 space-y-1.5">
              {SUGGESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => ask(question)}
                  disabled={asking}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] px-2.5 py-2 text-left text-[9.5px] text-[var(--k-t2)] transition-colors hover:border-[var(--k-violet)]/30 hover:text-[var(--k-t1)] disabled:opacity-50"
                >
                  {question}
                  <ArrowRight size={10} className="shrink-0 text-[var(--k-t4)]" />
                </button>
              ))}
            </div>
          </Panel>

          <Panel className="p-5">
            <SectionHead eyebrow="Guardrails" title="What Flux will not do." />
            <ul className="mt-2.5 space-y-2 text-[9.5px] leading-relaxed k-muted">
              <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--k-rose)]" />It will not invent a number, a client, or a date.</li>
              <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--k-amber)]" />It will not post to Zoho without approval.</li>
              <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--k-cyan)]" />It will say when a record set is incomplete.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
};

export default FluxScreen;
