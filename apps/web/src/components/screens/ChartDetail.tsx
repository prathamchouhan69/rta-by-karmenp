import React from 'react';
import { useApp } from '../../context/AppContext';
import { CHARTS } from '../../data/charts';
import { CashFlowChart } from '../charts/CashFlowChart';
import { ReceivablesAgingChart } from '../charts/ReceivablesAgingChart';
import { GanttChart } from '../charts/GanttChart';
import { IconCharts, IconCheck } from '../common/Icons';

export const ChartDetail: React.FC = () => {
  const { activeEntityId, goBack } = useApp();
  const chartNum = parseInt(activeEntityId || '1', 10);
  const chart = CHARTS.find(c => c.num === chartNum) || CHARTS[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => goBack()}
          className="type-button text-xs text-purple-400 hover:underline flex items-center gap-1.5"
          aria-label="Return to Charts Library"
        >
          <span>← Back to Charts Library</span>
        </button>
        <span className="type-label text-slate-400">TELEMETRY CHART #{chart.num}</span>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-[#06080d]/90 border border-white/10 space-y-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-950/70 border border-purple-500/30 text-purple-400">
            <IconCharts size={28} color="#7000ff" />
          </div>
          <div>
            <span className="type-label text-purple-400 block mb-1">CHART SPECIFICATION #{chart.num} · {chart.category.toUpperCase()}</span>
            <h1 className="type-display text-2xl md:text-3xl text-white">{chart.title}</h1>
            <p className="type-body-sm text-slate-400 mt-0.5">{chart.subtitle}</p>
          </div>
        </div>

        {/* Live Chart Rendering Surface */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
          {chart.num === 1 ? (
            <CashFlowChart height={280} />
          ) : chart.num === 3 ? (
            <ReceivablesAgingChart height={280} />
          ) : (
            <GanttChart />
          )}
        </div>

        {/* Technical Data Specification */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 font-numeric text-xs">
          <div>
            <span className="type-label text-slate-500 block mb-1">DATA SOURCES</span>
            <span className="text-white font-medium">{chart.data_sources}</span>
          </div>
          <div>
            <span className="type-label text-slate-500 block mb-1">CONNECTED NATURE REF</span>
            <span className="text-cyan-300 font-medium">Ref #{chart.connected_ref}</span>
          </div>
          <div>
            <span className="type-label text-slate-500 block mb-1">MEASUREMENT UNITS</span>
            <span className="text-white font-medium">{chart.units}</span>
          </div>
          <div>
            <span className="type-label text-slate-500 block mb-1">TIME FILTER</span>
            <span className="text-purple-300 font-medium">{chart.time_filter}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
