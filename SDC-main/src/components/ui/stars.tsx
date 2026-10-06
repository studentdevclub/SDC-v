"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Star = {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  glow: boolean;
  layer: number; // 1 = deep, 2 = mid, 3 = foreground
};

type StarsBackgroundProps = React.ComponentProps<"div"> & {
  factor?: number;
  speed?: number;
  count?: number;
};

export function StarsBackground({
  children,
  className,
  factor = 0.025,
  speed = 10,
  count = 380,
  ...props
}: StarsBackgroundProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const starsRef = React.useRef<Star[]>([]);
  const mouseRef = React.useRef({ targetX: 0, targetY: 0, curX: 0, curY: 0 });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = 0;
    let lastTime = performance.now();

    const initStars = (w: number, h: number) => {
      const colors = [
        "rgba(255, 255, 255, ",
        "rgba(240, 245, 255, ",
        "rgba(255, 230, 200, ",
        "rgba(255, 170, 95, ",
      ];

      const starList: Star[] = [];
      const total = Math.max(120, Math.min(count, Math.floor((w * h) / 4000)));

      for (let i = 0; i < total; i++) {
        const rand = Math.random();
        let size = 0.7 + Math.random() * 0.9;
        let glow = false;
        let layer = 1;
        let color = colors[0];

        if (rand > 0.85) {
          // Shimmering prominent stars
          size = 1.6 + Math.random() * 1.2;
          glow = true;
          layer = 3;
          color = Math.random() > 0.5 ? colors[3] : colors[2];
        } else if (rand > 0.55) {
          // Mid stars
          size = 1.1 + Math.random() * 0.8;
          glow = Math.random() > 0.6;
          layer = 2;
          color = Math.random() > 0.7 ? colors[1] : colors[0];
        }

        starList.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size,
          baseAlpha: 0.35 + Math.random() * 0.55,
          twinkleSpeed: 1.2 + Math.random() * 2.8,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
          glow,
          layer,
        });
      }
      starsRef.current = starList;
    };

    const handleResize = () => {
      const parent = canvas.parentElement;
      const w = parent?.clientWidth || window.innerWidth;
      const h = parent?.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = w;
      height = h;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      initStars(w, h);
    };

    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseRef.current.targetX = -(e.clientX - cx) * factor;
      mouseRef.current.targetY = -(e.clientY - cy) * factor;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = document.visibilityState === "visible";
      if (isVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const render = (now: number) => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth mouse parallax lerp
      const m = mouseRef.current;
      m.curX += (m.targetX - m.curX) * 0.05;
      m.curY += (m.targetY - m.curY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // Render glowing & shimmering background stars
      const stars = starsRef.current;
      const upwardDrift = speed * dt;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        s.y -= upwardDrift * (0.4 + s.layer * 0.3);
        if (s.y < -10) s.y = height + 10;

        s.twinklePhase += s.twinkleSpeed * dt;
        const twinkle = 0.55 + 0.45 * Math.sin(s.twinklePhase);
        const alpha = Math.min(1, Math.max(0.12, s.baseAlpha * twinkle));

        const px = s.x + m.curX * (s.layer * 0.5);
        const py = s.y + m.curY * (s.layer * 0.5);

        ctx.save();
        if (s.glow) {
          ctx.shadowBlur = s.size * 3.5;
          ctx.shadowColor = `${s.color}${alpha * 0.9})`;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(px, py, s.size * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${alpha})`;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [factor, speed, count]);

  return (
    <div
      data-slot="stars-background"
      className={cn(
        "relative size-full overflow-hidden bg-[radial-gradient(ellipse_at_center,_#080612_0%,_#020106_100%)]",
        className
      )}
      {...props}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full select-none"
      />
      {children}
    </div>
  );
}

export default StarsBackground;
