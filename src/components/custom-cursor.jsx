'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

const glowColors = {
  light: '#0062ff', // Blue for light theme
  dark: '#a855f7', // Purple for dark theme
  nebula: '#3b82f6', // Blue for Cosmic Nebula
};

export function CustomCursor() {
  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  const [mounted, setMounted] = useState(false);
  const mouseRef = useRef({ x: -100, y: -100 });
  const ballsRef = useRef([]);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    setMounted(true);
    if (window.innerWidth < 1024) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // 12 streamlined physics balls
    const count = 12;
    ballsRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 8 + 8,
      mass: 1,
    }));

    ballsRef.current.forEach((b) => {
      b.mass = b.radius * b.radius;
    });

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const currentTheme = themeRef.current;
      const currentColor = glowColors[currentTheme] || glowColors.dark;
      const balls = ballsRef.current;
      const mouse = mouseRef.current;

      for (let i = 0; i < balls.length; i++) {
        const b = balls[i];

        // 1. Attraction to Cursor
        const dx = mouse.x - b.x;
        const dy = mouse.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 500) {
          const force = (500 - dist) / 500;
          const strength = 0.07;
          b.vx += dx * force * strength;
          b.vy += dy * force * strength;
        }

        // 2. Apply Velocity
        b.x += b.vx;
        b.y += b.vy;

        // 3. Friction / Damping
        b.vx *= 0.94;
        b.vy *= 0.94;

        // 4. Wall Collisions
        if (b.x < b.radius) {
          b.x = b.radius;
          b.vx *= -0.8;
        } else if (b.x > canvas.width - b.radius) {
          b.x = canvas.width - b.radius;
          b.vx *= -0.8;
        }

        if (b.y < b.radius) {
          b.y = b.radius;
          b.vy *= -0.8;
        } else if (b.y > canvas.height - b.radius) {
          b.y = canvas.height - b.radius;
          b.vy *= -0.8;
        }

        // 5. Inter-ball Collisions
        for (let j = i + 1; j < balls.length; j++) {
          const b2 = balls[j];
          const cdx = b2.x - b.x;
          const cdy = b2.y - b.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          const minDist = b.radius + b2.radius;

          if (cdist < minDist && cdist > 0) {
            const overlap = minDist - cdist;
            const nx = cdx / cdist;
            const ny = cdy / cdist;

            const totalMass = b.mass + b2.mass;
            b.x -= nx * overlap * (b2.mass / totalMass);
            b.y -= ny * overlap * (b2.mass / totalMass);
            b2.x += nx * overlap * (b.mass / totalMass);
            b2.y += ny * overlap * (b.mass / totalMass);

            const v1n = b.vx * nx + b.vy * ny;
            const v2n = b2.vx * nx + b2.vy * ny;

            if (v1n - v2n > 0) {
              const impulse = (1.9 * (v1n - v2n)) / totalMass;
              b.vx -= impulse * b2.mass * nx;
              b.vy -= impulse * b2.mass * ny;
              b2.vx += impulse * b.mass * nx;
              b2.vy += impulse * b.mass * ny;
            }
          }
        }

        // 6. Draw Ball with fast GPU-friendly radial gradient (Zero shadowBlur overhead)
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);

        const grad = ctx.createRadialGradient(
          b.x - b.radius * 0.25,
          b.y - b.radius * 0.25,
          b.radius * 0.1,
          b.x,
          b.y,
          b.radius
        );
        grad.addColorStop(0, 'rgba(255,255,255,0.75)');
        grad.addColorStop(0.35, currentColor);
        grad.addColorStop(1, 'rgba(0,0,0,0.12)');

        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();
      }

      animationFrame = requestAnimationFrame(render);
    };

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;

        const target = e.target;
        const isP =
          target &&
          (window.getComputedStyle(target).cursor === 'pointer' ||
            target.tagName === 'BUTTON' ||
            target.tagName === 'A' ||
            target.closest('button') ||
            target.closest('a'));

        const innerShape = cursorRef.current.firstElementChild;
        if (innerShape) {
          if (isP) {
            innerShape.classList.add('scale-150');
          } else {
            innerShape.classList.remove('scale-150');
          }
        }
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    render();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Physics Balls Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-[999998]"
      />

      {/* Simple Shield Cursor (Main Pointer) */}
      <div
        ref={cursorRef}
        className="custom-cursor-container fixed top-0 left-0 w-0 h-0 pointer-events-none z-[999999] will-change-transform"
        style={{ '--cursor-color': glowColors[theme] || glowColors.dark }}
      >
        <div className="custom-cursor relative w-6 h-6 -left-3 -top-3 transition-transform duration-200">
          <div className="cursor-pointer-shape">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 3.21V20.8L9.9 16.4L11.5 20.3L14.6 19.1L13.1 15.2H18.5L5.5 3.21Z"
                fill="#000"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          {/* Subtle Aura for the Main Pointer */}
          <div className="pointer-aura" />
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 1024px) {
          .custom-cursor-container,
          canvas {
            display: none;
          }
        }

        .pointer-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: var(--cursor-color);
          filter: blur(15px);
          opacity: 0.4;
          border-radius: 50%;
          z-index: -1;
        }
      `}</style>
    </>
  );
}
