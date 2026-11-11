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

// Enough copies for one half to cover a wide viewport, so the -50% loop
// never shows a gap.
const SEQUENCE = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

export function Marquee() {
  const marqueeRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.to('[data-marquee="track"]', {
            xPercent: -50,
            duration: 26,
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
      <div className="absolute inset-x-0 top-11 h-[calc(100%-2.75rem)] rotate-[1.1deg] rounded-2xl border-2 border-ink bg-mustard" />
      <div className="relative -rotate-[1.1deg] overflow-hidden rounded-2xl border-2 border-ink bg-ink py-4 text-cream shadow-cartoon md:py-5">
        <div data-marquee="track" className="flex w-max items-center">
          {half}
          {half}
        </div>
      </div>
    </div>
  );
}
