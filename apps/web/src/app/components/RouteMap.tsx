import React, { useRef, useEffect, useState } from 'react';
import { cx } from '../format';
import { IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight, IconMapPin, IconTruck, IconHome, IconBuilding2 } from '../../components/common/Icons';

interface MapNode {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: 'hub' | 'site' | 'port' | 'depot';
  status: 'optimal' | 'warning' | 'critical' | 'idle';
  metadata: Array<{ label: string; value: string }>;
}

interface RouteMapProps {
  nodes: MapNode[];
  routes?: Array<{ from: string; to: string; status: 'active' | 'planned' | 'delayed' }>;
  selectedNodeId?: string;
  onNodeSelect?: (node: MapNode) => void;
  className?: string;
  height?: number;
}

const NODE_COLORS = {
  hub: { bg: 'var(--k-cyan)', border: 'var(--k-cyan-deep)', icon: IconBuilding2 },
  site: { bg: 'var(--k-amber)', border: 'var(--k-amber-soft)', icon: IconHome },
  port: { bg: 'var(--k-violet)', border: 'var(--k-violet-deep)', icon: IconBuilding2 },
  depot: { bg: 'var(--k-positive)', border: 'var(--k-positive-soft)', icon: IconTruck },
};

const STATUS_COLORS = {
  optimal: 'var(--k-cyan)',
  warning: 'var(--k-amber)',
  critical: 'var(--k-rose)',
  idle: 'var(--k-t3)',
};

export const RouteMap: React.FC<RouteMapProps> = ({
  nodes,
  routes = [],
  selectedNodeId,
  onNodeSelect,
  className,
  height = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<MapNode | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    const project = (lat: number, lng: number) => {
      // Simple equirectangular projection
      const padding = 60;
      const x = ((lng + 180) / 360) * (width - padding * 2) + padding;
      const y = ((90 - lat) / 180) * (height - padding * 2) + padding;
      return { x, y };
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.02)';
      ctx.lineWidth = 0.5;
      const gridSize = 50;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw routes
      routes.forEach(route => {
        const fromNode = nodes.find(n => n.id === route.from);
        const toNode = nodes.find(n => n.id === route.to);
        if (!fromNode || !toNode) return;

        const from = project(fromNode.lat, fromNode.lng);
        const to = project(toNode.lat, toNode.lng);

        const routeColor = route.status === 'active' ? 'var(--k-cyan)' :
                          route.status === 'planned' ? 'var(--k-violet)' : 'var(--k-rose)';

        ctx.strokeStyle = routeColor;
        ctx.lineWidth = route.status === 'active' ? 2.5 : 1.5;
        ctx.setLineDash(route.status === 'planned' ? [8, 6] : route.status === 'delayed' ? [4, 4] : []);
        ctx.lineCap = 'round';

        // Curved path
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2 - 60;
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(midX, midY, to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Arrow head
        const angle = Math.atan2(to.y - midY, to.x - midX);
        const arrowSize = 10;
        ctx.fillStyle = routeColor;
        ctx.beginPath();
        ctx.moveTo(to.x, to.y);
        ctx.lineTo(
          to.x - arrowSize * Math.cos(angle - Math.PI / 6),
          to.y - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          to.x - arrowSize * Math.cos(angle + Math.PI / 6),
          to.y - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      });

      // Draw nodes
      nodes.forEach(node => {
        const pos = project(node.lat, node.lng);
        const isSelected = node.id === selectedNodeId;
        const isHovered = hoveredNode?.id === node.id;
        const nodeConfig = NODE_COLORS[node.type];
        const statusColor = STATUS_COLORS[node.status];

        // Pulse for active status
        const pulseScale = node.status === 'optimal' ? 1 + Math.sin(Date.now() / 500) * 0.1 : 1;

        // Connection lines to other nodes (subtle)
        nodes.forEach(other => {
          if (other.id === node.id) return;
          const otherPos = project(other.lat, other.lng);
          const dist = Math.hypot(pos.x - otherPos.x, pos.y - otherPos.y);
          if (dist < 200) {
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.03 * (1 - dist / 200)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(otherPos.x, otherPos.y);
            ctx.stroke();
          }
        });

        // Node circle
        const radius = 14 * pulseScale;
        
        // Outer glow for selected/hovered
        if (isSelected || isHovered) {
          ctx.shadowColor = isSelected ? 'var(--k-cyan)' : 'var(--k-violet)';
          ctx.shadowBlur = isSelected ? 24 : 16;
        }

        // Main circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeConfig.bg;
        ctx.fill();

        // Border
        ctx.strokeStyle = isSelected ? 'var(--k-cyan)' : (isHovered ? 'var(--k-violet)' : nodeConfig.border);
        ctx.lineWidth = isSelected ? 3 : (isHovered ? 2.5 : 2);
        ctx.stroke();

        // Inner dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fill();

        // Status indicator
        ctx.beginPath();
        ctx.arc(pos.x + radius * 0.7, pos.y + radius * 0.7, 6, 0, Math.PI * 2);
        ctx.fillStyle = statusColor;
        ctx.fill();
        ctx.strokeStyle = 'var(--k-bg)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Label
        ctx.font = '500 11px "Plus Jakarta Sans", system-ui';
        ctx.fillStyle = isSelected ? 'var(--k-cyan)' : (isHovered ? 'var(--k-t1)' : 'var(--k-t2)');
        ctx.textAlign = 'center';
        ctx.fillText(node.label, pos.x, pos.y - radius - 8);
      });
    };

    const render = () => {
      draw();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = false;
      nodes.forEach(node => {
        const padding = 60;
        const x = ((node.lng + 180) / 360) * (rect.width - 120) + 60;
        const y = ((90 - node.lat) / 180) * (rect.height - 120) + 60;
        const dist = Math.hypot(mouseX - x, mouseY - y);
        if (dist < 20) {
          setHoveredNode(node);
          found = true;
        }
      });
      if (!found) setHoveredNode(null);
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      nodes.forEach(node => {
        const padding = 60;
        const x = ((node.lng + 180) / 360) * (rect.width - 120) + 60;
        const y = ((90 - node.lat) / 180) * (rect.height - 120) + 60;
        const dist = Math.hypot(mouseX - x, mouseY - y);
        if (dist < 20) {
          onNodeSelect?.(node);
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mouseleave', () => setHoveredNode(null));

    requestAnimationFrame(() => {}); // Start render loop

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mouseleave', () => setHoveredNode(null));
    };
  }, [nodes, routes, selectedNodeId, onNodeSelect]);

  return (
    <div className={cx('relative rounded-2xl border border-[var(--k-line)] bg-[var(--k-bg)] overflow-hidden', className)} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
        onMouseMove={e => {}}
      />
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          className="k-icon-btn"
          onClick={() => setTransform(t => ({ ...t, scale: Math.min(t.scale * 1.2, 3) }))}
          aria-label="Zoom in"
        >
          <IconArrowUp size={16} />
        </button>
        <button
          className="k-icon-btn"
          onClick={() => setTransform(t => ({ ...t, scale: Math.max(t.scale / 1.2, 0.5) }))}
          aria-label="Zoom out"
        >
          <IconArrowDown size={16} />
        </button>
        <button
          className="k-icon-btn"
          onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          aria-label="Reset view"
        >
          <IconMapPin size={16} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-[var(--k-panel)]/90 backdrop-blur-xl border border-[var(--k-line)] rounded-xl p-3 text-[10px] k-mono">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-cyan)' }} />
          <span>Hub</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-amber)' }} />
          <span>Site</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-violet)' }} />
          <span>Port</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-positive)' }} />
          <span>Depot</span>
        </div>
        <div className="border-t border-[var(--k-line)] pt-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-cyan)' }} />
            <span>Optimal</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-amber)' }} />
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--k-rose)' }} />
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Node Detail Panel */}
      {hoveredNode && (
        <div className="absolute bottom-4 right-4 bg-[var(--k-panel)]/95 backdrop-blur-xl border border-[var(--k-line)] rounded-xl p-4 min-w-[220px] max-w-[280px] shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-fadeIn">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-3 h-3 rounded-full" style={{ background: NODE_COLORS[hoveredNode.type].bg }} />
            <span className="k-title text-[13px] text-[var(--k-t1)]">{hoveredNode.label}</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[hoveredNode.status] }} />
            <span className="k-label text-[9px] uppercase tracking-[0.1em]">{hoveredNode.status.toUpperCase()}</span>
          </div>
          <div className="space-y-1.5">
            {hoveredNode.metadata.map((m, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-[var(--k-t3)]">{m.label}</span>
                <span className="text-[var(--k-t1)] font-mono">{m.value}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => onNodeSelect?.(hoveredNode!)}
            className="mt-3 w-full py-2 rounded-xl bg-[var(--k-cyan)] text-[var(--k-bg)] font-bold text-[11px] hover:brightness-110 transition-all"
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default RouteMap;