import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MapTileNode {
  id: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  active: boolean;
  color?: string;
  metadata?: { label: string; value: string }[];
  onClick?: () => void;
}

interface MapTileConnection {
  from: string;
  to: string;
  animated?: boolean;
  color?: string;
}

interface MapTilesProps {
  nodes: MapTileNode[];
  connections: MapTileConnection[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
}

const DEFAULT_COLORS = {
  node: '#00f2fe',
  nodeActive: '#a855f7',
  connection: '#00f2fe40',
  connectionActive: '#a855f780',
};

export const MapTiles: React.FC<MapTilesProps> = ({
  nodes,
  connections,
  title,
  subtitle,
  className = '',
  height = 400,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setBounds({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    
    resizeObserver.observe(container);
    setBounds({
      width: container.offsetWidth,
      height: container.offsetHeight,
    });
    
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || bounds.width === 0 || bounds.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = bounds.width * dpr;
    canvas.height = bounds.height * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;

    const drawConnections = () => {
      connections.forEach((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.from);
        const toNode = nodes.find((n) => n.id === conn.to);
        
        if (!fromNode || !toNode) return;

        const fromX = (fromNode.x / 100) * bounds.width;
        const fromY = (fromNode.y / 100) * bounds.height;
        const toX = (toNode.x / 100) * bounds.width;
        const toY = (toNode.y / 100) * bounds.height;

        const isActive = fromNode.active || toNode.active;
        const isHovered = hoveredNode === fromNode.id || hoveredNode === toNode.id;
        
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        
        // Curved path
        const cpX = (fromX + toX) / 2;
        const cpY = (fromY + toY) / 2 - 50;
        ctx.quadraticCurveTo(cpX, cpY, toX, toY);
        
        const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
        const color = conn.color || (isActive ? DEFAULT_COLORS.connectionActive : DEFAULT_COLORS.connection);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, color);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = isActive || isHovered ? 3 : 2;
        ctx.lineCap = 'round';
        ctx.setLineDash(conn.animated && !isReducedMotion ? [10, 10] : []);
        ctx.lineDashOffset = conn.animated && !isReducedMotion ? -time * 20 : 0;
        ctx.stroke();
        ctx.setLineDash([]);
      });
    };

    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, bounds.width, bounds.height);
      time += 0.016;
      
      drawConnections();
      
      animationRef.current = requestAnimationFrame(animate);
    };

    if (!isReducedMotion) {
      animate();
    } else {
      drawConnections();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes, connections, hoveredNode, bounds, isReducedMotion]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found = false;
    for (const node of nodes) {
      const nodeX = (node.x / 100) * bounds.width;
      const nodeY = (node.y / 100) * bounds.height;
      const dist = Math.sqrt((mouseX - nodeX) ** 2 + (mouseY - nodeY) ** 2);
      
      if (dist < 40) {
        setHoveredNode(node.id);
        found = true;
        break;
      }
    }
    
    if (!found) setHoveredNode(null);
  }, [nodes, bounds]);

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden bg-[#05070a] border border-white/10 ${className}`}
      style={{ height, minHeight: height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label={title || 'Interactive route map'}
    >
      {/* Canvas for connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Nodes */}
      {nodes.map((node) => {
        const isHovered = hoveredNode === node.id;
        const isActive = node.active || isHovered;
        
        return (
          <button
            key={node.id}
            onClick={() => node.onClick?.()}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-[#05070a]"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              zIndex: isActive ? 10 : 5,
              transform: `translate(-50%, -50%) scale(${isActive ? 1.15 : 1})`,
            }}
            aria-label={node.label}
            aria-pressed={node.active}
          >
            <div className="relative flex flex-col items-center gap-1">
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: node.active
                    ? `linear-gradient(135deg, ${node.color || DEFAULT_COLORS.nodeActive}30, ${node.color || DEFAULT_COLORS.nodeActive}10)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  border: `2px solid ${node.active ? (node.color || DEFAULT_COLORS.nodeActive) : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: node.active || isHovered
                    ? `0 0 30px ${node.color || DEFAULT_COLORS.node}60, 0 8px 24px rgba(0,0,0,0.3)`
                    : '0 4px 16px rgba(0,0,0,0.2)',
                }}
              >
                <span className="text-2xl">📍</span>
                {node.active && !isReducedMotion && (
                  <div
                    className="absolute inset-0 rounded-2xl animate-ping opacity-75"
                    style={{
                      border: `2px solid ${node.color || DEFAULT_COLORS.nodeActive}`,
                      background: `radial-gradient(circle at center, ${node.color || DEFAULT_COLORS.nodeActive}20, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="text-xs font-bold text-white text-center whitespace-nowrap px-2 py-0.5 bg-[#05070a]/90 rounded-xl border border-white/10 shadow-lg">
                {node.label}
              </span>
            </div>

            {/* Metadata tooltip on hover */}
            {isHovered && node.metadata && node.metadata.length > 0 && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 rounded-xl bg-[#07090e]/95 border border-white/10 shadow-2xl backdrop-blur-xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200"
                role="tooltip"
              >
                {node.metadata.map((meta, i) => (
                  <div key={i} className="flex justify-between text-[10px] font-mono py-0.5">
                    <span className="text-slate-400">{meta.label}</span>
                    <span className="text-white font-bold">{meta.value}</span>
                  </div>
                ))}
              </div>
            )}
          </button>
        );
      })}

      {/* Title overlay */}
      {(title || subtitle) && (
        <div className="absolute top-4 left-4 right-4 pointer-events-none">
          {title && (
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          )}
          {subtitle && (
            <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEFAULT_COLORS.node }} />
            Active Route
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DEFAULT_COLORS.connection }} />
            Connection
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
          Hover node for details
        </div>
      </div>
    </div>
  );
};

export default MapTiles;