"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import {
  PATHS,
  SLOTS,
  STAR_CX,
  STAR_CY,
  STAR_SHAPES,
  FONT_KEYS,
  VIEW_H,
  VIEW_W,
} from "@/lib/coming-soon-paths";
import { onQualityChange, qualityTier } from "@/lib/quality";

gsap.registerPlugin(MorphSVGPlugin);

// Static tilt and lift per slot so the big line reads hand-set, not typed.
// Values are percentages of the letter height, applied around the slot's
// ink centre baked into the generated data.
const LETTER_PLAY = [
  { rotate: -5, y: -6 },
  { rotate: 4, y: 5 },
  { rotate: -3, y: -3 },
  { rotate: 5, y: 6 },
  { rotate: -4, y: -5 },
  { rotate: 3, y: 3 },
  { rotate: -5, y: -6 },
  { rotate: 4, y: 5 },
  { rotate: -3, y: -4 },
  { rotate: 5, y: 6 },
] as const;

const MORPH_SECONDS = 0.7;
const STAGGER_SECONDS = 0.04;
const HOLD_SECONDS = 1.0;

export function ComingSoonMorph() {
  const wrapRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const paths = Array.from(
        wrap.querySelectorAll<SVGPathElement>("[data-cs-letter]"),
      );
      const star = wrap.querySelector<SVGPathElement>("[data-cs-star]");

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: reduce)", () => {
          // Final static state: first font's letters stay as rendered.
        })
        .add("(prefers-reduced-motion: no-preference)", () => {
          let fontIndex = 0;
          let starIndex = 0;
          let tier = qualityTier();
          const groups = wrap!.querySelectorAll("[data-cs-group]");
          let cancelled = false;
          let scheduledCall: gsap.core.Tween | null = null;

          const offQuality = onQualityChange((t) => {
            tier = t;
          });

          function playNextSwap() {
            fontIndex = (fontIndex + 1) % FONT_KEYS.length;
            starIndex = (starIndex + 1) % STAR_SHAPES.length;
            const target = PATHS[FONT_KEYS[fontIndex]];

            // Morph letter-to-letter (C into C) with a small stagger for the
            // wave feel; contour counts are equalised in the generated data.
            paths.forEach((path, index) => {
              gsap.to(path, {
                morphSVG: target[index],
                duration: MORPH_SECONDS,
                delay: index * STAGGER_SECONDS,
                ease: "power2.inOut",
              });
            });

            if (star) {
              gsap.to(star, {
                morphSVG: STAR_SHAPES[starIndex],
                duration: MORPH_SECONDS,
                ease: "power2.inOut",
              });
              gsap.to(star, {
                rotation: "+=90",
                duration: MORPH_SECONDS + HOLD_SECONDS,
                ease: "power1.inOut",
                transformOrigin: "50% 50%",
              });
            }

            // Squash and stretch overshoot on the letter groups: the
            // liquid feel, springy, never a plain linear.
            gsap.fromTo(
              groups,
              { scaleX: 1.06, scaleY: 0.92 },
              {
                scaleX: 1,
                scaleY: 1,
                duration: MORPH_SECONDS + 0.25,
                ease: "elastic.out(1, 0.45)",
                stagger: STAGGER_SECONDS,
              },
            );
          }

          // Swap -> hold -> swap. gsap.delayedCall rides the same ticker
          // clock as every other tween (rule 2.3: one animation clock).
          // Tier 0 freezes the cycle on the current face: simplified morph,
          // still a complete, animated-enough hero.
          function schedule() {
            if (cancelled) return;
            if (tier === 0) {
              scheduledCall = gsap.delayedCall(HOLD_SECONDS, schedule);
              return;
            }
            playNextSwap();
            scheduledCall = gsap.delayedCall(
              MORPH_SECONDS +
                STAGGER_SECONDS * paths.length +
                HOLD_SECONDS,
              schedule,
            );
          }
          schedule();

          return () => {
            cancelled = true;
            offQuality();
            scheduledCall?.kill();
            gsap.killTweensOf(paths);
            if (star) gsap.killTweensOf(star);
            gsap.killTweensOf(groups);
          };
        });
    },
    { scope: wrapRef },
  );

  const initial = PATHS[FONT_KEYS[0]];

  return (
    <span
      ref={wrapRef}
      aria-hidden="true"
      className="flex w-full items-center justify-center"
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-auto w-full"
        style={{ maxWidth: "34em" }}
      >
        {SLOTS.map((slot, index) => {
          const play = LETTER_PLAY[index % LETTER_PLAY.length];
          return (
            <g
              key={index}
              data-cs-group
              style={{ transformOrigin: `${slot.cx}px ${slot.cy}px` }}
              transform={`translate(0 ${(play.y * VIEW_H) / 100}) rotate(${play.rotate} ${slot.cx} ${slot.cy})`}
            >
              <path
                data-cs-letter
                d={initial[index]}
                fill="var(--color-tomato)"
              />
            </g>
          );
        })}
        <g transform={`translate(${STAR_CX} ${STAR_CY})`}>
          <path
            data-cs-star
            d={STAR_SHAPES[0]}
            fill="var(--color-mustard)"
            stroke="var(--color-ink)"
            strokeWidth={0.02}
          />
        </g>
      </svg>
    </span>
  );
}
