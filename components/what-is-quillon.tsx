"use client";

import { useRef } from "react";
import type { ComponentType, SVGProps } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  ClapperboardIcon,
  CodeIcon,
  SlidersIcon,
} from "@/components/icons";

gsap.registerPlugin(ScrollTrigger);

type FrameSpec = {
  number: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip: string;
};

const FRAMES: FrameSpec[] = [
  { number: "01", label: "Write code", Icon: CodeIcon, chip: "bg-teal" },
  { number: "02", label: "Edit programmatically", Icon: SlidersIcon, chip: "bg-mustard" },
  { number: "03", label: "Render cinema", Icon: ClapperboardIcon, chip: "bg-tomato" },
];

const SPROCKET_COUNT = 8;

const STATEMENT_REVEAL = {
  y: 44,
  autoAlpha: 0,
  duration: 0.8,
  ease: "power3.out",
} as const;

const FRAME_REVEAL = {
  y: 56,
  autoAlpha: 0,
  duration: 0.7,
  stagger: 0.14,
  ease: "back.out(1.6)",
} as const;

function SprocketHoles() {
  return (
    <>
      {Array.from({ length: SPROCKET_COUNT }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="h-1.5 w-3 shrink-0 rounded-full bg-ink"
        />
      ))}
    </>
  );
}

function Frame({ number, label, Icon, chip }: FrameSpec) {
  return (
    <li
      data-reveal="frame"
      className="flex flex-row items-center gap-4 rounded-2xl border-2 border-ink bg-cream px-4 py-5 md:flex-col md:items-start md:gap-4 md:px-6 md:py-8"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink text-ink md:h-14 md:w-14 ${chip}`}
      >
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0">
        <span className="block font-mono text-xs font-bold tracking-[0.3em] text-ink/60">
          {number}
        </span>
        <h3 className="mt-1 font-grotesk text-lg font-bold tracking-tight text-ink md:text-2xl">
          {label}
        </h3>
      </span>
    </li>
  );
}

export function WhatIsQuillon() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.from('[data-reveal="statement"]', {
            ...STATEMENT_REVEAL,
            scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
          });
          gsap.from('[data-reveal="frame"]', {
            ...FRAME_REVEAL,
            scrollTrigger: {
              trigger: '[data-reveal="strip"]',
              start: "top 82%",
            },
          });
        });
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="what-is-quillon"
      aria-labelledby="what-is-quillon-heading"
      className="relative px-5 py-20 md:px-8 md:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <div
          data-reveal="statement"
          className="flex flex-col items-center text-center"
        >
          <h2
            id="what-is-quillon-heading"
            className="rounded-full border-2 border-ink bg-teal px-5 py-1.5 pl-[1.25em] font-mono text-xs font-bold uppercase tracking-[0.25em] text-ink"
          >
            What is Quillon?
          </h2>
          <p className="mt-10 max-w-4xl font-grotesk text-3xl font-bold leading-[1.15] tracking-tight text-ink md:text-5xl">
            Quillon is a{" "}
            <span className="text-tomato">programmable video studio</span> —
            where <span className="squiggle-underline">code becomes cinema</span>.
          </p>
        </div>

        <div data-reveal="strip" className="mt-14 md:mt-20">
          <div className="rounded-3xl border-[3px] border-ink bg-white p-4 shadow-cartoon md:p-6">
            <div aria-hidden="true" className="flex justify-between px-2 pb-4 md:px-4">
              <SprocketHoles />
            </div>
            <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
              {FRAMES.map((frame) => (
                <Frame key={frame.number} {...frame} />
              ))}
            </ol>
            <div aria-hidden="true" className="flex justify-between px-2 pt-4 md:px-4">
              <SprocketHoles />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
