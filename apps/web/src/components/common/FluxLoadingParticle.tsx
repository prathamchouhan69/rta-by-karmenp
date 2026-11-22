import React, { useEffect, useRef, useState } from 'react';

interface FluxLoadingParticleProps {
  size?: number;
  particleCount?: number;
  isActive?: boolean;
  className?: string;
}

export const FluxLoadingParticle: React.FC<FluxLoadingParticleProps> = ({
  size = 48,
  particleCount = 12,
  isActive = true,
  className = '',
}) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [dimensions, setDimensions] = useState({ width: size, height: size });
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        setDimensions({ width: rect.width, height: rect.height });
      }
    });
    resizeObserver.observe(canvas);
    setDimensions({ width: canvas.offsetWidth, height: canvas.offsetHeight });

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const orbitRadius = Math.min(dimensions.width, dimensions.height) / 2 - 4;

    const particles = Array.from({ length: particleCount }, (_, i) => ({
      angle: (i / particleCount) * Math.PI * 2,
      radius: orbitRadius * (0.7 + Math.random() * 0.3),
      speed: 0.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 3,
      color: ['#00f2fe', '#a855f7', '#facc15', '#ffffff'][Math.floor(Math.random() * 4)],
      phase: Math.random() * Math.PI * 2,
    }));

    let startTime = Date.now();

    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const elapsed = (Date.now() - startTime) / 1000;

      particles.forEach((p, i) => {
        const currentAngle = p.angle + elapsed * p.speed * (i % 2 === 0 ? 1 : -1);
        const x = centerX + Math.cos(currentAngle) * p.radius;
        const y = centerY + Math.sin(currentAngle) * p.radius;
        
        const pulseSize = p.size * (0.7 + 0.3 * Math.sin(elapsed * 3 + p.phase));

        if (!isReducedMotion) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, p.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `${p.color}20`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, `${p.color}00`);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, pulseSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}80`;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (!isReducedMotion) {
      animate();
    } else {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      particles.forEach((p, i) => {
        const angle = (i / particleCount) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * p.radius;
        const y = centerY + Math.sin(angle) * p.radius;
        
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, particleCount, size, isReducedMotion, dimensions.width, dimensions.height]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className={`${className} block`}
      aria-hidden="true"
      role="status"
      aria-label={isActive ? 'Loading' : 'Idle'}
    />
  );
};

export default FluxLoadingParticle;