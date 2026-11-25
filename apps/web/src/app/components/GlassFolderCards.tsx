import React, { useState, useRef, useEffect } from 'react';
import { cx } from '../format';
import { Panel, Chip, IconButton } from '../ui';
import { useWorkspace } from '../workspace';
import { IconFile, IconFolder, IconDownload, IconMoreVert, IconArrowRight } from '../../components/common/Icons';

interface GlassFolderCardProps {
  type: 'folder' | 'file';
  name: string;
  count?: number;
  size?: string;
  date?: string;
  doc?: any;
  onOpen?: (item: any) => void;
  onDownload?: (item: any) => void;
  onMore?: () => void;
  isSelected?: boolean;
  className?: string;
}

export const GlassFolderCard: React.FC<GlassFolderCardProps> = ({
  type,
  name,
  count,
  size,
  date,
  doc,
  onOpen,
  onDownload,
  onMore,
  isSelected,
  className,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);
      setTilt({ x: deltaY * 3, y: -deltaX * 3 });
    };

    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0 });
    };

    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onOpen) {
      e.preventDefault();
      onOpen?.(doc);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cx(
        'relative group k-reveal',
        'rounded-2xl overflow-hidden transition-all duration-300',
        'border',
        isSelected
          ? 'border-[var(--k-cyan)] bg-[var(--k-cyan-soft)] shadow-[0_0_20px_rgba(34,211,238,0.15)]'
          : 'border-[var(--k-line)] bg-[var(--k-panel)]/60 hover:border-[var(--k-line-strong)]',
        className
      )}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${isHovered ? 'translateY(-2px)' : ''}`,
        transformStyle: 'preserve-3d',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen?.(doc)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={type === 'folder' ? `Open folder ${name}` : `Open file ${name}`}
      aria-pressed={isSelected}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--k-cyan)]/5 via-transparent to-[var(--k-violet)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-0 bg-[var(--k-panel)]/80 backdrop-blur-xl" />
      <div className="relative p-4 h-full flex flex-col" style={{ transform: 'translateZ(10px)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className={cx(
                'flex items-center justify-center shrink-0 rounded-xl transition-transform duration-300 group-hover:scale-110',
                'bg-[var(--k-inset)] border border-[var(--k-line)]'
              )}
              style={{
                width: 48,
                height: 48,
                transformStyle: 'preserve-3d',
              }}
            >
              {type === 'folder' ? (
                <IconFolder size={22} className="text-[var(--k-amber)]" />
              ) : (
                <IconFile size={22} className="text-[var(--k-cyan)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="k-title text-[13px] truncate text-[var(--k-t1)]">{name}</h4>
              <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--k-t3)] k-mono">
                {count !== undefined && <span>{count} items</span>}
                {size && <span>{size}</span>}
                {date && <span>{date}</span>}
              </div>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <IconButton
              onClick={e => { e.stopPropagation(); onDownload?.(doc); }}
              aria-label="Download"
              className="p-1.5 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-line-strong)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
            >
              <IconDownload size={14} />
            </IconButton>
          </div>
        </div>

        {type === 'folder' && (
          <div className="mt-auto pt-4 border-t border-[var(--k-line)]/50">
            <div className="flex items-center justify-between">
              <span className="k-label text-[10px] text-[var(--k-t3)]">Open to view contents</span>
              <IconButton
                onClick={e => { e.stopPropagation(); onOpen?.(doc); }}
                aria-label="Open folder"
                className="p-1.5 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
              >
                <IconArrowRight size={12} />
              </IconButton>
            </div>
          </div>
        )}

        {type === 'file' && (
          <div className="mt-auto pt-4 border-t border-[var(--k-line)]/50">
            <div className="flex items-center justify-between">
              <span className="k-label text-[10px] text-[var(--k-t3)]">Ready to open</span>
              <IconButton
onClick={e => { e.stopPropagation(); onDownload?.(doc); }}
                aria-label="Download file"
                className="p-1.5 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
              >
                <IconDownload size={12} />
              </IconButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface GlassFolderCardsProps {
  folders: Array<{ id: string; name: string; count: number; date: string; doc?: any }>;
  files: Array<{ id: string; name: string; size: string; date: string; doc?: any }>;
  onFolderOpen?: (item: any) => void;
  onFileOpen?: (item: any) => void;
  onFileDownload?: (item: any) => void;
  className?: string;
}

export const GlassFolderCards: React.FC<GlassFolderCardsProps> = ({
  folders,
  files,
  onFolderOpen,
  onFileOpen,
  onFileDownload,
  className,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className={cx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4', className)} role="list">
      {folders.map(folder => (
        <GlassFolderCard
          key={folder.id}
          type="folder"
          name={folder.name}
          count={folder.count}
          date={folder.date}
          doc={folder.doc}
          isSelected={selectedId === folder.id}
          onOpen={item => { setSelectedId(folder.id); onFolderOpen?.(item); }}
        />
      ))}
      {files.map(file => (
        <GlassFolderCard
          key={file.id}
          type="file"
          name={file.name}
          size={file.size}
          date={file.date}
          doc={file.doc}
          isSelected={selectedId === file.id}
          onOpen={item => { setSelectedId(file.id); onFileOpen?.(item); }}
          onDownload={item => onFileDownload?.(item)}
        />
      ))}
      {(folders.length + files.length) === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-[var(--k-line)] bg-[var(--k-inset)]/50">
          <IconFolder size={48} className="text-[var(--k-t4)] mb-3" />
          <p className="k-title text-[15px] text-[var(--k-t2)]">No documents yet</p>
          <p className="mt-1 text-[11px] text-[var(--k-t3)]">Upload or create files to get started</p>
        </div>
      )}
    </div>
  );
};

export default GlassFolderCards;