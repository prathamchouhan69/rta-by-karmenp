import React, { useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Database,
  Palette,
  RefreshCw,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  LogOut,
  Lock,
  Building2,
  CircleHelp,
  SlidersHorizontal,
  MoonStar,
} from 'lucide-react';
import { useAuth } from '../auth';
import { useRouter } from '../router';
import { useWorkspace } from '../workspace';
import { useApp } from '../../context/AppContext';
import {
  Button,
  Chip,
  PageHeader,
  Panel,
  SectionHead,
  Tabs,
  toneVar,
} from '../ui';
import { cx } from '../format';
import type { Tone } from '../types';

type SettingsTab = 'appearance' | 'workspace' | 'security' | 'data' | 'about';

const Switch: React.FC<{ checked: boolean; onChange: (value: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative h-6 w-10 shrink-0 rounded-full border transition-colors',
      checked ? 'border-transparent bg-[var(--k-cyan)]' : 'border-[var(--k-line-strong)] bg-[var(--k-inset)]',
    )}
  >
    <span
      className={cx(
        'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform',
        checked ? 'translate-x-[19px]' : 'translate-x-0.5',
      )}
    />
  </button>
);

export const SettingsScreen: React.FC = () => {
  const { themeMode, setThemeMode, isLocked, setIsLocked, reducedMotion, setReducedMotion } = useApp();
  const { mode, organization, signOut, exitDemo } = useAuth();
  const { source, refresh, loading, ledgerConnected, live, snapshot, notify } = useWorkspace();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<SettingsTab>('appearance');
  const studio = themeMode === 'studio' || themeMode === 'day';

  const themeOptions = [
    {
      id: 'signal' as const,
      name: 'Signal',
      tagline: 'Dark cyan · night operations',
      detail: 'The control-room skin. High signal, low glare, built for early shifts and late reconciliations.',
      icon: Signal,
      swatches: ['#07070b', '#22d3ee', '#a78bfa', '#f6f3ec'],
    },
    {
      id: 'studio' as const,
      name: 'Studio',
      tagline: 'Lavender · serif thinking',
      detail: 'The studio skin. Warmer surfaces, editorial serif headings and a slower reading rhythm.',
      icon: Palette,
      swatches: ['#eee8f5', '#6d4aff', '#f6e7c8', '#221a2e'],
    },
  ];

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Settings · workspace"
        title={
          <>
            The workspace, <em>tuned.</em>
          </>
        }
        description="Appearance, session security, the Zoho connection and the honest limits of this console. Changes to appearance apply immediately and persist on this device."
        meta={
          <>
            <Chip tone={source === 'live' ? 'cyan' : source === 'practice' ? 'violet' : 'neutral'} dot>
              {source === 'live' ? 'Zoho live' : source === 'practice' ? 'Practice mode' : 'Demo workspace'}
            </Chip>
            <Chip tone="neutral">RTA OS 2.4</Chip>
            <Chip tone="violet">{studio ? 'Studio theme' : 'Signal theme'}</Chip>
          </>
        }
        actions={
          <Button onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'k-spin' : ''} /> Sync now
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="flex flex-col gap-2">
          <Panel className="p-2">
            {[
              { id: 'appearance' as const, label: 'Appearance', icon: Palette },
              { id: 'workspace' as const, label: 'Workspace', icon: Building2 },
              { id: 'security' as const, label: 'Security & session', icon: ShieldCheck },
              { id: 'data' as const, label: 'Data & sync', icon: Database },
              { id: 'about' as const, label: 'About RTA', icon: CircleHelp },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cx(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[11px] font-semibold transition-colors',
                  tab === item.id
                    ? 'bg-[var(--k-cyan-soft)] text-[var(--k-cyan)]'
                    : 'text-[var(--k-t2)] hover:bg-[var(--k-inset)] hover:text-[var(--k-t1)]',
                )}
              >
                <item.icon size={14} />
                {item.label}
              </button>
            ))}
          </Panel>

          <Panel className="p-4">
            <div className="k-eyebrow !text-[8px]">active theme</div>
            <div className="mt-1.5 flex items-center gap-2">
              {studio ? <Palette size={14} className="text-[var(--k-violet)]" /> : <MoonStar size={14} className="text-[var(--k-cyan)]" />}
              <span className="text-[12px] font-semibold text-[var(--k-t1)]">{studio ? 'Studio' : 'Signal'}</span>
            </div>
            <p className="mt-1.5 text-[9.5px] leading-relaxed k-faint">
              {studio ? 'Built for reading, thinking and client-facing work.' : 'Built for operations, dispatch and the night shift.'}
            </p>
          </Panel>
        </div>

        <div className="space-y-3">
          {tab === 'appearance' ? (
            <>
              <Panel className="p-5">
                <SectionHead
                  eyebrow="Theme"
                  title="Choose the room you work in."
                  subtitle="Both themes use the same information architecture. Only the light, type and tempo change."
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {themeOptions.map((option) => {
                    const active = themeMode === option.id || (option.id === 'studio' && themeMode === 'day') || (option.id === 'signal' && themeMode === 'night');
                    return (
                      <button
                        key={option.id}
                        onClick={() => setThemeMode(option.id)}
                        className={cx(
                          'relative overflow-hidden rounded-2xl border p-4 text-left transition-all',
                          active
                            ? 'border-[var(--k-cyan)]/40 shadow-[0_0_0_1px_color-mix(in_srgb,var(--k-cyan)_30%,transparent)]'
                            : 'border-[var(--k-line)] hover:border-[var(--k-line-strong)]',
                        )}
                      >
                        <div
                          className="relative mb-3 h-[74px] overflow-hidden rounded-xl border"
                          style={{
                            background: option.id === 'signal' ? '#08080d' : '#f3edf9',
                            borderColor: option.id === 'signal' ? 'rgba(255,255,255,0.08)' : 'rgba(51,30,82,0.1)',
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 w-[26%] border-r"
                            style={{
                              background: option.id === 'signal' ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.55)',
                              borderColor: option.id === 'signal' ? 'rgba(255,255,255,0.07)' : 'rgba(51,30,82,0.08)',
                            }}
                          />
                          <div className="absolute left-[33%] top-3 h-2 w-[30%] rounded-full" style={{ background: option.id === 'signal' ? 'rgba(255,255,255,0.15)' : 'rgba(51,30,82,0.16)' }} />
                          <div className="absolute left-[33%] top-7 h-1.5 w-[22%] rounded-full" style={{ background: option.id === 'signal' ? 'rgba(255,255,255,0.08)' : 'rgba(51,30,82,0.09)' }} />
                          <div
                            className="absolute bottom-3 left-[33%] right-3 top-[46px] rounded-md"
                            style={{ background: option.id === 'signal' ? 'rgba(34,211,238,0.14)' : 'rgba(109,74,255,0.12)' }}
                          />
                          <div className="absolute bottom-3 left-[33%] right-3 flex items-center gap-1">
                            {[38, 58, 44, 70, 52, 82].map((value, index) => (
                              <span
                                key={index}
                                className="flex-1 rounded-sm"
                                style={{
                                  height: `${value * 0.25}px`,
                                  background: option.id === 'signal' ? (index === 5 ? '#22d3ee' : 'rgba(167,139,250,0.55)') : (index === 5 ? '#6d4aff' : 'rgba(109,74,255,0.35)'),
                                }}
                              />
                            ))}
                          </div>
                          <div
                            className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ background: option.swatches[1], color: option.id === 'signal' ? '#041014' : '#fff', fontSize: 9 }}
                          >
                            <option.icon size={11} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-bold text-[var(--k-t1)]">{option.name}</span>
                          {active ? <Chip tone="cyan" dot>active</Chip> : null}
                        </div>
                        <div className="mt-0.5 text-[9px] k-faint">{option.tagline}</div>
                        <p className="mt-2 text-[10px] leading-relaxed k-muted">{option.detail}</p>
                        <div className="mt-3 flex items-center gap-1.5">
                          {option.swatches.map((swatch) => (
                            <span key={swatch} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: swatch }} />
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Panel>

              <Panel className="p-5">
                <SectionHead eyebrow="Comfort" title="Motion and density." />
                <div className="mt-4 divide-y divide-[var(--k-line)]">
                  <div className="flex items-center justify-between gap-4 py-3 first:pt-0">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">Reduced motion</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">Calm the marquee and decorative transitions.</div>
                    </div>
                    <Switch checked={reducedMotion} onChange={setReducedMotion} label="Reduced motion" />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">Interface density</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">Comfortable spacing is used across the console.</div>
                    </div>
                    <Chip tone="neutral">comfortable</Chip>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3 last:pb-0">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">Numeric style</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">Indian grouping and lakh/crore compaction.</div>
                    </div>
                    <Chip tone="cyan">en-IN</Chip>
                  </div>
                </div>
              </Panel>
            </>
          ) : null}

          {tab === 'workspace' ? (
            <>
              <Panel className="p-5">
                <SectionHead
                  eyebrow="Organisation"
                  title={organization?.name ?? 'Karm Enterprises'}
                  subtitle="The legal and operating identity used across documents, invoices and reports."
                  action={<Button size="sm" onClick={() => navigate('documents')}>Document identity <ArrowUpRight size={11} /></Button>}
                />
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ['Legal name', organization?.name ?? 'Karm Enterprises'],
                    ['GSTIN', '23AAGCK9921D1Z4'],
                    ['State / place of supply', 'Madhya Pradesh (23)'],
                    ['Financial year', 'April 2026 – March 2027'],
                    ['Registered address', 'Kolar Quarry, Sehore district, MP 466001'],
                    ['Books platform', mode === 'demo' ? 'Demo adapter · Zoho series' : 'Zoho Books India'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                      <div className="k-eyebrow !text-[7.5px]">{label}</div>
                      <div className="mt-1 text-[11px] font-medium text-[var(--k-t1)]">{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
                  <Building2 size={13} className="text-[var(--k-t3)]" />
                  <span className="text-[9.5px] k-muted">Changes to legal identity require a fresh Zoho Books sync and a document series review.</span>
                </div>
              </Panel>

              <Panel className="p-5">
                <SectionHead eyebrow="Operator" title="Who is holding the console." />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--k-violet)]/25 bg-[var(--k-violet-soft)] text-[13px] font-bold text-[var(--k-violet)]">
                      KP
                    </span>
                    <div>
                      <div className="text-[12px] font-bold text-[var(--k-t1)]">Karmen Parmar</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">Owner · full operating authority</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip tone="cyan" dot>session active</Chip>
                    <Button size="sm" onClick={() => notify('Profile editing is managed by the workspace owner account.', 'info')}>
                      Edit profile
                    </Button>
                  </div>
                </div>
              </Panel>
            </>
          ) : null}

          {tab === 'security' ? (
            <>
              <Panel className="p-5">
                <SectionHead
                  eyebrow="Session"
                  title="Lock it before you walk away."
                  subtitle="This console holds commercial and personal data. Locking is instant and local."
                />
                <div className="mt-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3.5">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">Lock this session</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">Demo passcode 1234 · the overlay stays until unlocked.</div>
                    </div>
                    <Button onClick={() => setIsLocked(true)} disabled={isLocked}>
                      <Lock size={13} /> Lock now
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3.5">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">Sign out</div>
                      <div className="mt-0.5 text-[9.5px] k-faint">
                        Returns to the workspace gate. {mode === 'demo' ? 'Leaves the demo workspace.' : 'Clears the local session token.'}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (!window.confirm('Sign out of the workspace?')) return;
                        if (mode === 'demo') {
                          exitDemo();
                          navigate('login');
                        } else {
                          void signOut().then(() => navigate('login'));
                        }
                      }}
                    >
                      <LogOut size={13} /> Sign out
                    </Button>
                  </div>
                  {mode === 'demo' ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--k-amber)]/20 bg-[var(--k-amber-soft)] p-3.5">
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--k-amber)]">You are in the demo workspace</div>
                        <div className="mt-0.5 text-[9.5px] k-faint">All records are sample data. Sign in with a setup code for the practice ledger.</div>
                      </div>
                      <Button size="sm" onClick={() => { exitDemo(); navigate('login'); }}>
                        Leave demo
                      </Button>
                    </div>
                  ) : null}
                </div>
              </Panel>

              <Panel className="p-5">
                <SectionHead eyebrow="Safeguards" title="What protects the workspace." />
                <div className="mt-3 space-y-2.5">
                  {[
                    'Owner setup code exchanged for a short-lived bearer session.',
                    'Local token cleared on sign-out and rejected on boot if expired.',
                    'Automatic session lock after five minutes of inactivity.',
                    'Live accounting writes require a human approval inside Zoho Books.',
                    'No setup code, token or secret is ever rendered in the interface.',
                  ].map((line) => (
                    <div key={line} className="flex items-start gap-1.5 text-[10px] k-muted">
                      <Check size={11} className="mt-0.5 shrink-0 text-[var(--k-cyan)]" />
                      {line}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
                  <Smartphone size={13} className="text-[var(--k-t3)]" />
                  <span className="text-[9px] k-faint">This session · Chrome · Bhopal · 25 Nov 2026, 09:42 IST</span>
                </div>
              </Panel>
            </>
          ) : null}

          {tab === 'data' ? (
            <>
              <Panel className="p-5">
                <SectionHead
                  eyebrow="Sources"
                  title="What this console is reading."
                  subtitle="Demo records are labelled here and throughout. A live Zoho ledger takes precedence when it returns substantive invoices."
                />
                <div className="mt-4 space-y-2">
                  {([
                    { name: 'Zoho Books', role: 'Invoices, bills, contacts, items', status: ledgerConnected ? 'connected' : mode === 'demo' ? 'demo adapter' : 'practice · sparse', tone: ledgerConnected ? 'cyan' : 'amber' },
                    { name: 'Flux operating layer', role: 'Briefing, health, source-grounded answers', status: 'available', tone: 'violet' },
                    { name: 'Dispatch telemetry', role: 'Fleet position and challan state', status: 'sample', tone: 'amber' },
                    { name: 'Gates register', role: 'Statutory permissions and evidence', status: 'workspace', tone: 'cyan' },
                  ] as Array<{ name: string; role: string; status: string; tone: Tone }>).map((row) => (
                    <div key={row.name} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                      <div>
                        <div className="text-[11px] font-semibold text-[var(--k-t1)]">{row.name}</div>
                        <div className="mt-0.5 text-[9px] k-faint">{row.role}</div>
                      </div>
                      <Chip tone={row.tone}>{row.status}</Chip>
                    </div>
                  ))}
                </div>
              </Panel>

              <div className="grid gap-3 md:grid-cols-2">
                <Panel className="p-5">
                  <SectionHead eyebrow="Sync" title="The state of the ledger." />
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="k-faint">Mode</span>
                      <span className="font-semibold capitalize text-[var(--k-t1)]">{mode === 'demo' ? 'Demo workspace' : organization?.mode ?? mode}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="k-faint">Last sync</span>
                      <span className="font-semibold text-[var(--k-t1)]">{snapshot.syncedAt}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="k-faint">Invoice rows</span>
                      <span className="font-semibold text-[var(--k-t1)]">{snapshot.invoices.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="k-faint">Live payload</span>
                      <span className="font-semibold text-[var(--k-t1)]">{live ? `${live.invoices.length} invoices` : 'not loaded'}</span>
                    </div>
                  </div>
                  <Button className="mt-3 w-full" size="sm" onClick={() => void refresh()} disabled={loading}>
                    <RefreshCw size={11} className={loading ? 'k-spin' : ''} /> Refresh from source
                  </Button>
                </Panel>

                <Panel className="p-5">
                  <SectionHead eyebrow="Boundary" title="What this console will not do." />
                  <ul className="mt-3 space-y-2 text-[9.5px] leading-relaxed k-muted">
                    <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--k-rose)]" />It does not file GST returns or sign documents.</li>
                    <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--k-amber)]" />It does not move money or approve payments.</li>
                    <li className="flex gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--k-cyan)]" />It does not train on your data or share it with a third party.</li>
                  </ul>
                  <div className="mt-3 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5 text-[9px] leading-relaxed k-faint">
                    Tax positions are management views only until the chartered accountant files them. Always verify live
                    figures against Zoho Books before a statutory submission.
                  </div>
                </Panel>
              </div>
            </>
          ) : null}

          {tab === 'about' ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Panel className="p-5 md:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)]">
                        <img src="/karm-symbol-white.png" alt="" className="h-7 w-7 object-contain" />
                      </span>
                      <div>
                        <div className="text-[16px] font-extrabold tracking-[-0.04em] text-[var(--k-t1)]">RTA <span className="font-medium text-[var(--k-t3)]">by</span> KARM</div>
                        <div className="k-mono text-[8px] uppercase tracking-[0.2em] text-[var(--k-cyan)]">living business operating system</div>
                      </div>
                    </div>
                    <p className="mt-3 max-w-[560px] text-[11.5px] leading-relaxed k-muted">
                      A calm operator console for Indian industrial businesses: Zoho Books finance, living project delivery,
                      dispatch, statutory gates and a source-grounded intelligence layer. Designed to be read, not merely
                      watched.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="k-mono text-[8px] uppercase tracking-[0.12em] k-faint">version</div>
                    <div className="mt-1 k-num text-[18px] font-semibold text-[var(--k-t1)]">2.4.0</div>
                    <div className="mt-0.5 text-[9px] k-faint">Bhopal · 2026</div>
                  </div>
                </div>
              </Panel>

              <Panel className="p-5">
                <SectionHead eyebrow="Stack" title="Built plainly." />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    ['Interface', 'React 18 + TypeScript'],
                    ['Styling', 'Tailwind + semantic CSS'],
                    ['Charts', 'Recharts'],
                    ['Icons', 'Lucide'],
                    ['Ledger', 'Zoho Books API'],
                    ['Intelligence', 'Flux layer'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[var(--k-line)] bg-[var(--k-inset)] p-2.5">
                      <div className="k-eyebrow !text-[7px]">{label}</div>
                      <div className="mt-0.5 text-[9.5px] text-[var(--k-t1)]">{value}</div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel className="p-5">
                <SectionHead eyebrow="Credits" title="References & intent." />
                <div className="mt-3 space-y-2 text-[10px] k-muted">
                  <div className="flex items-start gap-2">
                    <Sparkles size={11} className="mt-0.5 shrink-0 text-[var(--k-violet)]" />
                    <span>Merged from the KARM Studio and Signal interface directions.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Palette size={11} className="mt-0.5 shrink-0 text-[var(--k-cyan)]" />
                    <span>Types: Fraunces, Manrope and JetBrains Mono.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <SlidersHorizontal size={11} className="mt-0.5 shrink-0 text-[var(--k-amber)]" />
                    <span>Data: demonstration workspace shaped on central-Indian aggregates operations.</span>
                  </div>
                </div>
                <div className="mt-3 border-t border-[var(--k-line)] pt-2.5 text-[8.5px] leading-relaxed k-faint">
                  All company names, invoice numbers and amounts in the demo workspace are illustrative. Live data comes
                  only from the connected Zoho organisation.
                </div>
              </Panel>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[8.5px] k-faint">
        <span className="flex items-center gap-1.5"><ShieldCheck size={10} /> Settings apply to this session and device.</span>
        <span className="k-mono uppercase tracking-[0.12em]">RTA OS 2.4 · Bhopal · IST</span>
      </div>
    </div>
  );
};

export default SettingsScreen;
