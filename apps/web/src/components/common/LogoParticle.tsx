import React, { useEffect, useRef, useState } from 'react';

interface LogoParticleProps {
  size?: number;
  particleCount?: number;
  color?: string;
  isLoading?: boolean;
  className?: string;
}

const PARTICLE_COLORS = ['#00f2fe', '#a855f7', '#facc15', '#ffffff'];

export const LogoParticle: React.FC<LogoParticleProps> = ({
  size = 120,
  particleCount = 60,
  color = '#00f2fe',
  isLoading = false,
  className = '',
}) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [dimensions, setDimensions] = useState({ width: size, height: size });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    targetX: number;
    targetY: number;
    color: string;
  }>>([]);

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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
    const maxRadius = Math.min(dimensions.width, dimensions.height) / 2 - 10;

    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = maxRadius * (0.3 + Math.random() * 0.7);
      const targetX = centerX + Math.cos(angle) * radius;
      const targetY = centerY + Math.sin(angle) * radius;
      
      return {
        x: centerX + (Math.random() - 0.5) * dimensions.width,
        y: centerY + (Math.random() - 0.5) * dimensions.height,
        vx: 0,
        vy: 0,
        radius: 1.5 + Math.random() * 2,
        alpha: 0.3 + Math.random() * 0.5,
        targetX,
        targetY,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      };
    });

    let mouseX = centerX;
    let mouseY = centerY;
    let isInteracting = false;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      isInteracting = true;
    };

    const handleMouseLeave = () => {
      isInteracting = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;
      isInteracting = true;
    }, { passive: false });

    const animate = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      particlesRef.current.forEach((p) => {
        let targetX = p.targetX;
        let targetY = p.targetY;

        if (isInteracting && !isReducedMotion) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 100) {
            const force = (100 - dist) / 100;
            const angle = Math.atan2(dy, dx);
            p.vx -= Math.cos(angle) * force * 0.5;
            p.vy -= Math.sin(angle) * force * 0.5;
          }
        }

        const springForce = 0.02;
        p.vx += (targetX - p.x) * springForce;
        p.vy += (targetY - p.y) * springForce;

        p.vx *= 0.92;
        p.vy *= 0.92;

        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.round(p.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        if (!isReducedMotion) {
          particlesRef.current.forEach((p2) => {
            if (p === p2) return;
            const dx = p2.x - p.x;
            const dy = p2.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 80) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `${p.color}${Math.round((1 - dist / 80) * p.alpha * 100).toString(16).padStart(2, '0')}`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          });
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (!isReducedMotion) {
      animate();
    } else {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      particlesRef.current.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.targetX, p.targetY, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.round(p.alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
      });
    }

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particleCount, size, color, isReducedMotion, dimensions.width, dimensions.height]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className={`${className} block`}
      aria-hidden="true"
      style={{ touchAction: 'none' }}
    />
  );
};

export default LogoParticle;