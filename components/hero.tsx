"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  SquiggleIcon,
  StarBurstIcon,
  StarSparkleIcon,
  TealDiscIcon,
} from "@/components/icons";

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

const FLOAT_TWEENS = [
  { selector: '[data-float="sparkle"]', vars: { y: -14, rotate: 14, duration: 2.6, delay: 1.4 } },
  { selector: '[data-float="disc"]', vars: { y: 12, x: -8, duration: 3.4, delay: 0.9 } },
  { selector: '[data-float="burst"]', vars: { y: -10, rotate: -12, duration: 3, delay: 1.9 } },
  { selector: '[data-float="squiggle"]', vars: { y: 10, duration: 2.2, delay: 1.1 } },
] as const;

function playEntrance() {
  const entrance = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.85 },
  });
  entrance
    .from('[data-hero="wordmark"]', { y: 42, autoAlpha: 0 })
    .from('[data-hero="headline"]', { y: 52, autoAlpha: 0 }, "-=0.6")
    .from('[data-hero="coming-soon"]', { y: 34, autoAlpha: 0 }, "-=0.6")
    .from(
      '[data-hero="shape"]',
      {
        scale: 0,
        autoAlpha: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: "back.out(2.4)",
      },
      "-=0.45",
    );

  for (const { selector, vars } of FLOAT_TWEENS) {
    gsap.to(selector, { ...vars, repeat: -1, yoyo: true, ease: "sine.inOut" });
  }
}

function applyFontCycle(element: HTMLElement, index: number) {
  const font = FONT_CYCLE[index];
  element.style.fontFamily = font.family;
  element.style.fontWeight = font.weight;
  element.style.fontStyle = font.style;
}

// Each swap rides a letter-by-letter ripple: fade out, swap the family while
// the letters are hidden, then stagger the new family back in. Exit, enter
// and the repeat delay add up to about one second per family.
function startFontCycle(
  cycling: HTMLElement,
  letters: HTMLElement[],
): () => void {
  const state = { index: 0 };
  const cycle = gsap.timeline({ delay: 1.6, repeat: -1, repeatDelay: 0.2 });

  cycle
    .to(letters, {
      autoAlpha: 0,
      yPercent: -30,
      duration: 0.14,
      stagger: 0.01,
      ease: "power1.in",
    })
    .call(() => {
      state.index = (state.index + 1) % FONT_CYCLE.length;
      applyFontCycle(cycling, state.index);
    })
    .fromTo(
      letters,
      { autoAlpha: 0, yPercent: 40 },
      {
        autoAlpha: 1,
        yPercent: 0,
        duration: 0.3,
        stagger: 0.028,
        ease: "back.out(1.8)",
        immediateRender: false,
      },
    );

  return () => cycle.kill();
}

function startReducedMotionCycle(cycling: HTMLElement): () => void {
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
            <span data-cs-letter className="inline-block">
              {letter}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function HeroShapes() {
  return (
    <>
      <div
        data-hero="shape"
        data-float="sparkle"
        aria-hidden="true"
        className="absolute left-[7%] top-[20%] hidden text-mustard md:block"
      >
        <StarSparkleIcon className="h-14 w-14" />
      </div>
      <div
        data-hero="shape"
        data-float="disc"
        aria-hidden="true"
        className="absolute right-[9%] top-[26%] hidden text-teal md:block"
      >
        <TealDiscIcon className="h-16 w-16" />
      </div>
      <div
        data-hero="shape"
        data-float="burst"
        aria-hidden="true"
        className="absolute bottom-[26%] right-[15%] hidden text-tomato lg:block"
      >
        <StarBurstIcon className="h-12 w-12" />
      </div>
      <div
        data-hero="shape"
        data-float="squiggle"
        aria-hidden="true"
        className="absolute bottom-[18%] left-[12%] hidden text-ink lg:block"
      >
        <SquiggleIcon className="h-8 w-20" />
      </div>
    </>
  );
}

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const comingSoonRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const cycling = comingSoonRef.current;
      if (!cycling) return;
      const letters = gsap.utils.toArray<HTMLElement>(
        "[data-cs-letter]",
        cycling,
      );

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
          return startFontCycle(cycling, letters);
        })
        .add("(prefers-reduced-motion: reduce)", () =>
          startReducedMotionCycle(cycling),
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
      <HeroShapes />

      <p
        data-hero="wordmark"
        className="pl-[0.5em] font-grotesk text-sm font-medium uppercase tracking-[0.5em] text-ink md:text-base"
      >
        Quillon
      </p>

      <h1
        data-hero="headline"
        className="mt-6 max-w-5xl font-grotesk text-6xl font-bold leading-[1.04] tracking-tight text-ink sm:text-7xl lg:text-8xl"
      >
        Code the <span className="marker-highlight">frame.</span>
      </h1>

      {/* Fixed height in em keeps the layout steady while the family swaps. */}
      <p
        data-hero="coming-soon"
        className="mt-12 flex h-[1.4em] items-center justify-center text-[clamp(1.5rem,9vw,5.25rem)]"
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
