"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { StarBurstIcon } from "@/components/icons";

// Sans -> Serif -> Monospace -> Display, one family per second. Playfair is
// loaded italic-only and Bungee ships in 400 alone, so every entry carries the
// weight and style that actually exist for that family.
const FONT_CYCLE = [
  { family: "var(--ff-grotesk)", weight: "700", style: "normal" },
  { family: "var(--ff-playfair)", weight: "700", style: "italic" },
  { family: "var(--ff-spacemono)", weight: "700", style: "normal" },
  { family: "var(--ff-bungee)", weight: "400", style: "normal" },
] as const;

const FONT_CYCLE_MS = 1000;

const WORDS = ["COMING", "SOON"];

// Static tilt and lift per letter so the big line reads hand-set, not typed.
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

function playEntrance() {
  // Translate-only entrance (rule 2.1 bans opacity). The starting offsets
  // come from the hero-initial CSS block, which only applies when scripting
  // is enabled, so the first paint already shows the offset state.
  const entrance = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.85 },
  });
  entrance
    .to('[data-hero="wordmark"]', { y: 0, overwrite: "auto" })
    .to('[data-hero="headline"]', { y: 0 }, "-=0.6")
    .to('[data-hero="coming-soon"]', { y: 0 }, "-=0.6");
}

function applyFontCycle(element: HTMLElement, index: number) {
  const font = FONT_CYCLE[index];
  element.style.fontFamily = font.family;
  element.style.fontWeight = font.weight;
  element.style.fontStyle = font.style;
}

// Swaps the family instantly, no fade: the sudden change of face is the
// whole effect.
function startFontCycle(cycling: HTMLElement): () => void {
  let index = 0;
  const timer = window.setInterval(() => {
    index = (index + 1) % FONT_CYCLE.length;
    applyFontCycle(cycling, index);
  }, FONT_CYCLE_MS);
  return () => window.clearInterval(timer);
}

function ComingSoonWord({ word, offset }: { word: string; offset: number }) {
  return (
    <span className="flex items-center gap-x-[0.06em]">
      {word.split("").map((letter, index) => {
        const play = LETTER_PLAY[(offset + index) % LETTER_PLAY.length];
        return (
          <span
            key={`${letter}-${index}`}
            className="inline-block"
            style={{ transform: `rotate(${play.rotate}deg) translateY(${play.y}%)` }}
          >
            {letter}
          </span>
        );
      })}
    </span>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const comingSoonRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const cycling = comingSoonRef.current;
      if (!cycling) return;

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          playEntrance();
          gsap.to("[data-cs-star]", {
            rotation: "+=360",
            duration: 16,
            ease: "none",
            repeat: -1,
          });
          return startFontCycle(cycling);
        })
        .add("(prefers-reduced-motion: reduce)", () =>
          startFontCycle(cycling),
        );
    },
    { scope: heroRef },
  );

  return (
    <section
      ref={heroRef}
      aria-label="Quillon is coming soon"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 text-center"
    >
      <p
        data-hero="wordmark"
        className="hero-initial hero-initial-wordmark pl-[0.5em] font-grotesk text-sm font-medium uppercase tracking-[0.5em] text-ink md:text-base"
      >
        Quillon
      </p>

      <h1
        data-hero="headline"
        className="hero-initial hero-initial-headline mt-6 max-w-5xl font-grotesk text-6xl font-bold leading-[1.04] tracking-tight text-ink sm:text-7xl lg:text-8xl"
      >
        Code the <span className="marker-highlight">frame.</span>
      </h1>

      {/* Fixed height in em keeps the layout steady while the family swaps. */}
      <p
        data-hero="coming-soon"
        className="hero-initial hero-initial-coming-soon mt-12 flex h-[1.4em] items-center justify-center text-[clamp(1.5rem,9vw,5.25rem)]"
      >
        <span className="sr-only">Coming soon</span>
        <span
          ref={comingSoonRef}
          aria-hidden="true"
          className="flex items-center gap-x-[0.35em] whitespace-nowrap leading-none text-tomato"
          style={{
            fontFamily: FONT_CYCLE[0].family,
            fontWeight: FONT_CYCLE[0].weight,
            fontStyle: FONT_CYCLE[0].style,
          }}
        >
          <ComingSoonWord word={WORDS[0]} offset={0} />
          <ComingSoonWord word={WORDS[1]} offset={WORDS[0].length} />
          <StarBurstIcon
            data-cs-star
            className="h-[0.5em] w-[0.5em] shrink-0 -rotate-12 text-mustard"
          />
        </span>
      </p>

      {/* Preloads the three families that only appear once the cycle reaches them. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute select-none opacity-0"
      >
        <span style={{ fontFamily: "var(--ff-playfair)" }} className="italic">
          a
        </span>
        <span style={{ fontFamily: "var(--ff-spacemono)" }}>a</span>
        <span style={{ fontFamily: "var(--ff-bungee)" }}>a</span>
      </span>
    </section>
  );
}
