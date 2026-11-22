import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PerspectiveCarouselItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  accentColor?: string;
  actionLabel?: string;
  onAction?: () => void;
  metadata?: { label: string; value: string }[];
}

interface PerspectiveCarouselProps {
  items: PerspectiveCarouselItem[];
  className?: string;
}

export const PerspectiveCarousel: React.FC<PerspectiveCarouselProps> = ({
  items,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      items[selectedIndex]?.onAction?.();
    }
  }, [items, selectedIndex]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Perspective carousel"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '480px',
          transformStyle: 'preserve-3d',
        }}
      >
        {items.map((item, index) => {
          const offset = index - selectedIndex;
          const absOffset = Math.abs(offset);
          const isSelected = offset === 0;
          const isAdjacent = absOffset === 1;
          
          let transform = '';
          let opacity = 1;
          let zIndex = items.length - absOffset;
          let scale = 1;
          let filter = 'none';
          let pointerEvents: 'auto' | 'none' = 'auto';

          if (isSelected) {
            transform = 'translateZ(80px) scale(1) rotateY(0deg)';
            opacity = 1;
            scale = 1;
          } else if (isAdjacent) {
            const direction = offset > 0 ? 1 : -1;
            transform = `translateZ(-40px) translateX(${direction * 180}px) scale(0.82) rotateY(${direction * -35}deg)`;
            opacity = 0.6;
            scale = 0.82;
            filter = 'blur(2px)';
            pointerEvents = 'none';
          } else {
            const direction = offset > 0 ? 1 : -1;
            transform = `translateZ(-120px) translateX(${direction * 320}px) scale(0.65) rotateY(${direction * -55}deg)`;
            opacity = 0.25;
            scale = 0.65;
            filter = 'blur(6px)';
            pointerEvents = 'none';
          }

          return (
            <div
              key={item.id}
              className="transition-all duration-700 ease-out"
              style={{
                transform,
                opacity,
                zIndex,
                filter,
                pointerEvents,
                transition: isReducedMotion ? 'none' : 'transform 700ms cubic-bezier(0.23, 1, 0.32, 1), opacity 500ms, filter 500ms',
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${item.title} ${isSelected ? '(selected)' : ''}`}
            >
              <div
                className="relative w-[380px] h-[420px] rounded-3xl overflow-hidden"
                style={{
                  background: item.accentColor
                    ? `linear-gradient(145deg, ${item.accentColor}15, ${item.accentColor}03)`
                    : 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))',
                  border: `1px solid ${item.accentColor ? `${item.accentColor}30` : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: isSelected
                    ? `0 30px 60px rgba(0,0,0,0.4), 0 0 80px ${item.accentColor || '#00f2fe'}20, inset 0 1px 0 rgba(255,255,255,0.1)`
                    : '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                  transition: isReducedMotion ? 'none' : 'box-shadow 500ms ease, border-color 500ms ease',
                }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-10"
                    aria-hidden="true"
                  />
                )}

                <div className="absolute inset-0 p-8 flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-mono text-slate-400 mb-4">
                      {index + 1} / {items.length}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight mb-2">{item.title}</h2>
                    {item.description && <p className="text-slate-300 text-base leading-relaxed">{item.description}</p>}
                  </div>

                  <div className="space-y-3">
                    {item.metadata && (
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                        {item.metadata.map((meta, i) => (
                          <div key={i} className="bg-white/5 rounded-xl p-3 backdrop-blur-sm">
                            <span className="text-[10px] font-mono text-slate-500 block mb-0.5">{meta.label}</span>
                            <span className="text-lg font-bold text-white">{meta.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.actionLabel && item.onAction && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          item.onAction?.();
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-sm transition-all active:scale-[0.98] shadow-[0_8_24px_rgba(0,242,254,0.3)] flex items-center justify-center gap-2"
                        aria-label={item.actionLabel}
                      >
                        <span>{item.actionLabel}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}

                    {!item.actionLabel && isSelected && (
                      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">←</kbd>
                        <span>Navigate</span>
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">→</kbd>
                        <kbd className="px-2 py-1 bg-white/10 rounded border border-white/20">Enter</kbd>
                        <span>Select</span>
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{
                        boxShadow: `inset 0 0 0 2px ${item.accentColor || '#00f2fe'}60`,
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom indicator dots */}
      <div className="flex items-center justify-center gap-2 mt-6" role="tablist" aria-label="Carousel slides">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={() => setSelectedIndex(index)}
            className={`
              relative w-3 h-3 rounded-full transition-all
              ${index === selectedIndex
                ? 'bg-cyan-400 w-10 shadow-[0_0_12px_rgba(0,242,254,0.6)]'
                : 'bg-white/20 hover:bg-white/40'
              }
            `}
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={`Go to ${item.title}`}
          >
            {index === selectedIndex && (
              <span className="absolute inset-0 rounded-full bg-cyan-400/30 animate-ping" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      {/* Side navigation hints */}
      <div className="flex justify-between px-4 mt-4 text-[10px] font-mono text-slate-500">
        <span>← Previous: {items[(selectedIndex - 1 + items.length) % items.length].title}</span>
        <span>Next: {items[(selectedIndex + 1) % items.length].title} →</span>
      </div>
    </div>
  );
};

export default PerspectiveCarousel;