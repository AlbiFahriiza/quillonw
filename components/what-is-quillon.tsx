"use client";

import { useRef } from "react";
import type { ComponentType, SVGProps } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import {
  ClapperboardIcon,
  CodeIcon,
  SlidersIcon,
} from "@/components/icons";

gsap.registerPlugin(ScrollTrigger, MorphSVGPlugin);

/**
 * The three-frame strip becomes a three-scene scroll story that keeps
 * telling the donut joke: the code writes the dough, sliders re-frost it,
 * and the render turns it into film frames.
 *
 * Desktop pins the section and scrubs over about three viewport heights;
 * phones keep the normal document flow, each scene scrubbing against its
 * own scroll progress (no pin, no scroll-jacking).
 */

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

// One donut silhouette across all scenes: a ring that opens as a blob
// (scene 1), keeps both contours so morphs stay matched, and ends as the
// film-strip curve (scene 3).
const BLOB =
  "M100 30 C134 26 164 48 170 78 C176 108 152 136 122 142 C92 148 64 134 52 106 C42 82 50 54 74 40 C84 34 92 31 100 30 Z M100 80 C107 80 113 85 113 92 C113 99 107 105 100 105 C93 105 87 99 87 92 C87 85 93 80 100 80 Z";
const RING =
  "M100 26 C140 26 174 58 174 100 C174 142 140 174 100 174 C60 174 26 142 26 100 C26 58 60 26 100 26 Z M100 76 C114 76 124 86 124 100 C124 114 114 124 100 124 C86 124 76 114 76 100 C76 86 86 76 100 76 Z";

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

function SceneDonut({ scene }: { scene: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className="h-28 w-28 md:h-36 md:w-36"
      data-scene-donut={scene}
    >
      <path
        data-scene-shape
        d={BLOB}
        fill={scene === 2 ? "#ff5a4e" : "#ffc93c"}
        stroke="#1b1b1b"
        strokeWidth="5"
      />
      {scene === 2 && (
        <g data-scene-sliders aria-hidden="true">
          <line x1="40" y1="150" x2="160" y2="150" stroke="#1b1b1b" strokeWidth="5" strokeLinecap="round" />
          <circle data-scene-knob cx="70" cy="150" r="10" fill="#2ec4b6" stroke="#1b1b1b" strokeWidth="4" />
          <line x1="40" y1="172" x2="160" y2="172" stroke="#1b1b1b" strokeWidth="5" strokeLinecap="round" />
          <circle data-scene-knob cx="130" cy="172" r="10" fill="#ff5a4e" stroke="#1b1b1b" strokeWidth="4" />
        </g>
      )}
      {scene === 3 && (
        <g data-scene-film aria-hidden="true">
          <rect
            data-scene-frame
            x="30"
            y="60"
            width="140"
            height="80"
            rx="8"
            fill="none"
            stroke="#1b1b1b"
            strokeWidth="5"
            style={{ transform: "scale(0.001)", transformOrigin: "100px 100px" }}
          />
          <path
            data-scene-curve
            d="M30 140 C60 100 140 100 170 60"
            fill="none"
            stroke="#1b1b1b"
            strokeWidth="5"
            strokeLinecap="round"
            style={{ transform: "scale(0.001)", transformOrigin: "100px 100px" }}
          />
        </g>
      )}
    </svg>
  );
}

function Frame({ number, label, Icon, chip }: FrameSpec) {
  return (
    <div className="flex flex-row items-center gap-4 md:flex-col md:items-start md:gap-4">
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
    </div>
  );
}

export function WhatIsQuillon() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // Address-bar resizes on phones must not re-trigger refresh jumps;
      // ignoreMobileResize (verified in the installed ScrollTrigger source)
      // is exactly that switch.
      ScrollTrigger.config({ ignoreMobileResize: true });

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.to('[data-reveal="statement"]', {
            y: 0,
            clipPath: "inset(0 0 0% 0)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: sectionRef.current, start: "top 72%" },
          });
          gsap.to('[data-reveal="frame"]', {
            y: 0,
            clipPath: "inset(0 0 0% 0)",
            duration: 0,
            stagger: 0.14,
            scrollTrigger: {
              trigger: '[data-reveal="strip"]',
              start: "top 82%",
            },
          });

          // --- Scene stories, desktop: pinned, scrubbed over 3 viewports.
          gsap.matchMedia().add("(min-width: 768px)", () => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: '[data-scroll-story]',
                start: "top top",
                end: "+=300%",
                pin: true,
                scrub: 0.6,
              },
            });

            // Scene 1: code writes the dough (blob inflates).
            tl.fromTo(
              '[data-scene-donut="1"] [data-scene-shape]',
              { scale: 0.2, transformOrigin: "50% 50%" },
              { scale: 1, duration: 1, ease: "back.out(1.6)" },
            );

            // Scene 2: sliders change frosting colour and sprinkle knob.
            tl.to(
              '[data-scene-donut="2"] [data-scene-shape]',
              { fill: "#2ec4b6", duration: 0.6 },
              0.2,
            );
            tl.fromTo(
              '[data-scene-donut="2"] [data-scene-knob]',
              { attr: { cx: 70 } },
              { attr: { cx: 130 }, duration: 0.5 },
              0.3,
            );

            // Scene 3: donut morphs to film strip frames.
            tl.to(
              '[data-scene-donut="3"] [data-scene-shape]',
              { morphSVG: RING, duration: 0.8, ease: "power2.inOut" },
              1.4,
            );
            tl.to(
              '[data-scene-donut="3"] [data-scene-frame]',
              { scale: 1, duration: 0.5, ease: "back.out(2)" },
              1.9,
            );
            tl.to(
              '[data-scene-donut="3"] [data-scene-curve]',
              { scale: 1, duration: 0.5, ease: "back.out(2)" },
              2.1,
            );
            tl.to({}, { duration: 0.6 });

            return () => {
              tl.scrollTrigger?.kill();
              tl.kill();
            };
          });

          // --- Scene stories, phones: each scene scrubs its own progress.
          gsap.matchMedia().add("(max-width: 767px)", () => {
            const tweens: gsap.core.Tween[] = [];
            tweens.push(
              gsap.fromTo(
                '[data-scene-donut="1"] [data-scene-shape]',
                { scale: 0.2, transformOrigin: "50% 50%" },
                {
                  scale: 1,
                  ease: "power1.out",
                  scrollTrigger: {
                    trigger: '[data-scene-donut="1"]',
                    start: "top 85%",
                    end: "top 35%",
                    scrub: true,
                  },
                },
              ),
            );
            tweens.push(
              gsap.to('[data-scene-donut="2"] [data-scene-shape]', {
                fill: "#2ec4b6",
                scrollTrigger: {
                  trigger: '[data-scene-donut="2"]',
                  start: "top 85%",
                  end: "top 35%",
                  scrub: true,
                },
              }),
            );
            tweens.push(
              gsap.to('[data-scene-donut="3"] [data-scene-shape]', {
                morphSVG: RING,
                scrollTrigger: {
                  trigger: '[data-scene-donut="3"]',
                  start: "top 85%",
                  end: "top 35%",
                  scrub: true,
                },
              }),
            );
            tweens.push(
              gsap.to('[data-scene-donut="3"] [data-scene-frame]', {
                scale: 1,
                scrollTrigger: {
                  trigger: '[data-scene-donut="3"]',
                  start: "top 85%",
                  end: "top 35%",
                  scrub: true,
                },
              }),
            );
            tweens.push(
              gsap.to('[data-scene-donut="3"] [data-scene-curve]', {
                scale: 1,
                scrollTrigger: {
                  trigger: '[data-scene-donut="3"]',
                  start: "top 85%",
                  end: "top 35%",
                  scrub: true,
                },
              }),
            );
            return () => {
              for (const t of tweens) {
                t.scrollTrigger?.kill();
                t.kill();
              }
            };
          });
        })
        .add("(prefers-reduced-motion: reduce)", () => {
          // Final static states: nothing moves, everything in place.
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
          className="reveal-initial reveal-initial-statement flex flex-col items-center text-center"
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

        {/* Scroll story: each frame pairs with its donut scene. */}
        <div data-scroll-story data-reveal="strip" className="reveal-initial reveal-initial-statement mt-14 md:mt-20">
          <div className="rounded-3xl border-[3px] border-ink bg-white p-4 shadow-cartoon md:p-6">
            <div aria-hidden="true" className="flex justify-between px-2 pb-4 md:px-4">
              <SprocketHoles />
            </div>
            <ol className="grid gap-5 md:grid-cols-3 md:gap-6">
              {FRAMES.map((frame, index) => (
                <li
                  key={frame.number}
                  data-reveal="frame"
                  className="reveal-initial reveal-initial-frame flex flex-col gap-4 rounded-2xl border-2 border-ink bg-cream px-4 py-5 md:px-6 md:py-8"
                >
                  <SceneDonut scene={index + 1} />
                  <Frame {...frame} />
                </li>
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
