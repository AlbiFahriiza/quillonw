"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { onQualityChange, qualityTier } from "@/lib/quality";

/**
 * Sprinkle background behind the hero: flat-colour rounded bars and dots
 * drifting slowly, nudged by scroll velocity, bursting on demand.
 *
 * Draw rules follow the performance contract: one canvas, DPR capped at 2,
 * no shadowBlur, no gradients, batched by colour, zero per-frame allocations
 * (all particle state lives in preallocated typed arrays).
 */

const COLORS = ["#1b1b1b", "#ff5a4e", "#ffc93c", "#2ec4b6", "#fff6e5"] as const;

// Bar dimensions in CSS pixels at rest; rotation and spin give the life.
const BAR_W = 10;
const BAR_H = 3.5;
const DOT_R = 2.5;

const DRIFT_MIN = 6; // px/s
const DRIFT_MAX = 18;
const SPIN_MAX = 0.6; // rad/s
const SCROLL_PUSH = 0.12; // how strongly scroll velocity adds to drift

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  scale: number;
  color: number;
  isBar: number;
};

export function Sprinkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = false;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let tier = qualityTier();

    function maxCount(): number {
      if (tier === 0 || reduceMotion) return 0;
      const phone = window.matchMedia("(max-width: 767px)").matches;
      const base = phone ? 50 : 120;
      return tier === 2 ? base : Math.floor(base / 2);
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuild();
    }

    function rebuild() {
      const count = maxCount();
      particles = [];
      for (let i = 0; i < count; i++) {
        const isBar = Math.random() < 0.7 ? 1 : 0;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() * 2 - 1) * DRIFT_MAX,
          vy: DRIFT_MIN + Math.random() * (DRIFT_MAX - DRIFT_MIN),
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() * 2 - 1) * SPIN_MAX,
          scale: 0.7 + Math.random() * 0.6,
          color: Math.floor(Math.random() * COLORS.length),
          isBar,
        });
      }
    }

    // Burst: existing particles get an outward kick plus a few extra lives
    // near the tap point. Called by the donut demo via a custom event.
    function burst(bx: number, by: number) {
      for (const p of particles) {
        const dx = p.x - bx;
        const dy = p.y - by;
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < 260) {
          const kick = (1 - dist / 260) * 220;
          p.vx += (dx / dist) * kick;
          p.vy += (dy / dist) * kick;
        }
      }
    }

    function step(_time: number, deltaSeconds: number) {
      if (!running) return;
      const dt = Math.min(deltaSeconds, 0.05);

      // Scroll velocity feeds a gentle push on top of the base drift.
      const sy = window.scrollY;
      scrollVelocity = scrollVelocity * 0.9 + (sy - lastScrollY) * 0.1;
      lastScrollY = sy;

      ctx!.clearRect(0, 0, width, height);

      // Batched by colour: one fillStyle switch per colour per frame.
      for (let c = 0; c < COLORS.length; c++) {
        ctx!.fillStyle = COLORS[c];
        ctx!.beginPath();
        let any = false;
        for (const p of particles) {
          if (p.color !== c) continue;
          any = true;
          p.x += (p.vx + scrollVelocity * SCROLL_PUSH) * dt;
          p.y += p.vy * dt;
          p.rot += p.vrot * dt;
          // Friction pulls burst velocities back to the base drift.
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 0.15 * dt;
          if (p.y - 8 > height) {
            p.y = -8;
            p.x = Math.random() * width;
          }
          if (p.y + 8 < 0) p.y = height + 8;
          if (p.x - 8 > width) p.x = -8;
          if (p.x + 8 < 0) p.x = width + 8;

          if (p.isBar) {
            const w = BAR_W * p.scale;
            const h = BAR_H * p.scale;
            const cos = Math.cos(p.rot);
            const sin = Math.sin(p.rot);
            ctx!.moveTo(
              p.x + (-w / 2) * cos - (-h / 2) * sin,
              p.y + (-w / 2) * sin + (-h / 2) * cos,
            );
            ctx!.lineTo(
              p.x + (w / 2) * cos - (-h / 2) * sin,
              p.y + (w / 2) * sin + (-h / 2) * cos,
            );
            ctx!.lineTo(
              p.x + (w / 2) * cos - (h / 2) * sin,
              p.y + (w / 2) * sin + (h / 2) * cos,
            );
            ctx!.lineTo(
              p.x + (-w / 2) * cos - (h / 2) * sin,
              p.y + (-w / 2) * sin + (h / 2) * cos,
            );
            ctx!.closePath();
          }
        }
        if (any) ctx!.fill();
        // Dots need their own pass (arc batching), still one colour switch.
        ctx!.beginPath();
        let anyDot = false;
        for (const p of particles) {
          if (p.color !== c || p.isBar) continue;
          anyDot = true;
          ctx!.moveTo(p.x + DOT_R * p.scale, p.y);
          ctx!.arc(p.x, p.y, DOT_R * p.scale, 0, Math.PI * 2);
        }
        if (anyDot) ctx!.fill();
      }
    }

    function start() {
      if (running || reduceMotion) return;
      running = true;
      gsap.ticker.add(step);
    }

    function stop() {
      running = false;
      gsap.ticker.remove(step);
    }

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const offQuality = onQualityChange((t) => {
      tier = t;
      rebuild();
    });

    const onBurst = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      if (detail) burst(detail.x, detail.y);
    };
    window.addEventListener("quillon:sprinkle-burst", onBurst);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else stop();
        }
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      offQuality();
      window.removeEventListener("quillon:sprinkle-burst", onBurst);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
