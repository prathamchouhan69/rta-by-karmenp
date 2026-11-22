import React, { useState, useRef, useEffect } from 'react';
import { IconFiles, IconFolder, IconChevronRight, IconChevronDown } from '../common/Icons';

export interface GlassFolderCardProps {
  id: string;
  name: string;
  isFolder: boolean;
  fileCount?: number | undefined;
  children?: GlassFolderCardProps[] | undefined;
  size?: string | undefined;
  version?: string | undefined;
  status?: 'optimal' | 'warning' | 'critical' | 'idle' | 'active' | 'pending' | 'success' | 'error';
  onClick?: () => void;
  onOpen?: () => void;
  depth?: number;
  isOpen?: boolean;
}

const GLASS_STYLES = {
  folder: 'bg-gradient-to-br from-white/10 via-white/5 to-white/2 border-white/20 shadow-[0_8_32px_rgba(0,0,0,0.3)] backdrop-blur-xl',
  file: 'bg-gradient-to-br from-white/5 via-white/2 to-white/8 border-white/10 shadow-[0_4_16px_rgba(0,0,0,0.2)] backdrop-blur-lg',
};

export const GlassFolderCard: React.FC<GlassFolderCardProps> = ({
  id,
  name,
  isFolder,
  fileCount,
  children,
  size,
  version,
  onClick,
  onOpen,
  depth = 0,
  isOpen = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setLocalIsOpen(!localIsOpen);
      onOpen?.();
    } else {
      onClick?.();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as unknown as React.MouseEvent);
    } else if (e.key === 'ArrowRight' && isFolder && !localIsOpen) {
      e.preventDefault();
      setLocalIsOpen(true);
    } else if (e.key === 'ArrowLeft' && isFolder && localIsOpen) {
      e.preventDefault();
      setLocalIsOpen(false);
    }
  };

  const tiltStyle = isHovered && !isReducedMotion
    ? {
        transform: `perspective(1000px) rotateX(2deg) rotateY(-2deg) translateZ(8px)`,
        transition: 'transform 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    : isPressed && !isReducedMotion
    ? {
        transform: `perspective(1000px) rotateX(-1deg) rotateY(1deg) scale(0.98) translateZ(2px)`,
        transition: 'transform 50ms linear',
      }
    : {
        transform: 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)',
        transition: isReducedMotion ? 'none' : 'transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      };

  const baseClasses = `
    relative rounded-2xl p-4 cursor-pointer transition-all
    border-2 touch-none select-none
    focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-[#05070a]
    ${depth > 0 ? 'ml-4 border-l-2 border-cyan-500/20 pl-4' : ''}
  `;

  return (
    <div
      ref={cardRef}
      className={baseClasses}
      style={tiltStyle}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      tabIndex={0}
      role={isFolder ? 'treeitem' : 'button'}
      aria-expanded={isFolder ? localIsOpen : undefined}
      aria-level={depth + 1}
      aria-setsize={fileCount}
    >
      <div
        className={`
          flex items-center gap-3 relative z-10
          ${GLASS_STYLES[isFolder ? 'folder' : 'file']}
        `}
        style={{
          boxShadow: isHovered && !isReducedMotion
            ? '0 20px 40px rgba(0,242,254,0.08), 0 8px 16px rgba(0,0,0,0.3)'
            : '0 8px 32px rgba(0,0,0,0.3)',
          transition: isReducedMotion ? 'none' : 'box-shadow 300ms ease',
        }}
      >
        {isFolder ? (
          <>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 transition-all">
              {localIsOpen ? (
                <IconFolder size={20} className="text-cyan-400" />
              ) : (
                <IconFolder size={20} className="text-cyan-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-white truncate block">{name}</span>
              <span className="text-[10px] font-mono text-slate-400">
                {fileCount !== undefined ? `${fileCount} item${fileCount !== 1 ? 's' : ''}` : 'Empty'}
              </span>
            </div>
            <IconChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${localIsOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400">
              <IconFiles size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-white truncate block">{name}</span>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                {size && <span>{size}</span>}
                {version && <span className="text-pink-300">v{version}</span>}
              </div>
            </div>
            <IconChevronRight size={16} className="text-slate-400 group-hover:text-white transition-colors" aria-hidden="true" />
          </>
        )}
      </div>

      {isFolder && localIsOpen && children && children.length > 0 && (
        <div
          className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ animation: isReducedMotion ? 'none' : undefined }}
          role="group"
          aria-label={`${name} contents`}
        >
          {children.map((child) => (
            <GlassFolderCard
              key={child.id}
              {...child}
              depth={depth + 1}
              isOpen={false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GlassFolderCard;