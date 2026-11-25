import React, { useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Compass,
  Feather,
  Leaf,
  Orbit,
  Quote,
  Sparkles,
} from 'lucide-react';
import { useWorkspace } from '../workspace';
import {
  Button,
  Chip,
  Modal,
  PageHeader,
  Panel,
  SectionHead,
  Tabs,
  toneVar,
} from '../ui';
import { SparkBars } from '../charts';
import { cx } from '../format';
import type { Tone } from '../types';

type AtlasTab = 'patterns' | 'charts' | 'notes';

interface Pattern {
  id: string;
  name: string;
  latin: string;
  principle: string;
  applied: string;
  detail: string;
  tone: Tone;
  art: 'river' | 'mycelium' | 'murmuration' | 'tardigrade' | 'coral' | 'slime';
}

const PATTERNS: Pattern[] = [
  {
    id: 'river',
    name: 'River delta',
    latin: 'Aqua fluens',
    principle: 'Distribute without losing the source.',
    applied: 'Cash routing & retention',
    detail:
      'A delta never chooses one channel. It splits, measures, and rejoins. KARM uses the same logic for cash: receivables are routed into a tax reserve, a payroll channel, a plant-maintenance channel and a growth channel before any discretionary spend. No channel is dammed without a named decision.',
    tone: 'cyan',
    art: 'river',
  },
  {
    id: 'mycelium',
    name: 'Mycelial network',
    latin: 'Reticulum',
    principle: 'Intelligence lives in the connections.',
    applied: 'Vendor & client memory',
    detail:
      'A mycelium does not centralise. It links. The workspace keeps a thin, living memory between a client, a site, a dispatch, an invoice and a gate, so a late payment is never just a ledger row — it is a relationship, a supply decision and a conversation.',
    tone: 'violet',
    art: 'mycelium',
  },
  {
    id: 'murmuration',
    name: 'Starling murmuration',
    latin: 'Sturnus vulgaris',
    principle: 'Local rules, coherent movement.',
    applied: 'Fleet dispatch',
    detail:
      'Every bird follows three rules: avoid collision, match velocity, stay close. The dispatch board uses the same discipline. Drivers receive a destination, a weighbridge window and a return instruction — not a central schedule that breaks the moment a gate is delayed.',
    tone: 'amber',
    art: 'murmuration',
  },
  {
    id: 'tardigrade',
    name: 'Tardigrade',
    latin: 'Tardigrada',
    principle: 'Resilience is a state, not a feature.',
    applied: 'Offline operations',
    detail:
      'The tardigrade survives by suspending, not by fighting. Field teams in low-signal quarry areas keep working offline: dispatch slips queue locally, approvals wait, and the ledger reconciles when the network returns. Nothing is lost; it is simply held.',
    tone: 'sage',
    art: 'tardigrade',
  },
  {
    id: 'coral',
    name: 'Coral growth',
    latin: 'Anthozoa',
    principle: 'Build slowly, in layers that carry load.',
    applied: 'Compounding capacity',
    detail:
      'Coral adds a thin layer at a time, each one carrying the next. KARM’s plant expansion follows the same rule: crusher line 2 is commissioned in stages, each stage proving throughput before the next load is added. Growth that cannot carry load is not growth.',
    tone: 'rose',
    art: 'coral',
  },
  {
    id: 'slime',
    name: 'Slime mould',
    latin: 'Physarum polycephalum',
    principle: 'Find the shortest path by exploring.',
    applied: 'Route & cost optimisation',
    detail:
      'Physarum explores every route and reinforces the one that works. Freight is reviewed the same way: no route is fixed by habit. Every quarter the Kolar-to-Bhopal corridor is re-tested against fuel, tolls, turnaround and the cost of a late pour.',
    tone: 'cyan',
    art: 'slime',
  },
];

const CHARTS = [
  { id: 'c1', name: 'Cash flow & liquidity', kind: 'Area + line', detail: 'Inflow, outflow and net over eight months', data: [24, 30, 27, 38, 44, 39, 48, 60], tone: 'cyan' as const },
  { id: 'c2', name: 'Revenue against target', kind: 'Bar pair', detail: 'Billed value and monthly target', data: [42, 50, 55, 48, 62, 72], tone: 'violet' as const },
  { id: 'c3', name: 'Receivables ageing', kind: 'Dotted arc', detail: 'Four ageing buckets, weighted by value', data: [48, 32, 18, 9], tone: 'amber' as const },
  { id: 'c4', name: 'Project S-curve', kind: 'Dual line', detail: 'Planned versus earned physical progress', data: [10, 22, 35, 48, 61, 74, 88], tone: 'cyan' as const },
  { id: 'c5', name: 'Fleet utilisation', kind: 'Ring matrix', detail: 'Plant and tipper utilisation by unit', data: [42, 68, 91, 76, 55, 88], tone: 'sage' as const },
  { id: 'c6', name: 'Gate health', kind: 'Progress rows', detail: 'Statutory readiness by category', data: [72, 58, 84, 92], tone: 'rose' as const },
  { id: 'c7', name: 'Stock cover', kind: 'Spark bars', detail: 'Days of cover by material grade', data: [18, 21, 24, 19, 16, 14, 12, 10], tone: 'amber' as const },
  { id: 'c8', name: 'Dispatch corridor', kind: 'Schematic map', detail: 'Live loads across the Kolar–Bhopal corridor', data: [30, 45, 60, 48, 72, 58], tone: 'violet' as const },
];

const NOTES = [
  {
    id: 'n1',
    date: '24 Nov 2026',
    tag: 'Field note',
    title: 'The weighbridge is the truth',
    excerpt: 'Why every invoice begins with a net weight, never a nominal load — and what happens when the two disagree.',
    time: '4 min',
  },
  {
    id: 'n2',
    date: '21 Nov 2026',
    tag: 'Operating rule',
    title: 'A gate is a promise, not a checkbox',
    excerpt: 'The cost of an open compliance gate is never the fine. It is the truck at the barrier and the pour that misses its window.',
    time: '6 min',
  },
  {
    id: 'n3',
    date: '18 Nov 2026',
    tag: 'Design note',
    title: 'Why the dashboard is quiet',
    excerpt: 'A calm surface is not an empty one. The hierarchy of signal, decision and record — and why colour is rationed.',
    time: '5 min',
  },
  {
    id: 'n4',
    date: '12 Nov 2026',
    tag: 'Reference',
    title: 'Ṛta: the order that is recognised',
    excerpt: 'The Vedic idea of cosmic order as the original operating system: not imposed control, but attentive rhythm.',
    time: '7 min',
  },
];

const PatternArt: React.FC<{ art: Pattern['art']; tone: Tone }> = ({ art, tone }) => {
  const color = toneVar(tone);
  const common = { fill: 'none', stroke: color, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 220 120" className="h-[120px] w-full" aria-hidden="true">
      <defs>
        <radialGradient id={`atlas-${art}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="60" r="56" fill={`url(#atlas-${art})`} />
      {art === 'river' && (
        <g {...common} strokeWidth="1.4">
          <path d="M20 20 C 60 30, 70 52, 96 60 S 150 74, 200 62" opacity="0.9" />
          <path d="M96 60 C 120 70, 130 88, 146 104" opacity="0.55" />
          <path d="M100 56 C 120 50, 136 38, 158 24" opacity="0.45" />
          <path d="M102 64 C 112 82, 118 92, 120 108" opacity="0.35" />
          {[56, 88, 122, 156, 184].map((x, index) => (
            <circle key={x} cx={x} cy={54 + Math.sin(index) * 7} r="1.6" fill={color} stroke="none" opacity="0.8" />
          ))}
        </g>
      )}
      {art === 'mycelium' && (
        <g {...common} strokeWidth="1">
          {[
            [110, 58, 58, 24], [110, 58, 36, 90], [110, 58, 164, 30], [110, 58, 180, 78],
            [58, 24, 32, 44], [36, 90, 28, 104], [164, 30, 186, 16], [180, 78, 198, 92],
            [110, 58, 76, 96], [76, 96, 60, 108], [164, 30, 156, 50], [36, 90, 52, 66],
          ].map(([x1, y1, x2, y2], index) => (
            <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} opacity={0.6 - index * 0.025} />
          ))}
          {[
            [110, 58, 4], [58, 24, 2.5], [36, 90, 2.5], [164, 30, 2.5], [180, 78, 2.5],
            [76, 96, 2], [32, 44, 1.8], [28, 104, 1.8], [186, 16, 1.8], [198, 92, 1.8], [60, 108, 1.6],
          ].map(([cx, cy, r], index) => (
            <circle key={index} cx={cx} cy={cy} r={r} fill={color} stroke="none" opacity={0.85 - index * 0.04} />
          ))}
        </g>
      )}
      {art === 'murmuration' && (
        <g fill={color} stroke="none">
          {Array.from({ length: 36 }).map((_, index) => {
            const t = index / 36;
            const x = 34 + t * 150 + Math.sin(index * 1.7) * 20;
            const y = 58 + Math.sin(t * Math.PI * 2) * 24 + Math.cos(index * 1.3) * 8;
            return <circle key={index} cx={x} cy={y} r={index % 7 === 0 ? 2.2 : 1.3} opacity={0.35 + (index % 5) * 0.12} />;
          })}
        </g>
      )}
      {art === 'tardigrade' && (
        <g {...common} strokeWidth="1.2">
          <ellipse cx="110" cy="62" rx="34" ry="22" opacity="0.85" />
          <ellipse cx="110" cy="62" rx="22" ry="14" opacity="0.45" />
          <ellipse cx="110" cy="62" rx="10" ry="6" opacity="0.3" />
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const angle = (index / 6) * Math.PI * 2;
            return (
              <line
                key={index}
                x1={110 + Math.cos(angle) * 30}
                y1={62 + Math.sin(angle) * 19}
                x2={110 + Math.cos(angle) * 48}
                y2={62 + Math.sin(angle) * 34}
                opacity="0.55"
              />
            );
          })}
          <circle cx="110" cy="62" r="48" strokeDasharray="2 6" opacity="0.3" />
        </g>
      )}
      {art === 'coral' && (
        <g {...common} strokeWidth="1.5">
          <path d="M106 104 C 108 86, 104 74, 106 58" opacity="0.8" />
          <path d="M106 78 C 94 72, 88 60, 84 46" opacity="0.7" />
          <path d="M105 70 C 118 64, 124 52, 132 40" opacity="0.7" />
          <path d="M84 46 C 76 42, 72 32, 70 24" opacity="0.5" />
          <path d="M84 46 C 88 36, 90 28, 96 20" opacity="0.5" />
          <path d="M132 40 C 136 30, 144 24, 150 16" opacity="0.5" />
          <path d="M126 48 C 138 48, 146 40, 160 38" opacity="0.4" />
          <path d="M106 90 C 96 88, 88 92, 80 90" opacity="0.45" />
          {[70, 84, 106, 132, 160].map((x, index) => (
            <circle key={x} cx={x} cy={[24, 46, 58, 40, 38][index]} r="2" fill={color} stroke="none" opacity="0.7" />
          ))}
        </g>
      )}
      {art === 'slime' && (
        <g {...common} strokeWidth="1">
          <circle cx="110" cy="58" r="8" opacity="0.5" />
          {Array.from({ length: 10 }).map((_, index) => {
            const angle = (index / 10) * Math.PI * 2;
            const x = 110 + Math.cos(angle) * 48;
            const y = 58 + Math.sin(angle) * 34;
            return (
              <g key={index}>
                <line x1="110" y1="58" x2={x} y2={y} opacity="0.28" strokeDasharray={index % 3 === 0 ? '3 4' : undefined} />
                <circle cx={x} cy={y} r={1.8} fill={color} stroke="none" opacity="0.65" />
              </g>
            );
          })}
          <path d="M110 58 C 78 54, 62 40, 54 22" strokeWidth="1.8" opacity="0.8" />
          <path d="M110 58 C 134 70, 152 84, 166 98" strokeWidth="1.8" opacity="0.8" />
        </g>
      )}
    </svg>
  );
};

export const AtlasScreen: React.FC = () => {
  const { notify } = useWorkspace();
  const [tab, setTab] = useState<AtlasTab>('patterns');
  const [selected, setSelected] = useState<Pattern | null>(null);

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="Atlas · nature, physics & references"
        title={
          <>
            Patterns older than <em>software.</em>
          </>
        }
        description="A reference library for the thinking underneath the console. Nature solved distribution, resilience and coordination long before we built dashboards. These are the patterns KARM borrows from — deliberately."
        meta={
          <>
            <Chip tone="violet" dot>{PATTERNS.length} patterns</Chip>
            <Chip tone="cyan">{CHARTS.length} chart forms</Chip>
            <Chip tone="neutral">Ṛta · living order</Chip>
          </>
        }
        actions={
          <Button onClick={() => notify('Atlas reference pack exported as PDF.', 'info')}>
            <ArrowUpRight size={14} /> Export atlas
          </Button>
        }
      />

      <Panel className="k-reveal relative overflow-hidden p-0">
        <div className="grid lg:grid-cols-[1.4fr_1fr]">
          <div className="relative p-6 md:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(ellipse 75% 90% at 0% 0%, var(--k-violet-soft), transparent 60%), radial-gradient(ellipse 55% 70% at 100% 100%, var(--k-cyan-soft), transparent 68%)',
              }}
            />
            <div className="relative">
              <div className="flex items-center gap-2">
                <Leaf size={12} className="text-[var(--k-violet)]" />
                <span className="k-eyebrow !text-[8.5px] !text-[var(--k-violet)]">the premise</span>
              </div>
              <blockquote className="k-serif mt-4 max-w-[620px] text-[24px] leading-[1.25] text-[var(--k-t1)] md:text-[32px]">
                “A river never fights the rock; it carves through it with persistent, gentle grace.”
              </blockquote>
              <p className="mt-4 max-w-[560px] text-[12px] leading-[1.85] k-muted">
                Ṛta is the order that is recognised rather than imposed. The console follows the same premise: observe the
                real motion of a business — cash, material, people, permissions — and let the decision emerge from the
                pattern, not from a report written last week.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[9px] k-faint">
                <span className="k-mono uppercase tracking-[0.14em]">field note 001</span>
                <span className="h-1 w-1 rounded-full bg-[var(--k-t4)]" />
                <span>KARM × Tesla field</span>
                <span className="h-1 w-1 rounded-full bg-[var(--k-t4)]" />
                <span>Bhopal · IST</span>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center border-t border-[var(--k-line)] p-5 lg:border-l lg:border-t-0">
            <svg viewBox="0 0 320 280" className="h-[230px] w-full max-w-[320px]" aria-hidden="true">
              <defs>
                <radialGradient id="atlas-orb" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="var(--k-violet)" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="var(--k-violet)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="160" cy="140" r="120" fill="url(#atlas-orb)" />
              {[42, 70, 98, 126].map((radius, index) => (
                <ellipse
                  key={radius}
                  cx="160"
                  cy="140"
                  rx={radius}
                  ry={radius * 0.42}
                  fill="none"
                  stroke={index % 2 === 0 ? 'var(--k-cyan)' : 'var(--k-violet)'}
                  strokeOpacity={0.22 - index * 0.03}
                  strokeWidth="1"
                  transform={`rotate(${index * 24 - 18} 160 140)`}
                />
              ))}
              <circle cx="160" cy="140" r="14" fill="var(--k-violet)" opacity="0.18" />
              <circle cx="160" cy="140" r="5" fill="var(--k-violet)" />
              <circle cx="160" cy="140" r="9" fill="none" stroke="var(--k-violet)" strokeOpacity="0.5" />
              <circle cx="88" cy="92" r="2.5" fill="var(--k-cyan)" />
              <circle cx="242" cy="182" r="2.5" fill="var(--k-amber)" />
              <circle cx="234" cy="86" r="2" fill="var(--k-violet)" />
              <circle cx="78" cy="196" r="2" fill="var(--k-cyan)" />
              <path d="M88 92 C 130 110, 150 126, 160 140" stroke="var(--k-cyan)" strokeOpacity="0.3" strokeDasharray="3 5" fill="none" />
              <path d="M242 182 C 200 168, 178 154, 160 140" stroke="var(--k-amber)" strokeOpacity="0.28" strokeDasharray="3 5" fill="none" />
              <text x="160" y="270" textAnchor="middle" fill="var(--k-t4)" fontSize="7" fontFamily="JetBrains Mono">OBSERVE · ORIENT · DECIDE · MOVE</text>
            </svg>
          </div>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(id) => setTab(id as AtlasTab)}
          items={[
            { id: 'patterns', label: 'Patterns', count: PATTERNS.length },
            { id: 'charts', label: 'Chart library', count: CHARTS.length },
            { id: 'notes', label: 'Field notes', count: NOTES.length },
          ]}
        />
        <div className="flex items-center gap-1.5">
          <Chip tone="violet">slow knowledge</Chip>
        </div>
      </div>

      {tab === 'patterns' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PATTERNS.map((pattern) => (
            <Panel
              key={pattern.id}
              className="group cursor-pointer overflow-hidden p-0 transition-transform hover:-translate-y-0.5"
              onClick={() => setSelected(pattern)}
            >
              <div className="relative border-b border-[var(--k-line)] bg-[var(--k-inset)]">
                <PatternArt art={pattern.art} tone={pattern.tone} />
                <span className="absolute left-3 top-3 k-mono text-[7.5px] uppercase tracking-[0.14em]" style={{ color: toneVar(pattern.tone) }}>
                  {pattern.latin}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-[13px] font-bold text-[var(--k-t1)]">{pattern.name}</h3>
                  <ArrowUpRight size={13} className="mt-0.5 shrink-0 text-[var(--k-t4)] transition-transform group-hover:-translate-y-0.5" />
                </div>
                <p className="mt-1.5 k-serif-italic text-[12px] leading-snug text-[var(--k-t2)]">{pattern.principle}</p>
                <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--k-line)] pt-2.5">
                  <Compass size={10} className="text-[var(--k-t3)]" />
                  <span className="text-[9px] k-faint">{pattern.applied}</span>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : null}

      {tab === 'charts' ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CHARTS.map((chart) => (
            <Panel key={chart.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="k-mono text-[8px] uppercase tracking-[0.12em]" style={{ color: toneVar(chart.tone) }}>{chart.kind}</div>
                  <h3 className="mt-1.5 text-[11.5px] font-bold text-[var(--k-t1)]">{chart.name}</h3>
                </div>
                <span className="k-mono text-[8px] k-faint">{chart.id.toUpperCase()}</span>
              </div>
              <div className="mt-3 flex h-[58px] items-end gap-1">
                {chart.data.map((value, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${Math.max(12, (value / Math.max(...chart.data)) * 100)}%`,
                      background: index === chart.data.length - 1 ? toneVar(chart.tone) : `color-mix(in srgb, ${toneVar(chart.tone)} 34%, transparent)`,
                    }}
                  />
                ))}
              </div>
              <p className="mt-3 text-[9px] leading-relaxed k-faint">{chart.detail}</p>
              <button
                onClick={() => notify(`${chart.name} added to the command deck.`, 'success')}
                className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-[var(--k-line)] py-1.5 text-[9px] font-semibold text-[var(--k-t2)] transition-colors hover:border-[var(--k-line-strong)] hover:text-[var(--k-t1)]"
              >
                Use in deck <ArrowUpRight size={9} />
              </button>
            </Panel>
          ))}
          <Panel className="flex flex-col justify-between p-4">
            <div>
              <div className="k-mono text-[8px] uppercase tracking-[0.12em] text-[var(--k-violet)]">principle</div>
              <h3 className="mt-2 k-serif text-[17px] leading-tight text-[var(--k-t1)]">A chart earns its place.</h3>
              <p className="mt-2 text-[9.5px] leading-relaxed k-muted">
                If it does not change a decision, it is decoration. The library keeps only forms that have survived a real
                operating review.
              </p>
            </div>
            <div className="mt-4">
              <SparkBars data={[20, 32, 28, 45, 52, 48, 62]} tone="violet" height={40} />
              <div className="mt-2 text-[8px] k-faint">Decision density, not pixel density.</div>
            </div>
          </Panel>
        </div>
      ) : null}

      {tab === 'notes' ? (
        <div className="grid gap-3 lg:grid-cols-[1.5fr_1fr]">
          <Panel className="overflow-hidden p-0">
            {NOTES.map((note, index) => (
              <button
                key={note.id}
                onClick={() => notify(`“${note.title}” opened in the reading pane.`, 'info')}
                className={cx(
                  'flex w-full items-start gap-4 border-b border-[var(--k-line)] p-5 text-left transition-colors last:border-0 hover:bg-[var(--k-inset)]',
                )}
              >
                <span className="k-mono w-[76px] shrink-0 text-[8.5px] leading-relaxed text-[var(--k-t3)]">{note.date}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--k-violet)]/25 bg-[var(--k-violet-soft)] px-2 py-0.5 text-[7.5px] font-semibold uppercase tracking-[0.1em] text-[var(--k-violet)]">
                      {note.tag}
                    </span>
                    <span className="k-mono text-[8px] k-faint">{note.time} read</span>
                  </span>
                  <span className="mt-2 block k-serif text-[16px] leading-snug text-[var(--k-t1)]">{note.title}</span>
                  <span className="mt-1.5 block text-[10.5px] leading-relaxed k-muted">{note.excerpt}</span>
                </span>
                <span className="k-mono mt-1 shrink-0 text-[8px] text-[var(--k-t4)]">0{index + 1}</span>
              </button>
            ))}
          </Panel>

          <div className="space-y-3">
            <Panel className="p-5">
              <SectionHead eyebrow="Reading room" title="The shelf." />
              <div className="mt-3 space-y-2.5">
                {[
                  { title: 'The Nature of Order', author: 'Christopher Alexander', tag: 'architecture' },
                  { title: 'Thinking in Systems', author: 'Donella Meadows', tag: 'systems' },
                  { title: 'The Uninhabitable Earth', author: 'David Wallace-Wells', tag: 'climate' },
                  { title: 'A Field Guide to Getting Lost', author: 'Rebecca Solnit', tag: 'attention' },
                ].map((book) => (
                  <div key={book.title} className="flex items-start gap-2.5">
                    <BookOpen size={12} className="mt-0.5 shrink-0 text-[var(--k-t3)]" />
                    <div>
                      <div className="text-[10.5px] font-semibold text-[var(--k-t1)]">{book.title}</div>
                      <div className="mt-0.5 text-[8.5px] k-faint">{book.author} · {book.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
            <Panel className="p-5">
              <SectionHead eyebrow="Practice" title="A daily rhythm." />
              <p className="mt-2.5 text-[10.5px] leading-relaxed k-muted">
                Observe before orienting. Orient before deciding. Decide before moving. Move before reporting. The console is
                ordered the same way — signal, then decision, then record.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[var(--k-cyan)]/20 bg-[var(--k-cyan-soft)] px-3 py-2.5">
                <Orbit size={13} className="text-[var(--k-cyan)]" />
                <span className="text-[9px] text-[var(--k-t2)]">One quiet hour before the first dispatch.</span>
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Pattern'}
        eyebrow={selected ? `${selected.latin} · ${selected.applied}` : ''}
        width={560}
      >
        {selected ? (
          <div>
            <div className="rounded-2xl border border-[var(--k-line)] bg-[var(--k-inset)]">
              <PatternArt art={selected.art} tone={selected.tone} />
            </div>
            <p className="mt-4 k-serif text-[18px] leading-snug text-[var(--k-t1)]">“{selected.principle}”</p>
            <p className="mt-3 text-[11.5px] leading-[1.85] k-muted">{selected.detail}</p>
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] px-3 py-2.5">
              <Compass size={12} style={{ color: toneVar(selected.tone) }} />
              <span className="text-[9.5px] k-faint">Applied to</span>
              <span className="text-[10px] font-semibold text-[var(--k-t1)]">{selected.applied}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => notify(`${selected.name} pattern saved to the field notes.`, 'success')}>
                <Feather size={13} /> Save to notes
              </Button>
              <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[8.5px] text-[var(--k-t4)]">
        <span className="flex items-center gap-1.5"><Sparkles size={10} /> Atlas is a curated reference, not an oracle.</span>
        <span className="k-mono uppercase tracking-[0.12em]">KARM · living order · field notes 001–004</span>
      </div>
    </div>
  );
};

export default AtlasScreen;
