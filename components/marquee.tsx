"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { StarSparkleIcon } from "@/components/icons";

const MARQUEE_ITEMS = [
  "Write code",
  "Edit programmatically",
  "Render cinema",
  "Code the frame",
];

const STAR_COLORS = ["text-mustard", "text-teal", "text-tomato", "text-cream"];

// One half of the track must be wider than the widest supported viewport
// (~5K), otherwise the -50% loop runs out of items before the right edge.
const SEQUENCE_COPIES = 6;
const SEQUENCE = Array.from(
  { length: SEQUENCE_COPIES },
  () => MARQUEE_ITEMS,
).flat();

// The loop shifts one half (SEQUENCE_COPIES x items) per repeat, so the
// duration must scale with the copies to keep the pixels-per-second steady.
const LOOP_SECONDS = 26 * (SEQUENCE_COPIES / 3);

export function Marquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.to('[data-marquee="track"]', {
            xPercent: -50,
            duration: LOOP_SECONDS,
            ease: "none",
            repeat: -1,
          });
        });
    },
    { scope: marqueeRef },
  );

  const half = (
    <>
      {SEQUENCE.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center">
          <span className="mx-7 whitespace-nowrap font-mono text-sm font-bold uppercase tracking-[0.22em] md:mx-9 md:text-base">
            {item}
          </span>
          <StarSparkleIcon
            className={`h-4 w-4 shrink-0 ${STAR_COLORS[index % STAR_COLORS.length]}`}
          />
        </span>
      ))}
    </>
  );

  return (
    <div ref={marqueeRef} aria-hidden="true" className="relative z-10 select-none overflow-hidden py-8">
      {/* Bleed 2vw past each edge so the tilt never uncovers a corner. */}
      <div className="absolute inset-x-[-2vw] top-11 h-[calc(100%-2.75rem)] rotate-[1.1deg] rounded-2xl border-2 border-ink bg-mustard" />
      <div className="relative mx-[-2vw] -rotate-[1.1deg] overflow-hidden rounded-2xl border-2 border-ink bg-ink py-4 text-cream shadow-cartoon md:py-5">
        <div data-marquee="track" className="flex w-max items-center">
          {half}
          {half}
        </div>
      </div>
    </div>
  );
}
