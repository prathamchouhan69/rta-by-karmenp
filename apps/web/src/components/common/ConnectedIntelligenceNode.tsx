import React, { useState, useRef, useEffect } from 'react';
import { CalculusCard } from './CalculusCard';

export interface ConnectedIntelligenceNodeProps {
  id: string;
  referenceNumber: number;
  videoFilename?: string;
  title: string;
  conceptName: string;
  businessContext: string;
  impactMetrics: { label: string; value: string; trend?: string }[];
  calculusDeriv: string;
  calculusEli5: string;
  actionButtonText: string;
  actionBadge?: string;
  onAction?: () => void;
  interactiveType?: 'blackhole' | 'antcolony' | 'slimemold' | 'jellyfish' | 'starling' | 'teslacoil' | 'tardigrade';
  chartSlot?: React.ReactNode;
}

export const ConnectedIntelligenceNode: React.FC<ConnectedIntelligenceNodeProps> = ({
  id,
  referenceNumber,
  videoFilename,
  title,
  conceptName,
  businessContext,
  impactMetrics,
  calculusDeriv,
  calculusEli5,
  actionButtonText,
  actionBadge = 'KARM Heuristic',
  onAction,
  interactiveType = 'blackhole',
  chartSlot
}) => {
  // Motion states: 'try' (interactive canvas/controls), 'replay' (video motion), 'still' (calm static blueprint)
  const [viewMode, setViewMode] = useState<'try' | 'replay' | 'still'>('try');
  const [actionTriggered, setActionTriggered] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Handle video replay trigger
  const handleReplay = () => {
    setViewMode('replay');
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  // Canvas simulation for 'try' mode
  useEffect(() => {
    if (viewMode !== 'try' && viewMode !== 'still') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      if (interactiveType === 'blackhole') {
        // Gravitational Risk Horizon & Accretion Ingestion
        ctx.fillStyle = '#05070c';
        ctx.fillRect(0, 0, w, h);

        // Gravitational rings
        for (let r = 80; r > 15; r -= 14) {
          ctx.beginPath();
          ctx.arc(cx, cy, r + Math.sin(t * 0.05 + r) * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(239, 68, 68, ${0.12 + (80 - r) / 200})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Event Horizon core
        const coreGradient = ctx.createRadialGradient(cx, cy, 2, cx, cy, 28);
        coreGradient.addColorStop(0, '#000000');
        coreGradient.addColorStop(0.7, '#180305');
        coreGradient.addColorStop(1, 'rgba(239, 68, 68, 0.4)');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, 0, Math.PI * 2);
        ctx.fill();

        // Debt particles spiraling in
        for (let i = 0; i < 7; i++) {
          const angle = (t * 0.04 * (i + 1) * 0.3) + (i * Math.PI / 3.5);
          const dist = 70 - ((t * 0.4 + i * 15) % 55);
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = dist < 25 ? '#ef4444' : '#38bdf8';
          ctx.shadowBlur = 8;
          ctx.shadowColor = dist < 25 ? '#ef4444' : '#38bdf8';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else if (interactiveType === 'antcolony') {
        // Ant Colony Pheromone Trails
        ctx.fillStyle = '#060a10';
        ctx.fillRect(0, 0, w, h);

        // Pheromone path between quarry and sites
        ctx.beginPath();
        ctx.moveTo(30, cy - 20);
        ctx.bezierCurveTo(w * 0.4, cy - 40, w * 0.6, cy + 30, w - 30, cy);
        ctx.strokeStyle = 'rgba(0, 242, 254, 0.35)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Pheromone particles (ants returning with resources)
        for (let i = 0; i < 5; i++) {
          const progress = ((t * 0.02 + i * 0.2) % 1);
          const px = 30 + progress * (w - 60);
          const py = cy - 20 + Math.sin(progress * Math.PI) * 20;
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#00f2fe';
          ctx.fill();
        }
      } else if (interactiveType === 'slimemold') {
        // Slime Mold Transport Network
        ctx.fillStyle = '#060a0f';
        ctx.fillRect(0, 0, w, h);

        // Nodes
        const nodes = [
          { x: 30, y: 30, label: 'Quarry' },
          { x: w - 30, y: 40, label: 'Batching Plant' },
          { x: w * 0.5, y: h - 25, label: 'Highway Site' }
        ];

        // Veins pulsating
        nodes.forEach((n, idx) => {
          const next = nodes[(idx + 1) % nodes.length];
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(next.x, next.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.25 + Math.sin(t * 0.05 + idx) * 0.15})`;
          ctx.lineWidth = 2 + Math.sin(t * 0.08 + idx) * 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.fill();
        });
      } else if (interactiveType === 'teslacoil') {
        // Tesla 3-Phase Induction Field
        ctx.fillStyle = '#05070e';
        ctx.fillRect(0, 0, w, h);

        // 3 Poles rotating
        for (let pole = 0; pole < 3; pole++) {
          const pAngle = (t * 0.05) + (pole * (Math.PI * 2 / 3));
          const px = cx + Math.cos(pAngle) * 45;
          const py = cy + Math.sin(pAngle) * 45;

          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = `rgba(0, 242, 254, ${0.2 + (pole === 0 ? 0.3 : 0)})`;
          ctx.lineWidth = pole === 0 ? 2 : 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = pole === 0 ? '#00f2fe' : '#7000ff';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00f2fe';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else {
        // Default Tardigrade / Cellular Resilient Shield
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, w, h);
        ctx.beginPath();
        ctx.arc(cx, cy, 35, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 18 + Math.sin(t * 0.03) * 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(112, 0, 255, 0.25)';
        ctx.fill();
      }

      if (viewMode === 'try') {
        t += 1;
        animFrame = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [viewMode, interactiveType]);

  const handleAction = () => {
    setActionTriggered(true);
    setActionFeedback('KARM Intelligence executed. Live Zoho state updated.');
    if (onAction) onAction();
    setTimeout(() => {
      setActionFeedback(null);
    }, 4000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080c14]/90 backdrop-blur-xl p-5 shadow-2xl relative overflow-hidden group hover:border-cyan-500/30 transition-all">
      {/* Top Header: Connected Reference Badge & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-xs text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.15)]">
            REF #{referenceNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="type-h4 text-sm font-bold text-white tracking-tight">{title}</h3>
              <span className="type-label text-[9px] px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30">
                {actionBadge}
              </span>
            </div>
            <p className="type-timestamp text-slate-400 mt-0.5">{conceptName}</p>
          </div>
        </div>

        {/* 3-State Motion Controls: [Try Interactive] [Replay Video] [Still Blueprint] */}
        <div className="flex items-center gap-1 bg-black/40 border border-white/10 rounded-xl p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('try')}
            className={`px-2.5 py-1 text-[11px] font-interface font-medium rounded-lg transition-all ${
              viewMode === 'try'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,242,254,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Interactive model simulation"
          >
            Try It
          </button>
          <button
            onClick={handleReplay}
            className={`px-2.5 py-1 text-[11px] font-interface font-medium rounded-lg transition-all ${
              viewMode === 'replay'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Replay master recording video"
          >
            Replay Motion
          </button>
          <button
            onClick={() => setViewMode('still')}
            className={`px-2.5 py-1 text-[11px] font-interface font-medium rounded-lg transition-all ${
              viewMode === 'still'
                ? 'bg-white/15 text-white border border-white/30'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Freeze to static blueprint"
          >
            Still
          </button>
        </div>
      </div>

      {/* Main Body: Real Business Context + Visual Motion Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 items-center">
        {/* Left Col: Real Business Impact & Live Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <p className="type-body text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <span className="font-semibold text-white">Live Business Action: </span>
            {businessContext}
          </p>

          {/* Impact Metrics Stream */}
          <div className="grid grid-cols-3 gap-2">
            {impactMetrics.map((metric, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-black/40 border border-white/5">
                <span className="type-label text-[9px] text-slate-400 block">{metric.label}</span>
                <span className="type-data text-xs font-bold text-white mt-0.5 block">{metric.value}</span>
                {metric.trend && (
                  <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">{metric.trend}</span>
                )}
              </div>
            ))}
          </div>

          {/* Direct Interactive Action Button */}
          <div className="pt-2">
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-950/80 via-blue-950/60 to-purple-950/70 border border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:text-white font-interface font-semibold text-xs transition-all active:scale-98 shadow-[0_0_16px_rgba(0,242,254,0.12)]"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2fe]" />
                <span>{actionButtonText}</span>
              </div>
              <span className="font-mono text-[10px] text-cyan-400/80">RUN ACTION →</span>
            </button>
            {actionFeedback && (
              <p className="type-timestamp text-[11px] text-cyan-300 mt-2 flex items-center gap-1.5 animate-fadeIn">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {actionFeedback}
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Visual Motion Stage (5 cols) */}
        <div className="lg:col-span-5 h-[160px] rounded-xl border border-white/10 bg-black/60 relative overflow-hidden flex items-center justify-center">
          {viewMode === 'replay' && videoFilename ? (
            <video
              ref={videoRef}
              src={`/references/videos/${videoFilename}`}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <canvas
              ref={canvasRef}
              width={260}
              height={160}
              className="w-full h-full object-contain"
            />
          )}

          {/* Mode Watermark Overlay */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[9px] font-mono text-slate-400 backdrop-blur-md">
            {viewMode === 'replay' ? 'MP4 RECORDING' : viewMode === 'try' ? 'LIVE HEURISTIC' : 'STILL BLUEPRINT'}
          </div>
        </div>
      </div>

      {/* Expandable Calculus Breakdown (ELI5 + Mathematical Slope) */}
      <div className="mt-4 pt-3 border-t border-white/5">
        <CalculusCard
          title={`${title} Rate of Change`}
          metricLabel={conceptName}
          rateOfChange={impactMetrics[0]?.value || 'Dynamic'}
          plainStory={calculusEli5}
          formalDerivative={calculusDeriv}
          trend="accelerating"
        />
      </div>

      {/* Optional Integrated Chart Slot */}
      {chartSlot && (
        <div className="mt-4 pt-3 border-t border-white/5">
          {chartSlot}
        </div>
      )}
    </div>
  );
};
