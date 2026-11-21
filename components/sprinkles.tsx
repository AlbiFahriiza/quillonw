"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { getTier, subscribeTier } from "@/lib/quality";

const EVENT = "quillon:sprinkles";

export type SprinkleDetail = {
  x: number; // client coordinates
  y: number;
  count?: number;
  mode?: "burst" | "rain";
  width?: number; // rain only: horizontal spread in px
};

export function emitSprinkles(detail: SprinkleDetail) {
  window.dispatchEvent(new CustomEvent<SprinkleDetail>(EVENT, { detail }));
}

const PALETTE: [string, string][] = [
  ["--color-tomato", "#ff5a4e"],
  ["--color-mustard", "#ffc93c"],
  ["--color-teal", "#2ec4b6"],
  ["--color-ink", "#1b1b1b"],
];
// Mostly the three brights, ink only as an accent.
const COLOR_PICK = [0, 1, 2, 0, 1, 2, 3];
const GRAVITY = 900;

const easeOutBack = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
};
// Particles pop in by scale; nothing here ever changes opacity.
const grow = (age: number) => (age <= 0 ? 0 : age < 0.45 ? easeOutBack(age / 0.45) : 1);

export function Sprinkles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rootStyle = getComputedStyle(document.documentElement);
    const colors = PALETTE.map(([name, fallback]) => rootStyle.getPropertyValue(name).trim() || fallback);

    const small = window.matchMedia("(max-width: 767px)").matches;
    const AMBIENT = small ? 46 : 110;
    const BURST = 70;
    const N = AMBIENT + BURST;
    const BASE = small ? 9 : 12;

    const x = new Float32Array(N), y = new Float32Array(N);
    const vx = new Float32Array(N), vy = new Float32Array(N);
    const rot = new Float32Array(N), vr = new Float32Array(N);
    const size = new Float32Array(N), depth = new Float32Array(N);
    const born = new Float32Array(N), life = new Float32Array(N);
    const kind = new Uint8Array(N); // 0 dead, 1 ambient, 2 burst
    const col = new Uint8Array(N);

    let width = 1, height = 1, dpr = 1;
    let time = 0;
    let visible = true;
    let tier = getTier();
    let ambientLimit = AMBIENT;

    const pickColor = () => COLOR_PICK[Math.floor(Math.random() * COLOR_PICK.length)];

    const seedAmbient = (i: number, anywhere: boolean) => {
      depth[i] = 0.55 + Math.random() * 0.45;
      x[i] = Math.random() * width;
      y[i] = anywhere ? Math.random() * height : -20;
      vx[i] = (Math.random() - 0.5) * 10;
      vy[i] = (10 + Math.random() * 22) * depth[i];
      rot[i] = Math.random() * Math.PI;
      vr[i] = (Math.random() - 0.5) * 1.2;
      size[i] = BASE * (0.8 + Math.random() * 0.5) * depth[i];
      col[i] = pickColor();
      born[i] = reduceMotion ? -10 : time + Math.random() * 1.6;
      life[i] = Infinity;
      kind[i] = 1;
    };

    const applyTier = () => {
      ambientLimit = tier === 2 ? AMBIENT : tier === 1 ? Math.round(AMBIENT * 0.4) : 0;
      for (let i = ambientLimit; i < AMBIENT; i++) kind[i] = 0;
      // An idle canvas still costs a compositor layer, so tier 0 removes it entirely.
      canvas.style.display = tier === 0 ? "none" : "block";
    };

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, box.width);
      height = Math.max(1, box.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      if (reduceMotion) draw(0);
    };

    const hasRoundRect = typeof ctx.roundRect === "function";
    const draw = (scrollY: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < N; i++) {
        if (kind[i] === 0) continue;
        const age = time - born[i];
        let s = grow(age);
        if (kind[i] === 2 && life[i] - age < 0.35) s = Math.max(0, (life[i] - age) / 0.35);
        if (s < 0.02) continue;
        const parallax = kind[i] === 1 ? -scrollY * 0.18 * (depth[i] - 0.5) : 0;
        const c = Math.cos(rot[i]) * dpr, n = Math.sin(rot[i]) * dpr;
        ctx.setTransform(c, n, -n, c, x[i] * dpr, (y[i] + parallax) * dpr);
        ctx.fillStyle = colors[col[i]];
        const w = size[i] * s, h = w * 0.38;
        if (hasRoundRect) {
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
          ctx.fill();
        } else {
          ctx.fillRect(-w / 2, -h / 2, w, h);
        }
      }
    };

    const tick = (_: number, deltaMs: number) => {
      if (!visible || tier === 0 || document.hidden) return;
      const dt = Math.min(deltaMs, 50) / 1000;
      time += dt;
      for (let i = 0; i < N; i++) {
        if (kind[i] === 0) continue;
        if (kind[i] === 1) {
          x[i] += (vx[i] + Math.sin(time * 0.6 + i) * 8) * dt;
          y[i] += vy[i] * dt;
          rot[i] += vr[i] * dt;
          if (y[i] > height + 20) seedAmbient(i, false);
          if (x[i] < -20) x[i] = width + 20;
          else if (x[i] > width + 20) x[i] = -20;
        } else {
          vy[i] += GRAVITY * dt;
          vx[i] *= 1 - 1.4 * dt;
          x[i] += vx[i] * dt;
          y[i] += vy[i] * dt;
          rot[i] += vr[i] * dt;
          if (time - born[i] > life[i]) kind[i] = 0;
        }
      }
      draw(window.scrollY);
    };

    const onSprinkles = (event: Event) => {
      if (tier === 0 || reduceMotion) return;
      const { x: cx, y: cy, count = 26, mode = "burst", width: spread = 0 } = (event as CustomEvent<SprinkleDetail>).detail;
      const box = canvas.getBoundingClientRect();
      const bx = cx - box.left, by = cy - box.top;
      let todo = Math.round(count * (tier === 1 ? 0.5 : 1) * (small ? 0.7 : 1));
      for (let i = AMBIENT; i < N && todo > 0; i++) {
        if (kind[i] !== 0) continue;
        todo--;
        const speed = 220 + Math.random() * 300;
        if (mode === "rain") {
          x[i] = bx + (Math.random() - 0.5) * spread;
          y[i] = by - Math.random() * 40;
          vx[i] = (Math.random() - 0.5) * 40;
          vy[i] = 60 + Math.random() * 140;
        } else {
          const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
          x[i] = bx; y[i] = by;
          vx[i] = Math.cos(angle) * speed;
          vy[i] = Math.sin(angle) * speed;
        }
        rot[i] = Math.random() * Math.PI;
        vr[i] = (Math.random() - 0.5) * 14;
        size[i] = BASE * (1 + Math.random() * 0.4);
        depth[i] = 1;
        col[i] = pickColor();
        born[i] = time;
        life[i] = 1.6 + Math.random() * 0.8;
        kind[i] = 2;
      }
    };

    resize();
    for (let i = 0; i < AMBIENT; i++) seedAmbient(i, true);
    if (reduceMotion) draw(0);
    applyTier();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(canvas);
    const unsubscribe = subscribeTier((next) => {
      tier = next;
      applyTier();
    });

    if (!reduceMotion) {
      gsap.ticker.add(tick);
      window.addEventListener(EVENT, onSprinkles);
    }
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener(EVENT, onSprinkles);
      observer.disconnect();
      visibility.disconnect();
      unsubscribe();
    };
  }, []);

  // The canvas is one viewport tall and sticks to the top while the hero is on screen,
  // so its backing store stays small no matter how tall the hero gets on a phone.
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <canvas ref={canvasRef} className="sticky top-0 block h-svh w-full" />
    </div>
  );
}
