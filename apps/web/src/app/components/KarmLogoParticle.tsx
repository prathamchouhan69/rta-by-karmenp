import React, { useRef, useEffect, useState } from 'react';

interface KarmLogoParticleProps {
  className?: string;
  size?: number;
  onInteraction?: boolean;
}

export const KarmLogoParticle: React.FC<KarmLogoParticleProps> = ({
  className,
  size = 120,
  onInteraction = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    color: string;
  }>>([]);

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
    const centerX = width / 2;
    const centerY = height / 2;

    // Initialize particles in logo shape
    const initParticles = () => {
      const newParticles = [];
      const particleCount = 80;
      
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = (Math.random() * 0.5 + 0.5) * Math.min(width, height) * 0.35;
        const px = centerX + Math.cos(angle) * radius;
        const py = centerY + Math.sin(angle) * radius;
        
        newParticles.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.4 + 0.2,
          color: Math.random() > 0.5 ? '#22d3ee' : '#818cf8',
        });
      }
      setParticles(newParticles);
    };

    initParticles();

    let lastTime = 0;
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.02)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
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

      // Update and draw particles
      particles.forEach((p, i) => {
        if (isActive) {
          // Attract to center when active
          const dx = centerX - p.x;
          const dy = centerY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 1) {
            p.vx += (dx / dist) * 0.8 * dt * 60;
            p.vy += (dy / dist) * 0.8 * dt * 60;
          }
        } else {
          // Gentle drift
          p.vx += (Math.random() - 0.5) * 0.02;
          p.vy += (Math.random() - 0.5) * 0.02;
        }

        // Damping
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Boundary
        if (p.x < 0 || p.x > width) p.vx *= -0.5;
        if (p.y < 0 || p.y > height) p.vy *= -0.5;

        p.x += p.vx;
        p.y += p.vy;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow effect for active particles
        if (isActive && p.opacity > 0.5) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * 0.3;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      });

      // Draw connecting lines for nearby particles
      if (isActive) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              ctx.globalAlpha = (1 - dist / 80) * 0.15;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
              ctx.globalAlpha = 1;
            }
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particles, isActive]);

  const handleMouseEnter = () => onInteraction && setIsActive(true);
  const handleMouseLeave = () => onInteraction && setIsActive(false);
  const handleTouchStart = () => onInteraction && setIsActive(true);
  const handleTouchEnd = () => onInteraction && setIsActive(false);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        touchAction: 'none',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-hidden="true"
      role="img"
      aria-label="KARM logo particle field"
    />
  );
};

export default KarmLogoParticle;