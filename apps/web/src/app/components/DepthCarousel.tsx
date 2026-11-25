import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cx } from '../format';
import { IconArrowLeft, IconArrowRight, IconMoreVert } from '../../components/common/Icons';

interface DepthCarouselItem<T> {
  id: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
  data: T;
  imageUrl?: string;
}

interface DepthCarouselProps<T> {
  items: DepthCarouselItem<T>[];
  initialIndex?: number;
  onSelect?: (item: DepthCarouselItem<T>, index: number) => void;
  onNavigate?: (item: DepthCarouselItem<T>, index: number) => void;
  renderItem?: (item: DepthCarouselItem<T>, isActive: boolean, progress: number) => React.ReactNode;
  className?: string;
  reducedMotion?: boolean;
}

export const DepthCarousel = <T,>({
  items,
  initialIndex = 0,
  onSelect,
  onNavigate,
  renderItem,
  className,
  reducedMotion = false,
}: DepthCarouselProps<T>) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isAnimating, setIsAnimating] = useState(false);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  const goTo = useCallback((index: number) => {
    if (isAnimating || index < 0 || index >= items.length) return;
    setIsAnimating(true);
    setActiveIndex(index);
    onNavigate?.(items[index], index);
    setTimeout(() => setIsAnimating(false), reducedMotion ? 0 : 400);
  }, [isAnimating, items.length, onNavigate, reducedMotion]);

  const goNext = useCallback(() => goTo((activeIndex + 1) % items.length), [activeIndex, goTo, items.length]);
  const goPrev = useCallback(() => goTo((activeIndex - 1 + items.length) % items.length), [activeIndex, goTo, items.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
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
    <div className={cx('relative overflow-hidden', className)} role="region" aria-label="Item carousel" aria-roledescription="carousel">
      <div className="relative">
        <div
          className={cx(
            'flex transition-transform duration-500 ease-out',
            reducedMotion && 'duration-0'
          )}
          style={{
            transform: `translateX(-${activeIndex * 100}%)`,
            willChange: 'transform',
          }}
          ref={carouselRef}
          role="list"
        >
          {items.map((item, index) => {
            const isActive = index === activeIndex;
            const progress = isActive ? 1 : 0;
            const scale = isActive ? 1 : 0.85;
            const opacity = isActive ? 1 : 0.5;
            const zIndex = isActive ? 10 : 5 - Math.abs(index - activeIndex);

            return (
              <div
                key={item.id}
                ref={el => { itemsRef.current[index] = el; }}
                className={cx('flex-shrink-0 w-full sm:w-[90%] lg:w-[70%] xl:w-[60%] px-3', 'relative')}
                role="listitem"
                aria-roledescription="slide"
                aria-label={`${item.label}, ${index + 1} of ${items.length}`}
                aria-current={isActive ? 'true' : 'false'}
              >
                <div
                  className={cx(
                    'rounded-2xl overflow-hidden transition-all duration-500 ease-out',
                    reducedMotion && 'duration-0'
                  )}
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    zIndex,
                    willChange: 'transform, opacity',
                    boxShadow: isActive
                      ? '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(34, 211, 238, 0.15)'
                      : '0 8px 24px rgba(0, 0, 0, 0.3)',
                    border: isActive ? '1px solid var(--k-cyan)' : '1px solid var(--k-line)',
                    background: isActive
                      ? 'linear-gradient(145deg, var(--k-panel-solid), var(--k-raised))'
                      : 'var(--k-panel)',
                  }}
                >
                  {renderItem ? (
                    renderItem(item, isActive, progress)
                  ) : (
                    <div className="p-6 h-full flex flex-col">
                      {item.imageUrl && (
                        <div className="mb-4 h-40 w-full rounded-xl overflow-hidden">
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)] flex items-center justify-center flex-shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="k-title text-[15px] text-[var(--k-t1)]">{item.label}</h4>
                          {item.subtitle && <p className="k-label text-[10px] text-[var(--k-t3)]">{item.subtitle}</p>}
                        </div>
                      </div>
                      <p className="text-[12px] text-[var(--k-t2)] flex-1">
                        Selectable item: {item.label}
                      </p>
                    </div>
                  )}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="p-2 rounded-lg bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)]"
                      onClick={e => { e.stopPropagation(); onSelect?.(item, index); }}
                      aria-label={`Select ${item.label}`}
                    >
                      <IconArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={isAnimating}
          className="p-3 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Previous item"
        >
          <IconArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2" role="tablist" aria-label="Carousel pages">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goTo(index)}
              className={cx(
                'w-2.5 h-2.5 rounded-full transition-all',
                index === activeIndex
                  ? 'bg-[var(--k-cyan)] w-8 scale-110'
                  : 'bg-[var(--k-t3)]/50 hover:bg-[var(--k-t2)]'
              )}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to item ${index + 1}`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={isAnimating}
          className="p-3 rounded-xl bg-[var(--k-inset)] border border-[var(--k-line)] hover:border-[var(--k-cyan)] text-[var(--k-t3)] hover:text-[var(--k-cyan)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-label="Next item"
        >
          <IconArrowRight size={18} />
        </button>
      </div>

      <div className="mt-4 text-center">
        <p className="k-mono text-[10px] text-[var(--k-t3)]">
          {activeIndex + 1} of {items.length} • Use ← → arrows to navigate
        </p>
      </div>
    </div>
  );
};

export default DepthCarousel;