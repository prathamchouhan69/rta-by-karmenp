import React, { useRef, useEffect, useState } from 'react';

interface FluxLoadingParticleProps {
  isActive: boolean;
  size?: number;
  className?: string;
  variant?: 'cyan' | 'violet' | 'amber';
}

export const FluxLoadingParticle: React.FC<FluxLoadingParticleProps> = ({
  isActive,
  size = 48,
  className,
  variant = 'cyan',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
    life: number;
    maxLife: number;
    color: string;
  }>>([]);

  const colors = {
    cyan: ['#22d3ee', '#0891b2', '#06b6d4'],
    violet: ['#818cf8', '#6366f1', '#a78bfa'],
    amber: ['#f59e0b', '#d97706', '#fbbf24'],
  };

  const particleColors = colors[variant];

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

    const spawnParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const radius = (Math.random() * 0.3 + 0.2) * Math.min(width, height) * 0.4;
      return {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
        life: 0,
        maxLife: Math.random() * 800 + 400,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
      };
    };

    if (isActive && particles.length === 0) {
      const newParticles = Array.from({ length: 12 }, spawnParticle);
      setParticles(newParticles);
    }

    let lastTime = 0;
    const animate = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;

      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      let allDead = true;
      particles.forEach((p, i) => {
        p.life += dt;
        const lifeRatio = p.life / p.maxLife;

        if (lifeRatio >= 1) {
          // Respawn
          const newP = spawnParticle();
          newP.life = 0;
          particles[i] = newP;
        }
        allDead = false;

        // Expand outward
        const dx = p.x - centerX;
        const dy = p.y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        p.vx += (dx / dist) * 0.3;
        p.vy += (dy / dist) * 0.3;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx * dt * 0.1;
        p.y += p.vy * dt * 0.1;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * (1 - lifeRatio);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Glow
        if (p.opacity > 0.5) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.opacity * 0.2 * (1 - lifeRatio);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }

        // Pulse ring
        if (lifeRatio < 0.2) {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - lifeRatio / 0.2) * 0.4;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, Math.min(width, height) * 0.15 * (lifeRatio / 0.2), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      });

      if (allDead && !isActive) {
        setParticles([]);
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isActive) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, particles, variant]);

  if (!isActive && particles.length === 0) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
      role="status"
      aria-label="Flux AI processing"
    />
  );
};

export default FluxLoadingParticle;