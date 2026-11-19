"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ComingSoonMorph } from "@/components/coming-soon-morph";
import { Sprinkles } from "@/components/sprinkles";

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

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          playEntrance();
        });
    },
    { scope: heroRef },
  );

  return (
    <section
      ref={heroRef}
      aria-label="Quillon is coming soon"
      className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 text-center"
    >
      <Sprinkles />
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

      {/* One fixed viewBox: the morphing line can never change width (B5). */}
      <p
        data-hero="coming-soon"
        className="hero-initial hero-initial-coming-soon mt-12 flex w-full items-center justify-center px-2"
      >
        <span className="sr-only">Coming soon</span>
        <ComingSoonMorph />
      </p>
    </section>
  );
}
