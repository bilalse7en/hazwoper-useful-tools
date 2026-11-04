'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// Inlined helper to detect performance / battery saver mode
function isPerformanceMode() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('performance_mode') === 'true';
}

export function BackgroundSpace() {
  const canvasRef = useRef(null);
  const { resolvedTheme } = useTheme();
  const [enabled, setEnabled] = useState(true);

  const mouse = useRef({
    x: -1000,
    y: -1000,
    vx: 0,
    vy: 0,
    lastX: 0,
    lastY: 0,
  });
  const time = useRef(0);
  const isVisible = useRef(true);

  // Sync with "Visual Effects: Animations & particles" toggle
  useEffect(() => {
    const checkPerformance = () => {
      const isPerf = isPerformanceMode();
      setEnabled(!isPerf);
    };

    checkPerformance();
    window.addEventListener('storage', checkPerformance);

    const handleVisualToggle = () => checkPerformance();
    window.addEventListener('visual_effects_toggled', handleVisualToggle);

    return () => {
      window.removeEventListener('storage', checkPerformance);
      window.removeEventListener('visual_effects_toggled', handleVisualToggle);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    let animationFrameId;

    let stars = [];
    // Lower quantity: ~42 on desktop, ~24 on mobile for high performance
    const count = window.innerWidth < 768 ? 24 : 42;

    const initStars = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      stars = Array.from({ length: count }, () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          size: Math.random() * 0.9 + 0.65, // Star pinpoint: 0.65px - 1.55px
          speed: Math.random() * 0.16 + 0.05, // Smooth slow drift
          opacity: Math.random() * 0.5 + 0.45,
          twinkleSpeed: Math.random() * 0.02 + 0.008,
          glow: Math.random() > 0.35,
          vx: 0,
          vy: 0,
          angle: Math.random() * Math.PI * 2,
        };
      });
    };

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      mouse.current.vx = x - mouse.current.lastX;
      mouse.current.vy = y - mouse.current.lastY;
      mouse.current.x = x;
      mouse.current.y = y;
      mouse.current.lastX = x;
      mouse.current.lastY = y;
    };

    const draw = () => {
      if (!isVisible.current || !canvas || !ctx) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      time.current += 0.01;
      mouse.current.vx *= 0.95;
      mouse.current.vy *= 0.95;

      const isNebula = resolvedTheme === 'nebula';
      const isDark = resolvedTheme === 'dark';
      const isLight = !isDark && !isNebula;

      stars.forEach((star) => {
        star.x -= star.speed;
        const waveOffset = Math.sin(time.current + star.angle) * 0.14;
        star.y += waveOffset;

        const dx = star.x - mouse.current.x;
        const dy = star.y - mouse.current.y;
        const distSq = dx * dx + dy * dy;
        const influenceRadius = 80;

        if (distSq < influenceRadius * influenceRadius) {
          const dist = Math.sqrt(distSq);
          const force = (influenceRadius - dist) / influenceRadius;
          const strength = 3.5;
          star.vx += (dx / dist) * force * strength;
          star.vy += (dy / dist) * force * strength;
          star.vx += mouse.current.vx * force * 0.05;
          star.vy += mouse.current.vy * force * 0.05;
          star.opacity = Math.min(1, star.opacity + 0.1);
        }

        star.x += star.vx;
        star.y += star.vy;
        star.vx *= 0.9;
        star.vy *= 0.9;

        if (star.x < -30) star.x = canvas.width + 30;
        if (star.x > canvas.width + 30) star.x = -30;
        if (star.y < -30) star.y = canvas.height + 30;
        if (star.y > canvas.height + 30) star.y = -30;

        // Twinkle factor
        const twinkle = Math.sin(time.current * 2.2 + star.angle) * 0.22;
        const alpha = Math.max(0.3, Math.min(0.95, star.opacity + twinkle));

        ctx.save();

        if (isNebula) {
          // Cosmic Nebula Theme: Vibrant electric cyan & indigo stars
          if (star.glow) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2.8, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.globalAlpha = alpha * 0.4;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = '#e0f2fe';
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#38bdf8';
          ctx.fill();
        } else if (isDark) {
          // Professional Dark Theme: Crisp silver & sky points
          if (star.glow) {
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.globalAlpha = alpha * 0.3;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#7dd3fc';
          ctx.fill();
        } else {
          // Professional Light Theme: Rich, clearly visible luminous azure/sky stars!
          // Soft ambient sky blue aura
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.globalAlpha = alpha * 0.35;
          ctx.fill();

          // Luminous sky core with crisp shadow depth
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 1.35, 0, Math.PI * 2);
          ctx.fillStyle = '#0284c7'; // Deep, crisp sky-600
          ctx.globalAlpha = Math.max(0.65, alpha);
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#0ea5e9';
          ctx.fill();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', initStars);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    initStars();

    const startTimer = setTimeout(() => {
      draw();
    }, 150);

    return () => {
      clearTimeout(startTimer);
      observer.disconnect();
      window.removeEventListener('resize', initStars);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [resolvedTheme, enabled]);

  // If Visual Effects: NO, remove completely from DOM
  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-30 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}

export default BackgroundSpace;
