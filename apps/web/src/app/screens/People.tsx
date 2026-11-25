import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  MapPin,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import { useWorkspace } from '../workspace';
import {
  Avatar,
  Button,
  Chip,
  Modal,
  PageHeader,
  Panel,
  Progress,
  SearchField,
  SectionHead,
  StatusChip,
  Tabs,
  toneVar,
} from '../ui';
import { cx, longDate, shortDate } from '../format';
import type { TeamMember } from '../types';

type PeopleTab = 'team' | 'capacity' | 'field';

function loadTone(load: number): 'cyan' | 'amber' | 'rose' {
  if (load >= 85) return 'rose';
  if (load >= 72) return 'amber';
  return 'cyan';
}

export const PeopleScreen: React.FC = () => {
  const { snapshot, notify } = useWorkspace();
  const [tab, setTab] = useState<PeopleTab>('team');
  const [query, setQuery] = useState('');
  const [pod, setPod] = useState('All');
  const [selected, setSelected] = useState<TeamMember | null>(null);

  const pods = useMemo(() => Array.from(new Set(snapshot.team.map((member) => member.pod))), [snapshot.team]);
  const filtered = snapshot.team
    .filter((member) => pod === 'All' || member.pod === pod)
    .filter((member) => !query.trim() || `${member.name} ${member.role} ${member.pod} ${member.location}`.toLowerCase().includes(query.trim().toLowerCase()));

  const onsite = snapshot.team.filter((member) => member.status === 'onsite');
  const avgLoad = Math.round(snapshot.team.reduce((sum, member) => sum + member.load, 0) / Math.max(1, snapshot.team.length));
  const overloaded = snapshot.team.filter((member) => member.load >= 84);
  const selectedProject = selected ? snapshot.projects.find((project) => project.lead === selected.name) : undefined;

  return (
    <div className="space-y-5 xl:space-y-6">
      <PageHeader
        eyebrow="People · team and load"
        title={
          <>
            The work is done by <em>people</em>, not pods.
          </>
        }
        description="Who is on site, who is carrying too much, and who can take the next decision. Load is a judgement signal, not a timesheet."
        meta={
          <>
            <Chip tone="cyan" dot>{onsite.length} on site</Chip>
            <Chip tone="neutral">{snapshot.team.length} in the workspace</Chip>
            <Chip tone="amber">{overloaded.length} above 84% load</Chip>
          </>
        }
        actions={
          <>
            <Button onClick={() => notify('Team roster export queued.', 'info')}>
              <ArrowUpRight size={14} /> Export roster
            </Button>
            <Button variant="primary" onClick={() => notify('Invite flow opened for a new team member.', 'info')}>
              <Plus size={14} /> Invite person
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: 'Team size', value: String(snapshot.team.length), hint: '5 pods · 2 locations', tone: 'cyan' as const },
          { label: 'Average load', value: `${avgLoad}%`, hint: 'Against a 100% week', tone: 'violet' as const },
          { label: 'Field presence', value: `${Math.round((onsite.length / Math.max(1, snapshot.team.length)) * 100)}%`, hint: `${snapshot.team.filter((member) => member.status === 'remote').length} remote today`, tone: 'amber' as const },
          { label: 'Open capacity', value: `${100 - avgLoad}%`, hint: 'Before adding new work', tone: 'sage' as const },
        ].map((stat) => (
          <Panel key={stat.label} className="k-reveal p-4">
            <div className="flex items-center justify-between">
              <span className="k-label">{stat.label}</span>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: toneVar(stat.tone) }} />
            </div>
            <div className="mt-2.5 k-number-hero text-[24px] text-[var(--k-t1)]">{stat.value}</div>
            <div className="mt-1.5 text-[10px] k-faint">{stat.hint}</div>
          </Panel>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          active={tab}
          onChange={(id) => setTab(id as PeopleTab)}
          items={[
            { id: 'team', label: 'Team', count: snapshot.team.length },
            { id: 'capacity', label: 'Capacity' },
            { id: 'field', label: 'Field presence' },
          ]}
        />
        <SearchField value={query} onChange={setQuery} placeholder="Find a person or role…" className="w-full sm:w-[280px]" />
      </div>

      {tab === 'team' ? (
        <>
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', ...pods].map((value) => (
              <button
                key={value}
                onClick={() => setPod(value)}
                className={cx(
                  'rounded-full border px-3 py-1.5 text-[9.5px] font-semibold transition-colors',
                  pod === value
                    ? 'border-[var(--k-cyan)]/30 bg-[var(--k-cyan-soft)] text-[var(--k-cyan)]'
                    : 'border-[var(--k-line)] text-[var(--k-t3)] hover:text-[var(--k-t1)]',
                )}
              >
                {value}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((member) => (
              <Panel
                key={member.id}
                className="group cursor-pointer p-4 transition-transform hover:-translate-y-0.5"
                onClick={() => setSelected(member)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={member.name} size={38} tone={member.load >= 84 ? 'amber' : 'violet'} />
                    <div className="min-w-0">
                      <div className="truncate text-[12px] font-bold text-[var(--k-t1)]">{member.name}</div>
                      <div className="mt-0.5 truncate text-[9px] k-faint">{member.role}</div>
                    </div>
                  </div>
                  <StatusChip status={member.status} />
                </div>

                <div className="mt-3 flex items-center justify-between text-[9px] k-faint">
                  <span className="flex items-center gap-1"><MapPin size={9} /> {member.location}</span>
                  <span>{member.pod}</span>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="k-faint">load</span>
                    <span className="k-mono font-semibold" style={{ color: toneVar(loadTone(member.load)) }}>{member.load}%</span>
                  </div>
                  <Progress value={member.load} tone={loadTone(member.load)} className="mt-1" />
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {member.skills.slice(0, 2).map((skill) => (
                    <span key={skill} className="rounded-full border border-[var(--k-line)] bg-[var(--k-inset)] px-2 py-0.5 text-[8px] k-faint">
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 2 ? (
                    <span className="px-1 py-0.5 text-[8px] k-faint">+{member.skills.length - 2}</span>
                  ) : null}
                </div>
              </Panel>
            ))}
          </div>
          {filtered.length === 0 ? (
            <Panel className="p-8 text-center text-[11px] k-faint">No one matches this filter.</Panel>
          ) : null}
        </>
      ) : null}

      {tab === 'capacity' ? (
        <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
          <Panel className="p-5">
            <SectionHead eyebrow="Pods" title="Load, by the group that carries it." />
            <div className="mt-4 space-y-3.5">
              {pods.map((podName) => {
                const members = snapshot.team.filter((member) => member.pod === podName);
                const podLoad = Math.round(members.reduce((sum, member) => sum + member.load, 0) / Math.max(1, members.length));
                return (
                  <div key={podName}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-[var(--k-t1)]">
                        <span
                          className="flex h-6 w-6 items-center justify-center rounded-md"
                          style={{ background: 'var(--k-inset)', color: toneVar(loadTone(podLoad)) }}
                        >
                          <BriefcaseBusiness size={11} />
                        </span>
                        {podName}
                        <span className="k-mono text-[8.5px] font-normal k-faint">{members.length} people</span>
                      </span>
                      <span className="k-mono text-[10px] font-semibold" style={{ color: toneVar(loadTone(podLoad)) }}>{podLoad}%</span>
                    </div>
                    <Progress value={podLoad} tone={loadTone(podLoad)} className="mt-1.5" />
                    <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                      {members.map((member) => (
                        <span key={member.id} className="text-[8.5px] k-faint">{member.name.split(' ')[0]} {member.load}%</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <div className="space-y-3">
            <Panel className="p-5">
              <SectionHead eyebrow="Overloaded" title="Where the queue is personal." />
              <div className="mt-3 space-y-2">
                {overloaded.map((member) => (
                  <div key={member.id} className="flex items-center justify-between rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={member.name} size={28} tone="amber" />
                      <div>
                        <div className="text-[10.5px] font-semibold text-[var(--k-t1)]">{member.name}</div>
                        <div className="mt-0.5 text-[8.5px] k-faint">{member.role}</div>
                      </div>
                    </div>
                    <span className="k-num text-[12px] font-semibold text-[var(--k-amber)]">{member.load}%</span>
                  </div>
                ))}
              </div>
              <Button className="mt-3 w-full" size="sm" onClick={() => notify('Rebalance proposal drafted for the civil delivery pod.', 'info')}>
                Rebalance the week
              </Button>
            </Panel>
            <Panel className="p-5">
              <SectionHead eyebrow="Decision" title="What load actually means." />
              <p className="mt-2.5 text-[10.5px] leading-relaxed k-muted">
                Load above 84% is not a badge. It means the person is one site problem away from dropping a commitment.
                Shift the measurement review from Arjun to Priya, and keep Sneha out of new tenders this week.
              </p>
            </Panel>
          </div>
        </div>
      ) : null}

      {tab === 'field' ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[
            { site: 'NH-46 · pier 11', people: snapshot.team.filter((member) => member.location.includes('NH-46')), tone: 'cyan' as const },
            { site: 'Bhopal Metro · V4', people: snapshot.team.filter((member) => member.location.includes('Karond') || member.location.includes('Bhopal')), tone: 'violet' as const },
            { site: 'Kolar quarry', people: snapshot.team.filter((member) => member.location.includes('Kolar')), tone: 'amber' as const },
            { site: 'Mandideep pad', people: snapshot.team.filter((member) => member.location.includes('Mandideep')), tone: 'sage' as const },
          ].map((group) => (
            <Panel key={group.site} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="k-eyebrow !text-[8px]">{group.site}</div>
                  <div className="mt-1.5 text-[13px] font-bold text-[var(--k-t1)]">{group.people.length} present</div>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${toneVar(group.tone)} 12%, transparent)`, color: toneVar(group.tone) }}>
                  <Users size={15} />
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {group.people.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelected(member)}
                    className="flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-left hover:bg-[var(--k-inset)]"
                  >
                    <span className="flex items-center gap-2">
                      <Avatar name={member.name} size={24} tone={group.tone} />
                      <span>
                        <span className="block text-[10px] font-semibold text-[var(--k-t1)]">{member.name}</span>
                        <span className="block text-[8.5px] k-faint">{member.role}</span>
                      </span>
                    </span>
                    <StatusChip status={member.status} />
                  </button>
                ))}
                {group.people.length === 0 ? (
                  <p className="py-2 text-[10px] k-faint">No one assigned here today.</p>
                ) : null}
              </div>
            </Panel>
          ))}
        </div>
      ) : null}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name ?? 'Team member'}
        eyebrow={selected ? `${selected.role} · ${selected.pod}` : ''}
        width={520}
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} size={52} tone="violet" />
              <div>
                <div className="text-[14px] font-bold text-[var(--k-t1)]">{selected.name}</div>
                <div className="mt-0.5 text-[10px] k-faint">{selected.role}</div>
                <div className="mt-1.5 flex items-center gap-2">
                  <StatusChip status={selected.status} />
                  <Chip tone={loadTone(selected.load)}>{selected.load}% load</Chip>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                <div className="k-eyebrow !text-[8px]">location</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-[var(--k-t1)]"><MapPin size={11} /> {selected.location}</div>
              </div>
              <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                <div className="k-eyebrow !text-[8px]">joined</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-[var(--k-t1)]"><CalendarDays size={11} /> {longDate(selected.joined)}</div>
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">contact</div>
              <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-[11px] text-[var(--k-cyan)] hover:underline">
                <Phone size={12} /> {selected.phone}
              </a>
            </div>

            <div>
              <div className="k-rule mb-2">skills</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-[var(--k-line)] bg-[var(--k-inset)] px-2.5 py-1 text-[9px] text-[var(--k-t2)]">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="k-rule mb-2">currently leading</div>
              {selectedProject ? (
                <div className="rounded-xl border border-[var(--k-line)] bg-[var(--k-inset)] p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-[var(--k-t1)]">{selectedProject.name}</div>
                      <div className="mt-0.5 text-[9px] k-faint">{selectedProject.code} · {shortDate(selectedProject.end)}</div>
                    </div>
                    <span className="k-num text-[13px] font-semibold text-[var(--k-cyan)]">{selectedProject.progress}%</span>
                  </div>
                  <Progress value={selectedProject.progress} tone="cyan" className="mt-2" />
                </div>
              ) : (
                <p className="text-[10.5px] k-faint">No single project lead assignment. Supporting the operating pods.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => notify(`Message sent to ${selected.name}.`, 'success')}>
                Send a note
              </Button>
              <Button onClick={() => notify(`Load review opened for ${selected.name}.`, 'info')}>
                Review load
              </Button>
            </div>
            <p className="text-[9px] k-faint">
              Personal contact detail is visible to the workspace owner only. It is never included in exports.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default PeopleScreen;
