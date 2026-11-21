"use client";

import { useRef } from "react";
import type { ComponentType, SVGProps } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CodeLines, lineLength } from "@/components/code-lines";
import type { CodeLine } from "@/components/code-lines";
import { DonutArt } from "@/components/donut-art";
import {
  ClapperboardIcon,
  CodeIcon,
  SlidersIcon,
} from "@/components/icons";
import { SprocketHoles } from "@/components/sprocket-holes";
import { CX, CY, DOUGH, FROSTING } from "@/lib/donut-shapes";
import { getTier } from "@/lib/quality";

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

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

// One line per scene, typed as the scroll reaches it. At most 34 characters.
const STORY_LINES: readonly CodeLine[] = [
  [["k", "const"], ["t", " d = "], ["k", "new"], ["t", " Donut("], ["s", '"fluffy"'], ["t", ");"]],
  [["t", "d.frosting("], ["s", '"teal"'], ["t", ").sprinkles("], ["n", "9"], ["t", ");"]],
  [["k", "await"], ["t", " quillon.render(d);"]],
];
const STORY_LENGTHS = STORY_LINES.map(lineLength);

const SCENES = 3;
const PIN_SCROLL_PX = 1800;
const COLORS = { tomato: "#ff5a4e", teal: "#2ec4b6", cream: "#fff6e5", mustard: "#ffc93c" };

function Frame({ number, label, Icon, chip }: FrameSpec) {
  return (
    <li
      data-frame
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
      const section = sectionRef.current;
      if (!section) return;
      const q = <T extends Element>(selector: string) =>
        gsap.utils.toArray<T>(selector, section);
      const one = <T extends Element>(selector: string) => q<T>(selector)[0];

      const statement = one<HTMLElement>('[data-reveal="statement"]');
      const strip = one<HTMLElement>("[data-story]");
      const dough = one<SVGPathElement>("[data-dough-path]");
      const frosting = one<SVGPathElement>("[data-frosting]");
      const layer = one<SVGGElement>("[data-dough]");
      const bar = one<SVGGElement>("[data-bar]");
      const barFill = one<SVGRectElement>("[data-bar-fill]");
      const stamp = one<SVGGElement>("[data-stamp]");
      const sprinkles = q<SVGGElement>("[data-sprinkle]");
      const lines = q<HTMLElement>("[data-line]");
      const cards = q<HTMLElement>("[data-frame]");

      // The stylesheet parked these for first paint; GSAP owns them from here.
      statement.style.translate = "none";
      q<SVGElement>("[data-pre]").forEach((el) => {
        el.style.translate = "none";
      });

      // The whole story as one timeline, SCENES units long: scene i covers [i, i + 1].
      // It is scrubbed by scroll, so every ease is local to its own tween.
      const buildStory = () => {
        gsap.set(layer, { scale: 0, svgOrigin: `${CX} ${CY}` });
        gsap.set(sprinkles, { y: -440 });
        gsap.set(bar, { y: 90 });
        gsap.set(barFill, { scaleX: 0, svgOrigin: "26 271" });
        gsap.set(stamp, { y: -360, svgOrigin: "0 0" });
        gsap.set(frosting, { fill: COLORS.tomato });

        const tl = gsap.timeline({ defaults: { ease: "none" } });
        // On a device that is already struggling, shapes switch at scene boundaries
        // instead of morphing on every scroll frame.
        const light = getTier() < 2;
        const reshape = (target: SVGPathElement, shape: string, at: number, duration: number, ease: string) => {
          if (light) tl.set(target, { attr: { d: shape } }, at + duration);
          else tl.to(target, { morphSVG: { shape }, duration, ease }, at);
        };
        const typed = (scene: number, from: number, span: number) =>
          tl.fromTo(
            lines[scene],
            { "--n": 0 },
            {
              "--n": STORY_LENGTHS[scene],
              duration: span,
              ease: `steps(${STORY_LENGTHS[scene]})`,
              immediateRender: false,
            },
            from,
          );

        // 01 Write code: dough pops in, then pours into a ring.
        typed(0, 0.08, 0.8);
        tl.to(layer, { scale: 1, duration: 0.5, ease: "back.out(1.7)" }, 0.05);
        reshape(dough, DOUGH.ring, 0.4, 0.6, "power2.inOut");
        reshape(frosting, FROSTING.sliver, 0.4, 0.6, "power2.inOut");

        // 02 Edit programmatically: the same donut, changed by a line of code.
        typed(1, 1.08, 0.8);
        reshape(frosting, FROSTING.full, 1.05, 0.5, "power2.out");
        tl.to(frosting, { fill: COLORS.teal, duration: 0.4 }, 1.5);
        tl.to(sprinkles, { y: 0, duration: 0.5, ease: "bounce.out", stagger: { each: 0.012, from: "random" } }, 1.45);
        tl.to(frosting, { fill: COLORS.cream, duration: 0.4 }, 1.9);

        // 03 Render cinema: progress bar, then the stamp.
        typed(2, 2.08, 0.6);
        tl.to(bar, { y: 0, duration: 0.15, ease: "power3.out" }, 2.05);
        tl.to(barFill, { scaleX: 1, duration: 0.55 }, 2.15);
        tl.fromTo(stamp, { y: -360, scale: 1.7 }, { y: 0, scale: 1, duration: 0.15, ease: "power4.in", immediateRender: false }, 2.75);

        // The matching card lights up while its scene is on.
        cards.forEach((card, index) => {
          tl.to(card, { backgroundColor: COLORS.mustard, x: 10, duration: 0.1 }, index + 0.02);
          if (index < SCENES - 1) {
            tl.to(card, { backgroundColor: COLORS.cream, x: 0, duration: 0.1 }, index + 0.9);
          }
        });
        tl.set({}, {}, SCENES);
        return tl;
      };

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: reduce)", () => {
          dough.setAttribute("d", DOUGH.ring);
          frosting.setAttribute("d", FROSTING.full);
        })
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(
            statement,
            { yPercent: 110 },
            {
              yPercent: 0,
              duration: 1,
              ease: "power4.out",
              scrollTrigger: { trigger: section, start: "top 72%", once: true },
            },
          );
        })
        // Desktop: pin the strip and let scroll play the three scenes.
        .add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
          ScrollTrigger.create({
            trigger: strip,
            start: "center center",
            end: `+=${PIN_SCROLL_PX}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.6,
            animation: buildStory(),
          });
        })
        // Phone: no pin, so scrolling never feels hijacked. The scenes still follow scroll.
        .add("(max-width: 767px) and (prefers-reduced-motion: no-preference)", () => {
          ScrollTrigger.create({
            trigger: strip,
            start: "top 80%",
            end: "bottom 35%",
            scrub: 0.6,
            animation: buildStory(),
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
        {/* The statement rises out of its own mask instead of fading in. */}
        <div className="-mb-3 overflow-hidden pb-3">
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
        </div>

        <div data-story className="mt-14 md:mt-20">
          <div className="rounded-3xl border-[3px] border-ink bg-white p-4 shadow-cartoon md:p-6">
            <div aria-hidden="true" className="flex justify-between px-2 pb-4 md:px-4">
              <SprocketHoles />
            </div>
            <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 md:px-4">
              <div className="mx-auto w-full max-w-md">
                <DonutArt />
                <div
                  data-code
                  className="mt-4 rounded-2xl border-2 border-ink bg-cream px-4 py-3 font-mono text-[clamp(10.5px,3.3vw,14px)] leading-[1.7] text-ink"
                >
                  <CodeLines lines={STORY_LINES} />
                </div>
              </div>
              <ol className="grid gap-4 md:gap-5">
                {FRAMES.map((frame) => (
                  <Frame key={frame.number} {...frame} />
                ))}
              </ol>
            </div>
            <div aria-hidden="true" className="flex justify-between px-2 pt-4 md:px-4">
              <SprocketHoles />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
