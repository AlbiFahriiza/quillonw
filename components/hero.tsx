"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ComingSoonMorph } from "@/components/coming-soon-morph";
import { DonutDemo } from "@/components/donut-demo";
import { Sprinkles } from "@/components/sprinkles";
import { startQualityMonitor } from "@/lib/quality";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      startQualityMonitor();
      const hero = heroRef.current;
      if (!hero) return;
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]", hero);

      // The stylesheet hid these for first paint; hand over to GSAP in the same frame.
      lines.forEach((line) => {
        line.style.translate = "none";
      });

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(
            '[data-hero="wordmark"]',
            { clipPath: "inset(0 100% 0 0)" },
            {
              clipPath: "inset(0 0% 0 0)",
              duration: 0.8,
              ease: "power3.inOut",
              // "none", not clearProps: clearing would hand the element back to the
              // stylesheet's first-paint clip and hide it again.
              onComplete: () => {
                gsap.set('[data-hero="wordmark"]', { clipPath: "none" });
              },
            },
          );
          gsap.fromTo(
            lines,
            { yPercent: 130 },
            {
              yPercent: 0,
              duration: 1,
              stagger: 0.12,
              delay: 0.15,
              ease: "power4.out",
            },
          );
        });
    },
    { scope: heroRef },
  );

  return (
    <section
      ref={heroRef}
      aria-label="Quillon is coming soon"
      className="relative isolate flex min-h-svh flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28 text-center"
    >
      <Sprinkles />

      <p
        data-hero="wordmark"
        className="pl-[0.5em] font-grotesk text-sm font-medium uppercase tracking-[0.5em] text-ink md:text-base"
      >
        Quillon
      </p>

      {/* Each line sits in its own mask, so it rises into place instead of fading. */}
      <h1 className="mt-6 max-w-5xl font-grotesk text-6xl font-bold leading-[1.04] tracking-tight text-ink sm:text-7xl lg:text-8xl">
        <span className="-mx-4 -mt-2 -mb-4 inline-block overflow-hidden px-4 pb-4 pt-2 align-bottom">
          <span data-hero-line className="inline-block">
            Code the
          </span>
        </span>{" "}
        <span className="-mx-4 -mt-2 -mb-4 inline-block overflow-hidden px-4 pb-4 pt-2 align-bottom">
          <span data-hero-line className="inline-block">
            <span className="marker-highlight">frame.</span>
          </span>
        </span>
      </h1>

      <div className="mt-12 flex w-full justify-center">
        <span className="sr-only">Coming soon</span>
        <ComingSoonMorph />
      </div>

      <DonutDemo />
    </section>
  );
}
