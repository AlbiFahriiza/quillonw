"use client";

import { useRef } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { getTier } from "@/lib/quality";
import {
  GLYPH_CENTERS,
  GLYPH_PATHS,
  STAR,
  VIEWBOX,
} from "@/lib/coming-soon-paths";

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

const SHADOW = 9; // viewBox units, reads as the site's hard offset shadow
const MORPH_SECONDS = 0.75;
const LETTER_STAGGER = 0.045;
const HOLD_SECONDS = 1.1;
const ENTRANCE_DELAY = 0.45;

// Static tilt and lift per letter so the line reads hand-set, not typed.
const LETTER_PLAY = [
  { rotate: -5, y: -7 },
  { rotate: 4, y: 6 },
  { rotate: -3, y: -4 },
  { rotate: 5, y: 7 },
  { rotate: -4, y: -6 },
  { rotate: 3, y: 4 },
  { rotate: -5, y: -7 },
  { rotate: 4, y: 6 },
  { rotate: -3, y: -5 },
  { rotate: 5, y: 7 },
] as const;

function starPath(points: number, outer: number, inner: number): string {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    coords.push(
      `${(STAR.x + radius * Math.cos(angle)).toFixed(1)},${(STAR.y + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return `M${coords.join("L")}Z`;
}

const R = STAR.size / 2;
// Sparkle, five-point, burst, eight-point: the separator changes shape with each font.
const STAR_PATHS = [
  starPath(4, R, R * 0.28),
  starPath(5, R, R * 0.45),
  starPath(6, R, R * 0.4),
  starPath(8, R, R * 0.55),
];

export function ComingSoonMorph() {
  const rootRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const glyphs = gsap.utils.toArray<SVGGElement>("[data-cs-glyph]", root);
      const paths = gsap.utils.toArray<SVGPathElement>("[data-cs-path]", root);
      const star = root.querySelector<SVGPathElement>("[data-cs-star]");
      if (!star) return;

      // The stylesheet parked the glyphs below the viewBox for first paint.
      glyphs.forEach((glyph) => {
        glyph.style.translate = "none";
      });

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          glyphs.forEach((glyph, index) => {
            gsap.set(glyph, {
              y: VIEWBOX.height + 16,
              svgOrigin: `${GLYPH_CENTERS[index]} ${VIEWBOX.baseline}`,
            });
          });
          gsap.set(star, { svgOrigin: `${STAR.x} ${STAR.y}` });

          const entrance = gsap.to(glyphs, {
            y: 0,
            duration: 0.9,
            stagger: 0.05,
            delay: ENTRANCE_DELAY,
            ease: "back.out(1.5)",
          });

          const spin = gsap.to(star, {
            rotation: 360,
            duration: 16,
            ease: "none",
            repeat: -1,
            paused: true,
          });

          // One cycle per font; the last step returns to the first font so the loop is seamless.
          const loop = gsap.timeline({
            repeat: -1,
            paused: true,
            defaults: { ease: "power3.inOut" },
          });
          const cycle = MORPH_SECONDS + LETTER_STAGGER * (glyphs.length - 1) + HOLD_SECONDS;
          for (let step = 1; step <= GLYPH_PATHS.length; step++) {
            const next = step % GLYPH_PATHS.length;
            const base = (step - 1) * cycle;
            paths.forEach((path, index) => {
              const at = base + index * LETTER_STAGGER;
              loop.to(
                path,
                { morphSVG: { shape: GLYPH_PATHS[next][index] }, duration: MORPH_SECONDS },
                at,
              );
              // Squash, then spring back: the letter feels like it is poured into the next shape.
              loop.to(
                glyphs[index],
                { scaleX: 1.12, scaleY: 0.8, duration: 0.16, ease: "power2.in" },
                at,
              );
              loop.to(
                glyphs[index],
                { scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1,0.4)" },
                at + 0.16,
              );
            });
            loop.to(
              star,
              { morphSVG: { shape: STAR_PATHS[next] }, duration: MORPH_SECONDS },
              base,
            );
            // A struggling device finishes the shape it is in and stops there, never mid-morph.
            loop.call(
              () => {
                if (getTier() < 2) {
                  loop.pause();
                  spin.pause();
                }
              },
              undefined,
              base + MORPH_SECONDS + LETTER_STAGGER * (glyphs.length - 1) + 0.9,
            );
          }

          // Pause when off screen, and hold the loop back until the entrance has landed.
          let ready = false;
          const gate = ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => {
              const run = ready && self.isActive && getTier() === 2;
              loop.paused(!run);
              spin.paused(!run);
            },
          });
          const start = gsap.delayedCall(ENTRANCE_DELAY + 1.4 + HOLD_SECONDS, () => {
            ready = true;
            const run = gate.isActive && getTier() === 2;
            loop.paused(!run);
            spin.paused(!run);
          });

          return () => {
            entrance.kill();
            loop.kill();
            spin.kill();
            start.kill();
            gate.kill();
          };
        });
    },
    { scope: rootRef },
  );

  return (
    <svg
      ref={rootRef}
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      aria-hidden="true"
      className="block w-full max-w-[46rem] overflow-hidden"
    >
      <g fill="var(--color-tomato)">
        {GLYPH_PATHS[0].map((d, index) => {
          const play = LETTER_PLAY[index];
          return (
            <g
              key={index}
              transform={`rotate(${play.rotate} ${GLYPH_CENTERS[index]} ${VIEWBOX.baseline - 38}) translate(0 ${play.y})`}
            >
              <g data-cs-glyph>
                <use
                  href={`#cs-glyph-${index}`}
                  transform={`translate(${SHADOW} ${SHADOW})`}
                  fill="var(--color-ink)"
                />
                <path id={`cs-glyph-${index}`} data-cs-path d={d} />
              </g>
            </g>
          );
        })}
        <path
          data-cs-star
          d={STAR_PATHS[0]}
          fill="var(--color-mustard)"
          stroke="var(--color-ink)"
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
