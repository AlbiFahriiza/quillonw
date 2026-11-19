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

type StepSpec = {
  number: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip: string;
};

const STEPS: StepSpec[] = [
  { number: "01", label: "Write code", Icon: CodeIcon, chip: "bg-teal" },
  {
    number: "02",
    label: "Edit programmatically",
    Icon: SlidersIcon,
    chip: "bg-mustard",
  },
  {
    number: "03",
    label: "Render cinema",
    Icon: ClapperboardIcon,
    chip: "bg-tomato",
  },
];

const STATEMENT_REVEAL = {
  y: 44,
  autoAlpha: 0,
  duration: 0.8,
  ease: "power3.out",
} as const;

const STEP_REVEAL = {
  y: 40,
  autoAlpha: 0,
  duration: 0.6,
  stagger: 0.1,
  ease: "back.out(1.6)",
} as const;

export function WhatIsQuillon() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          // immediateRender: false keeps the copy visible until the trigger
          // fires, so a failed ScrollTrigger can never hide the section.
          gsap.from('[data-reveal="statement"]', {
            ...STATEMENT_REVEAL,
            immediateRender: false,
            scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
          });
          gsap.from('[data-reveal="step"]', {
            ...STEP_REVEAL,
            immediateRender: false,
            scrollTrigger: {
              trigger: '[data-reveal="steps"]',
              start: "top 85%",
              once: true,
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
      className="relative scroll-mt-28 px-5 py-20 md:px-8 md:py-28"
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
            <span className="text-tomato-ink">programmable video studio</span> —
            where <span className="squiggle-underline">code becomes cinema</span>.
          </p>
        </div>

        <ol
          data-reveal="steps"
          className="mt-12 grid gap-4 md:mt-16 md:grid-cols-3 md:gap-6"
        >
          {STEPS.map(({ number, label, Icon, chip }) => (
            <li
              key={number}
              data-reveal="step"
              className="flex items-center gap-4 rounded-2xl border-2 border-ink bg-white px-5 py-5 shadow-cartoon-sm md:flex-col md:items-start md:gap-6 md:px-6 md:py-7"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-ink text-ink md:h-14 md:w-14 ${chip}`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-[10px] font-bold tracking-[0.3em] text-ink/70">
                  {number}
                </span>
                <h3 className="mt-1 font-grotesk text-lg font-bold tracking-tight text-ink md:text-2xl">
                  {label}
                </h3>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
