import React from 'react';

export interface SlimeMoldNetworkProps {
  nodes?: { id: string; label: string; x: number; y: number; active?: boolean }[];
  connections?: [string, string][]; // Pairs of node IDs
  title?: string;
  highlightOptimal?: boolean;
}

const DEFAULT_NODES = [
  { id: 'wh', label: 'Central Hub', x: 200, y: 80, active: true },
  { id: 'site_a', label: 'Site Alpha', x: 60, y: 40, active: true },
  { id: 'site_b', label: 'Site Beta', x: 80, y: 120, active: true },
  { id: 'site_c', label: 'Site Gamma', x: 330, y: 40, active: false },
  { id: 'site_d', label: 'Site Delta', x: 340, y: 120, active: true },
];

const DEFAULT_CONNECTIONS: [string, string][] = [
  ['wh', 'site_a'],
  ['wh', 'site_b'],
  ['wh', 'site_d'],
  ['site_a', 'site_b'],
  ['wh', 'site_c'],
];

export const SlimeMoldNetwork: React.FC<SlimeMoldNetworkProps> = ({
  nodes = DEFAULT_NODES,
  connections = DEFAULT_CONNECTIONS,
  title = "Slime Mold Optimal Network",
  highlightOptimal = true
}) => {
  return (
    <div className="p-4 rounded-xl border border-yellow-500/20 bg-[#0c0d12]/90 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-white">{title}</h4>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-yellow-950 text-yellow-300 border border-yellow-500/30">
            Ref #76 Physarum Polycephalum
          </span>
        </div>
        <span className="text-[10px] font-mono text-yellow-400">Nutrient Pipeline: Converged</span>
      </div>

      {/* Network Canvas Visualization */}
      <div className="relative h-44 w-full bg-black/60 rounded-xl border border-white/5 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 400 160">
          <defs>
            <filter id="slimeGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Tubes / Connections */}
          {connections.map(([srcId, dstId], i) => {
            const src = nodes.find(n => n.id === srcId);
            const dst = nodes.find(n => n.id === dstId);
            if (!src || !dst) return null;
            return (
              <g key={i}>
                <line
                  x1={src.x}
                  y1={src.y}
                  x2={dst.x}
                  y2={dst.y}
                  stroke={highlightOptimal ? "#eab308" : "#475569"}
                  strokeWidth={highlightOptimal ? 2.5 : 1}
                  strokeDasharray={highlightOptimal ? "4 2" : "none"}
                  filter={highlightOptimal ? "url(#slimeGlow)" : "none"}
                  opacity="0.8"
                />
              </g>
            );
          })}
          {/* Nutrient Nodes */}
          {nodes.map(n => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.active ? 6 : 4}
                fill={n.active ? "#facc15" : "#64748b"}
                stroke="#000"
                strokeWidth="1.5"
                filter={n.active ? "url(#slimeGlow)" : "none"}
              />
              <text
                x={n.x}
                y={n.y - 9}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="9"
                fontFamily="monospace"
              >
                {n.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <p className="text-[11px] text-slate-400 font-mono">
        Self-healing routing dynamically prunes inefficient transport loops and reinforces shortest paths.
      </p>
    </div>
  );
};
