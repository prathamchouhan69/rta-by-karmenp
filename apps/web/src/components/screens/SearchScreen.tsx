import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { REFERENCES } from '../../data/references';
import {
  IconSearch,
  IconInvoice,
  IconProjects,
  IconTasks,
  IconNature,
  IconFleet,
  IconHR,
  IconCRM
} from '../common/Icons';
import { formatRupees } from '../../utils/formatters';

export const SearchScreen: React.FC = () => {
  const {
    invoices,
    projects,
    tasks,
    vehicles,
    employees,
    clients,
    navigateTo,
    setIsSpotlightOpen
  } = useApp();
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();

  const matchingInvoices = query
    ? invoices.filter(
        i =>
          i.invoice_number.toLowerCase().includes(query) ||
          i.customer_name.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingProjects = query
    ? projects.filter(
        p =>
          p.name.toLowerCase().includes(query) ||
          p.client.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingTasks = query
    ? tasks.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.project_name.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingVehicles = query
    ? vehicles.filter(
        v =>
          v.plate.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query) ||
          v.driver.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingEmployees = query
    ? employees.filter(
        e =>
          e.name.toLowerCase().includes(query) ||
          e.role.toLowerCase().includes(query) ||
          e.department.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingClients = query
    ? clients.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.contact_person.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const matchingRefs = query
    ? REFERENCES.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          r.business.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  const hasAnyResults =
    matchingInvoices.length > 0 ||
    matchingProjects.length > 0 ||
    matchingTasks.length > 0 ||
    matchingVehicles.length > 0 ||
    matchingEmployees.length > 0 ||
    matchingClients.length > 0 ||
    matchingRefs.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex items-start justify-center pt-16 md:pt-24 p-4 animate-fadeIn">
      <div className="w-full max-w-2xl bg-[#070a10] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <IconSearch size={18} color="#00f2fe" />
          <input
            autoFocus
            type="text"
            placeholder="Search invoices, projects, fleet, employees, clients, tasks..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full bg-transparent text-white font-interface text-sm outline-none placeholder-slate-500 font-medium"
            aria-label="Universal search query"
          />
          <button
            onClick={() => setIsSpotlightOpen(false)}
            className="type-label text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10"
          >
            ESC
          </button>
        </div>

        {/* Quick Launch Shortcuts when query is empty */}
        {!query && (
          <div className="py-4 space-y-3 font-interface text-xs">
            <span className="type-label text-slate-500 block">QUICK JUMP MODULES</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => { navigateTo('now'); setIsSpotlightOpen(false); }}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left text-slate-300 hover:text-white transition-all"
              >
                Now · Action Inbox
              </button>
              <button
                onClick={() => { navigateTo('ledger'); setIsSpotlightOpen(false); }}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left text-slate-300 hover:text-white transition-all"
              >
                Ledger · Zoho Books
              </button>
              <button
                onClick={() => { navigateTo('harvest'); setIsSpotlightOpen(false); }}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left text-slate-300 hover:text-white transition-all"
              >
                Harvest · Projects
              </button>
              <button
                onClick={() => { navigateTo('routes'); setIsSpotlightOpen(false); }}
                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-left text-slate-300 hover:text-white transition-all"
              >
                Routes · Fleet
              </button>
            </div>
          </div>
        )}

        {/* Results Stream */}
        {query && (
          <div className="max-h-[60vh] overflow-y-auto space-y-4 font-numeric text-xs pr-1">
            {!hasAnyResults && (
              <p className="text-slate-400 py-6 text-center">
                No matching records found for "{q}".
              </p>
            )}

            {/* Invoices */}
            {matchingInvoices.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-cyan-400 flex items-center gap-1.5">
                  <IconInvoice size={13} color="#00f2fe" /> INVOICES ({matchingInvoices.length})
                </span>
                {matchingInvoices.map(i => (
                  <div
                    key={i.id}
                    onClick={() => { navigateTo('invoice_detail', i.id); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-cyan-300 transition-colors">
                      {i.invoice_number} · {i.customer_name}
                    </span>
                    <span className="type-financial text-cyan-300">{formatRupees(i.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {matchingProjects.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-purple-400 flex items-center gap-1.5">
                  <IconProjects size={13} color="#a855f7" /> PROJECTS ({matchingProjects.length})
                </span>
                {matchingProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => { navigateTo('project_detail', p.id); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-purple-300 transition-colors">
                      {p.name} ({p.client})
                    </span>
                    <span className="type-financial text-purple-300">{p.progress}%</span>
                  </div>
                ))}
              </div>
            )}

            {/* Fleet Vehicles */}
            {matchingVehicles.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-amber-400 flex items-center gap-1.5">
                  <IconFleet size={13} color="#f59e0b" /> FLEET VEHICLES ({matchingVehicles.length})
                </span>
                {matchingVehicles.map(v => (
                  <div
                    key={v.id}
                    onClick={() => { navigateTo('fleet_detail', v.id); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-amber-300 transition-colors">
                      {v.plate} · {v.model} ({v.driver})
                    </span>
                    <span className="type-label text-amber-300">{v.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Workforce Employees */}
            {matchingEmployees.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-sky-400 flex items-center gap-1.5">
                  <IconHR size={13} color="#38bdf8" /> WORKFORCE ({matchingEmployees.length})
                </span>
                {matchingEmployees.map(e => (
                  <div
                    key={e.id}
                    onClick={() => { navigateTo('employee_detail', e.id); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-sky-300 transition-colors">
                      {e.name} · {e.role} ({e.department})
                    </span>
                    <span className="type-label text-slate-400">{e.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clients */}
            {matchingClients.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-cyan-400 flex items-center gap-1.5">
                  <IconCRM size={13} color="#00f2fe" /> CLIENTS ({matchingClients.length})
                </span>
                {matchingClients.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { navigateTo('client_detail', c.id); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-cyan-300 transition-colors">
                      {c.name} · {c.contact_person}
                    </span>
                    <span className="type-financial text-cyan-300">{formatRupees(c.deal_value, true)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tasks */}
            {matchingTasks.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-sky-400 flex items-center gap-1.5">
                  <IconTasks size={13} color="#22d3ee" /> TASKS ({matchingTasks.length})
                </span>
                {matchingTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => { navigateTo('task_detail', t.id); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-emerald-300 transition-colors">
                      {t.title}
                    </span>
                    <span className="type-label text-slate-400">{t.status.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* References */}
            {matchingRefs.length > 0 && (
              <div className="space-y-1.5">
                <span className="type-label text-pink-400 flex items-center gap-1.5">
                  <IconNature size={13} color="#f472b6" /> SCIENTIFIC MODELS ({matchingRefs.length})
                </span>
                {matchingRefs.map(r => (
                  <div
                    key={r.num}
                    onClick={() => { navigateTo('now'); setIsSpotlightOpen(false); }}
                    className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] cursor-pointer text-white flex justify-between items-center transition-colors group"
                  >
                    <span className="font-interface group-hover:text-pink-300 transition-colors">
                      REF #{String(r.num).padStart(3, '0')} · {r.name}
                    </span>
                    <span className="type-caption text-slate-400">{r.category}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
