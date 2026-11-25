import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cx } from '../format';
import { IconArrowLeft, IconArrowRight, IconExpand } from '../../components/common/Icons';

interface PerspectiveCarouselItem<T> {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  data: T;
  accentColor?: string;
}

interface PerspectiveCarouselProps<T> {
  items: PerspectiveCarouselItem<T>[];
  initialIndex?: number;
  onSelect?: (item: PerspectiveCarouselItem<T>, index: number) => void;
  onNavigate?: (item: PerspectiveCarouselItem<T>, index: number) => void;
  renderItem?: (item: PerspectiveCarouselItem<T>, isActive: boolean, progress: number) => React.ReactNode;
  className?: string;
  reducedMotion?: boolean;
  autoRotate?: boolean;
  autoRotateInterval?: number;
}

export const PerspectiveCarousel = <T,>({
  items,
  initialIndex = 0,
  onSelect,
  onNavigate,
  renderItem,
  className,
  reducedMotion = false,
  autoRotate = false,
  autoRotateInterval = 5000,
}: PerspectiveCarouselProps<T>) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const autoRotateRef = useRef<ReturnType<typeof setInterval>>();

  const goTo = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= items.length) return;
    setIsAnimating(true);
    setActiveIndex(index);
    onNavigate?.(items[index], index);
    setTimeout(() => setIsAnimating(false), reducedMotion ? 0 : 600);
  }, [isAnimating, items.length, onNavigate, reducedMotion]);

  const goNext = useCallback(() => goTo((activeIndex + 1) % items.length), [activeIndex, goTo, items.length]);
  const goPrev = useCallback(() => goTo((activeIndex - 1 + items.length) % items.length), [activeIndex, goTo, items.length]);

  useEffect(() => {
    if (autoRotate && !isHovered && items.length > 1) {
      autoRotateRef.current = setInterval(goNext, autoRotateInterval);
    } else {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    }
    return () => {
      if (autoRotateRef.current) clearInterval(autoRotateRef.current);
    };
  }, [autoRotate, isHovered, items.length, goNext]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect?.(items[activeIndex], activeIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, goNext, goPrev, onSelect, items]);

  if (items.length === 0) {
    return (
      <div className={cx('flex items-center justify-center py-16 text-center', className)} role="region" aria-label="Empty carousel">
        <div className="text-[var(--k-t3)] k-mono text-[11px]">No items to display</div>
      </div>
    );
  }

  return (
    <div
      className={cx('relative overflow-hidden', className)}
      role="region"
      aria-label="3D perspective carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative" style={{ perspective: '1200px' }}>
        <div
          className={cx(
            'flex transition-transform duration-700 ease-out',
            reducedMotion && 'duration-0'
          )}
          style={{
            transform: `translateX(-${activeIndex * 100}%) rotateY(${activeIndex * 5}deg)`,
            willChange: 'transform',
            transformStyle: 'preserve-3d',
          }}
          ref={carouselRef}
          role="list"
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const isPrev = index === (activeIndex - 1 + items.length) % items.length;
            const isNext = index === (activeIndex + 1) % items.length;
            const distance = index - activeIndex;

            let rotateY = 0;
            let translateZ = 0;
            let translateX = 0;
            let scale = 1;
            let opacity = 1;
            let zIndex = 10 - Math.abs(distance);
            let filter = 'none';

            if (distance === 0) {
              rotateY = 0;
              translateZ = 80;
              scale = 1;
              opacity = 1;
              filter = 'drop-shadow(0 30px 60px rgba(0,0,0,0.3))';
            } else if (distance === 1 || distance === -1 * (items.length - 1)) {
              rotateY = -35;
              translateZ = -120;
              translateX = 180;
              scale = 0.75;
              opacity = 0.6;
            } else if (distance === -1 || distance === items.length - 1) {
              rotateY = 35;
              translateZ = -120;
              translateX = -180;
              scale = 0.75;
              opacity = 0.6;
            } else if (Math.abs(distance) === 2 || Math.abs(distance) === items.length - 2) {
              rotateY = distance > 0 ? -60 : 60;
              translateZ = -280;
              translateX = distance > 0 ? 320 : -320;
              scale = 0.55;
              opacity = 0.3;
            } else {
              rotateY = distance > 0 ? -75 : 75;
              translateZ = -400;
              translateX = distance > 0 ? 420 : -420;
              scale = 0.4;
              opacity = 0.15;
            }

            return (
              <div
                key={item.id}
                className={cx('flex-shrink-0 w-full sm:w-[92%] lg:w-[80%] xl:w-[70%] px-4', 'relative')}
                role="listitem"
                aria-roledescription="slide"
                aria-label={`${item.title}, ${index + 1} of ${items.length}`}
                aria-current={isActive ? 'true' : 'false'}
                style={{
                  transformStyle: 'preserve-3d',
                  willChange: 'transform, opacity',
                }}
              >
                <div
                  className={cx(
                    'rounded-2xl overflow-hidden transition-all duration-700 ease-out',
                    reducedMotion && 'duration-0'
                  )}
                  style={{
                    transform: `
                      perspective(1200px)
                      rotateY(${rotateY}deg)
                      translateX(${translateX}px)
                      translateZ(${translateZ}px)
                      scale(${scale})
                    `,
                    opacity,
                    zIndex,
                    willChange: 'transform, opacity, z-index',
                    filter,
                    backfaceVisibility: 'hidden',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {renderItem ? (
                    renderItem(item, isActive, isActive ? 1 : 0)
                  ) : (
                    <div className="relative h-[320px] sm:h-[380px] lg:h-[420px] rounded-2xl overflow-hidden bg-[var(--k-panel)] border border-[var(--k-line)]" style={{ transformStyle: 'preserve-3d' }}>
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--k-cyan)]/5 via-transparent to-[var(--k-violet)]/5" style={{ transform: 'translateZ(-1px)' }} />
                      {item.imageUrl && (
                        <div className="absolute inset-0" style={{ transform: 'translateZ(-2px)' }}>
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover opacity-30"
                          />
                        </div>
                      )}
                      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center" style={{ transform: 'translateZ(40px)' }}>
                        <div className="w-20 h-20 rounded-2xl bg-[var(--k-inset)] border border-[var(--k-line)] flex items-center justify-center mb-6 mx-auto" style={{ transform: 'translateZ(20px)' }}>
                          {item.accentColor ? (
                            <div className="w-full h-full rounded-xl" style={{ background: item.accentColor }} />
                          ) : (
                            <IconExpand size={32} className="text-[var(--k-cyan)]" />
                          )}
                        </div>
                        <h3 className="k-title text-[20px] sm:text-[24px] text-[var(--k-t1)] mb-2" style={{ transform: 'translateZ(10px)' }}>{item.title}</h3>
                        {item.subtitle && <p className="k-label text-[11px] text-[var(--k-t3)] mb-4" style={{ transform: 'translateZ(10px)' }}>{item.subtitle}</p>}
                        {item.description && <p className="text-[13px] text-[var(--k-t2)] max-w-md mx-auto" style={{ transform: 'translateZ(10px)' }}>{item.description}</p>}
                      </div>
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ transform: 'translateZ(50px)' }}>
                        <button
                          onClick={e => { e.stopPropagation(); onSelect?.(item, index); }}
                          className="px-5 py-2.5 rounded-xl bg-[var(--k-cyan)] text-[var(--k-bg)] font-bold text-[12px] hover:brightness-110 transition-all"
                          aria-label={`Select ${item.title}`}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: 'translateZ(100px)' }}>
                    {isActive && (
                      <div className="w-3 h-3 rounded-full bg-[var(--k-cyan)] animate-pulse" style={{ boxShadow: '0 0 20px var(--k-cyan)' }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={goPrev}
          disabled={isAnimating}
          className="p-3 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Previous item"
        >
          <IconArrowLeft size={20} />
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Carousel pages">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cx(
                'w-2.5 h-2.5 rounded-full transition-all duration-300',
                index === activeIndex
                  ? 'bg-[var(--k-cyan)] w-10 scale-110 shadow-[0_0_12px_var(--k-cyan)]'
                  : 'bg-[var(--k-t3)]/50 hover:bg-[var(--k-t2)]'
              )}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to ${items[index].title}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={isAnimating}
          className="p-3 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Next item"
        >
          <IconArrowRight size={20} />
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="k-mono text-[10px] text-[var(--k-t3)]">
          {activeIndex + 1} of {items.length} • ← → to navigate • Click to select
        </p>
      </div>
    </div>
  );
};

export default PerspectiveCarousel;