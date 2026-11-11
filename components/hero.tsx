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

// Sans -> Serif -> Monospace -> Display, cycled every second.
const COMING_SOON_FONTS = [
  "var(--ff-grotesk)",
  "var(--ff-playfair)",
  "var(--ff-spacemono)",
  "var(--ff-bungee)",
] as const;

const FONT_CYCLE_MS = 1000;
const FONT_FADE_SECONDS = 0.15;

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

function crossfadeToNextFont(element: HTMLElement, state: { index: number }) {
  gsap.to(element, {
    autoAlpha: 0,
    duration: FONT_FADE_SECONDS,
    ease: "power1.in",
    onComplete: () => {
      state.index = (state.index + 1) % COMING_SOON_FONTS.length;
      element.style.fontFamily = COMING_SOON_FONTS[state.index];
      gsap.to(element, {
        autoAlpha: 1,
        duration: FONT_FADE_SECONDS,
        ease: "power1.out",
      });
    },
  });
}

// The family starts rotating once the entrance has settled, so the crossfade
// never fights the hero animation on the same wrapper.
function startFontCycle(element: HTMLElement): () => void {
  const state = { index: 0 };
  let cycleTimer: number | undefined;

  const delayedStart = gsap.delayedCall(1.6, () => {
    cycleTimer = window.setInterval(
      () => crossfadeToNextFont(element, state),
      FONT_CYCLE_MS,
    );
  });

  return () => {
    delayedStart.kill();
    window.clearInterval(cycleTimer);
  };
}

function startReducedMotionCycle(element: HTMLElement): () => void {
  let fontIndex = 0;
  const timer = window.setInterval(() => {
    fontIndex = (fontIndex + 1) % COMING_SOON_FONTS.length;
    element.style.fontFamily = COMING_SOON_FONTS[fontIndex];
  }, FONT_CYCLE_MS);
  return () => window.clearInterval(timer);
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
      const comingSoon = comingSoonRef.current;
      if (!comingSoon) return;

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          playEntrance();
          return startFontCycle(comingSoon);
        })
        .add("(prefers-reduced-motion: reduce)", () =>
          startReducedMotionCycle(comingSoon),
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

      <p
        data-hero="coming-soon"
        className="mt-10 flex h-12 items-center justify-center"
      >
        <span
          ref={comingSoonRef}
          className="pl-[0.35em] text-lg font-bold uppercase tracking-[0.35em] text-tomato md:text-xl"
          style={{ fontFamily: COMING_SOON_FONTS[0] }}
        >
          Coming soon
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
