import React, { useEffect, useRef, useState } from 'react';

interface DepthCarouselItem {
  id: string;
  title: string;
  subtitle?: string;
  content?: React.ReactNode;
  image?: string;
  color?: string;
  onSelect?: () => void;
}

interface DepthCarouselProps {
  items: DepthCarouselItem[];
  selectedIndex?: number;
  onSelect?: (index: number) => void;
  className?: string;
  autoRotate?: boolean;
  rotationInterval?: number;
}

export const DepthCarousel: React.FC<DepthCarouselProps> = ({
  items,
  selectedIndex: controlledIndex = 0,
  onSelect,
  className = '',
  autoRotate = false,
  rotationInterval = 4000,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(controlledIndex);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef<number>();

  useEffect(() => {
    setSelectedIndex(controlledIndex);
  }, [controlledIndex]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!autoRotate || isReducedMotion) return;
    
    rotationRef.current = window.setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % items.length);
    }, rotationInterval);
    
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [autoRotate, rotationInterval, items.length, isReducedMotion]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    onSelect?.(index);
    items[index]?.onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handleSelect((selectedIndex - 1 + items.length) % items.length);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleSelect((selectedIndex + 1) % items.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      items[selectedIndex]?.onSelect?.();
    }
  };

  const itemCount = items.length;
  const angleStep = (Math.PI * 2) / itemCount;
  const radius = 200;

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Depth carousel"
      aria-roledescription="carousel"
    >
      <div
        className="relative"
        style={{
          width: '100%',
          height: '400px',
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {items.map((item, index) => {
          const offset = index - selectedIndex;
          const normalizedOffset = ((offset + Math.floor(itemCount / 2)) % itemCount) - Math.floor(itemCount / 2);
          
          const angle = normalizedOffset * angleStep;
          const z = Math.cos(angle) * radius - radius;
          const x = Math.sin(angle) * radius;
          const scale = 1 - Math.abs(normalizedOffset) * 0.15;
          const opacity = index === selectedIndex ? 1 : 0.5 - Math.abs(normalizedOffset) * 0.1;
          const blur = Math.abs(normalizedOffset) * 4;
          
          const isSelected = index === selectedIndex;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(index)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-[#05070a]"
              style={{
                transform: `
                  translateZ(${z}px)
                  translateX(${x}px)
                  scale(${scale})
                  rotateY(${-angle * 1.5}rad)
                `,
                opacity,
                filter: `blur(${blur}px)`,
                zIndex: itemCount - Math.abs(normalizedOffset),
                pointerEvents: isSelected ? 'auto' : 'none',
                transition: isReducedMotion ? 'none' : 'transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 300ms, filter 300ms',
              }}
              aria-selected={isSelected}
              aria-label={item.title}
              disabled={!isSelected}
            >
              <div
                className="rounded-2xl p-6 bg-gradient-to-br from-white/10 via-white/5 to-white/2 border border-white/10 backdrop-blur-xl shadow-2xl min-w-[280px] max-w-[360px]"
                style={{
                  boxShadow: isSelected
                    ? '0 25px 50px rgba(0,242,254,0.15), 0 0 60px rgba(0,242,254,0.1)'
                    : '0 10px 30px rgba(0,0,0,0.3)',
                  transition: isReducedMotion ? 'none' : 'box-shadow 300ms ease',
                  background: item.color
                    ? `linear-gradient(135deg, ${item.color}20, ${item.color}05)`
                    : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                  borderColor: item.color ? `${item.color}40` : 'rgba(255,255,255,0.1)',
                }}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="w-full h-40 object-cover rounded-xl mb-4"
                    aria-hidden="true"
                  />
                )}
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                {item.subtitle && <p className="text-sm text-slate-400 mb-3">{item.subtitle}</p>}
                {item.content && <div className="text-sm text-slate-300">{item.content}</div>}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400">SELECTED</span>
                    <span className="px-3 py-1 rounded-xl bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      Choose
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Indicators */}
      <div className="flex items-center justify-center gap-2 mt-6" role="tablist" aria-label="Carousel pages">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index === selectedIndex
                ? 'bg-cyan-400 w-6 shadow-[0_0_8px_rgba(0,242,254,0.5)]'
                : 'bg-white/20 hover:bg-white/40'
              }
            `}
            role="tab"
            aria-selected={index === selectedIndex}
            aria-label={`Go to ${items[index].title}`}
          />
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => handleSelect((selectedIndex - 1 + items.length) % items.length)}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        aria-label="Previous"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button
        onClick={() => handleSelect((selectedIndex + 1) % items.length)}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-cyan-500/30 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
        aria-label="Next"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
};

export default DepthCarousel;