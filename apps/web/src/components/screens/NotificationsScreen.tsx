import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IconBell, IconAlert, IconCheck, IconSync, IconZohoBooks, IconCalendar } from '../common/Icons';

export const NotificationsScreen: React.FC = () => {
  const { notifications, clearNotifications } = useApp();
  const [filter, setFilter] = useState<'all' | 'critical' | 'info'>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.severity === filter;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="type-flux-technical text-cyan-400">RTA TELEMETRY STREAM</span>
            <span className="text-[10px] text-slate-500 font-mono">/</span>
            <span className="text-[10px] text-slate-400 font-mono">UK STAMPED</span>
          </div>
          <h1 className="type-h2 text-white">Notifications & Alerts</h1>
          <p className="type-body-sm text-slate-400 mt-1">
            Real-time telemetry alerts from Zoho Books, Google Workspace & KARM autonomous system monitors.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white/[0.03] border border-white/[0.08] p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filter === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filter === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filter === 'info' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Info
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={() => clearNotifications?.()}
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#07090e]/80 border border-white/[0.08] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
              <IconBell className="w-6 h-6" />
            </div>
            <p className="type-body text-white font-medium">All telemetry channels clear</p>
            <p className="type-caption text-slate-500">No active alerts matching your current filter criteria.</p>
          </div>
        ) : (
          filtered.map(n => {
            const isCritical = n.severity === 'critical';
            return (
              <div
                key={n.id}
                className={`p-4 md:p-5 rounded-2xl bg-[#070a0e]/95 border transition-all duration-200 flex items-start gap-4 ${
                  isCritical
                    ? 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.06)]'
                    : 'border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isCritical
                      ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                      : 'bg-sky-500/10 border border-sky-500/30 text-sky-400'
                  }`}
                >
                  {isCritical ? <IconAlert className="w-5 h-5" /> : <IconBell className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <h3 className="type-body text-white font-semibold">{n.title}</h3>
                      <span
                        className={`type-flux-technical px-2 py-0.5 rounded-md border ${
                          isCritical
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                            : 'bg-sky-950/60 text-sky-300 border-sky-800/40'
                        }`}
                      >
                        {n.severity.toUpperCase()}
                      </span>
                    </div>
                    <span className="type-timestamp text-slate-400">{n.timestamp}</span>
                  </div>

                  <p className="type-body-sm text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <IconSync className="w-3 h-3 text-cyan-400" /> Auto-synced
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <IconCheck className="w-3 h-3 text-sky-400" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
