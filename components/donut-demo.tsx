"use client";

import { useRef } from "react";
import type { PointerEvent } from "react";
import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { CodeLines, lineLength } from "@/components/code-lines";
import type { CodeLine } from "@/components/code-lines";
import { DonutArt } from "@/components/donut-art";
import { SprocketHoles } from "@/components/sprocket-holes";
import { emitSprinkles } from "@/components/sprinkles";
import { getTier, subscribeTier } from "@/lib/quality";
import { BITE_ANGLE, CX, CY, DOUGH, FROSTING } from "@/lib/donut-shapes";

gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

// Keep every line at 34 characters or fewer so it fits a 320px phone without scrolling.
const LINES: readonly CodeLine[] = [
  [["c", "// a piece of donut creates"]],
  [["k", "const"], ["t", " d = "], ["k", "new"], ["t", " Donut("], ["s", '"fluffy"'], ["t", ");"]],
  [["t", "d.hole("], ["n", "true"], ["t", ");"]],
  [["t", "d.frosting("], ["s", '"strawberry"'], ["t", ");"]],
  [["t", "d.sprinkles("], ["n", "99"], ["t", "); "], ["c", "// we counted"]],
  [["k", "await"], ["t", " quillon.render(d);"]],
  [["c", "// bites: 1. nobody saw that."]],
];
const LENGTHS = LINES.map(lineLength);

const CHARS_PER_SECOND = 24;
const OFFSCREEN_UP = -440;
const OFFSCREEN_BAR = 90;
const OFFSCREEN_STAMP = -360;
const ENTRANCE_DELAY = 0.9;


export function DonutDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const frame = frameRef.current;
      if (!root || !frame) return;
      const q = <T extends Element>(selector: string) =>
        gsap.utils.toArray<T>(selector, root);
      const one = <T extends Element>(selector: string) => q<T>(selector)[0];

      const dough = one<SVGPathElement>("[data-dough-path]");
      const frosting = one<SVGPathElement>("[data-frosting]");
      const layer = one<SVGGElement>("[data-dough]");
      const bar = one<SVGGElement>("[data-bar]");
      const barFill = one<SVGRectElement>("[data-bar-fill]");
      const stamp = one<SVGGElement>("[data-stamp]");
      const squash = one<SVGGElement>("[data-squash]");
      const sprinkles = q<SVGGElement>("[data-sprinkle]");
      const eaten = q<SVGGElement>('[data-sprinkle="eaten"]');
      const lines = q<HTMLElement>("[data-line]");
      const caret = one<HTMLElement>("[data-caret]");
      const panels = q<HTMLElement>("[data-demo-panel]");

      // The stylesheet parked these for first paint; GSAP owns them from here.
      q<SVGElement>("[data-pre]").forEach((el) => {
        el.style.translate = "none";
      });

      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: reduce)", () => {
          dough.setAttribute("d", DOUGH.ring);
          frosting.setAttribute("d", FROSTING.full);
        })
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.set(layer, { scale: 0, svgOrigin: `${CX} ${CY}` });
          gsap.set(sprinkles, { y: OFFSCREEN_UP });
          gsap.set(bar, { y: OFFSCREEN_BAR });
          gsap.set(barFill, { scaleX: 0, svgOrigin: "26 271" });
          gsap.set(stamp, { y: OFFSCREEN_STAMP, svgOrigin: "0 0" });
          gsap.set(squash, { svgOrigin: `${CX} ${CY}` });

          const reveal = gsap.fromTo(
            panels,
            { clipPath: "inset(480px -12px -12px -12px)" },
            {
              clipPath: "inset(-12px -12px -12px -12px)",
              duration: 1,
              ease: "power4.out",
              stagger: 0.12,
              delay: ENTRANCE_DELAY,
              // "none", not clearProps: clearing would restore the stylesheet's hidden state.
              onComplete: () => {
                gsap.set(panels, { clipPath: "none" });
              },
            },
          );

          const frameBox = () => frame.getBoundingClientRect();
          const rain = () => {
            const box = frameBox();
            emitSprinkles({ x: box.left + box.width / 2, y: box.top, mode: "rain", width: box.width, count: 22 });
          };
          const burstFromFrame = () => {
            const box = frameBox();
            emitSprinkles({ x: box.left + box.width / 2, y: box.top + box.height * 0.45, count: 32 });
          };
          const crumbs = () => {
            const box = frameBox();
            const sx = CX + 86 * Math.cos(BITE_ANGLE);
            const sy = CY + 86 * Math.sin(BITE_ANGLE);
            emitSprinkles({ x: box.left + (sx / 400) * box.width, y: box.top + (sy / 300) * box.height, count: 12 });
          };

          const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.8, paused: true });
          timelineRef.current = tl;

          // Typewriter: the reveal is a clip measured in ch, stepped once per character.
          const type = (index: number, at: number) => {
            const length = LENGTHS[index];
            const duration = length / CHARS_PER_SECOND;
            const ease = `steps(${length})`;
            tl.set(caret, { "--cl": index }, at);
            tl.fromTo(caret, { "--cx": 0 }, { "--cx": length, duration, ease, immediateRender: false }, at);
            tl.fromTo(lines[index], { "--n": 0 }, { "--n": length, duration, ease, immediateRender: false }, at);
            return at + duration;
          };

          let t = 0.4;
          t = type(0, t) + 0.3;

          // d = new Donut: dough pops in and wobbles like it is alive.
          const doughTyped = type(1, t);
          tl.fromTo(layer, { scale: 0 }, { scale: 1, duration: 1, ease: "elastic.out(1,0.5)", immediateRender: false }, t + 0.5);
          t = doughTyped + 0.2;
          tl.to(dough, { morphSVG: { shape: DOUGH.blob[1] }, duration: 0.9, ease: "sine.inOut" }, t - 0.1);
          tl.to(dough, { morphSVG: { shape: DOUGH.blob[2] }, duration: 0.9, ease: "sine.inOut" }, t + 0.8);
          t += 1.3;

          // d.hole(true): the blob pours into a ring.
          const holeAt = type(2, t);
          tl.to(dough, { morphSVG: { shape: DOUGH.ring }, duration: 1, ease: "power3.inOut" }, holeAt);
          tl.to(frosting, { morphSVG: { shape: FROSTING.sliver }, duration: 1, ease: "power3.inOut" }, holeAt);
          tl.fromTo(layer, { scaleX: 1.16, scaleY: 0.86 }, { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1,0.4)", immediateRender: false }, holeAt + 0.8);
          t = holeAt + 1.6;

          // d.frosting: glaze spreads out from the hole.
          const frostAt = type(3, t);
          tl.to(frosting, { morphSVG: { shape: FROSTING.full }, duration: 1.1, ease: "power2.out" }, frostAt);
          t = frostAt + 1.4;

          // d.sprinkles(99)
          const sprinkleAt = type(4, t);
          tl.fromTo(sprinkles, { y: OFFSCREEN_UP }, { y: 0, duration: 0.9, ease: "bounce.out", stagger: { each: 0.035, from: "random" }, immediateRender: false }, sprinkleAt);
          tl.call(rain, undefined, sprinkleAt);
          t = sprinkleAt + 1.9;

          // await quillon.render(d): progress bar, then a stamp slams on.
          const renderAt = type(5, t);
          tl.fromTo(bar, { y: OFFSCREEN_BAR }, { y: 0, duration: 0.45, ease: "power3.out", immediateRender: false }, renderAt);
          tl.fromTo(barFill, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power1.inOut", immediateRender: false }, renderAt + 0.35);
          tl.fromTo(stamp, { y: OFFSCREEN_STAMP, scale: 1.7 }, { y: 0, scale: 1, duration: 0.45, ease: "power4.in", immediateRender: false }, renderAt + 1.7);
          tl.fromTo(squash, { scaleY: 0.94, scaleX: 1.04 }, { scaleY: 1, scaleX: 1, duration: 0.7, ease: "elastic.out(1,0.35)", immediateRender: false }, renderAt + 2.15);
          tl.call(burstFromFrame, undefined, renderAt + 2.15);
          t = renderAt + 2.7;
          // The calm frame a struggling device settles on: frosted, sprinkled, stamped.
          tl.addLabel("showcase", t);

          // The gag: somebody took a bite.
          const biteAt = t + 0.1;
          type(6, t);
          tl.to(dough, { morphSVG: { shape: DOUGH.bitten }, duration: 0.4, ease: "power4.out" }, biteAt);
          tl.to(frosting, { morphSVG: { shape: FROSTING.bitten }, duration: 0.4, ease: "power4.out" }, biteAt);
          tl.to(eaten, { scale: 0, duration: 0.25, ease: "back.in(2)" }, biteAt);
          tl.call(crumbs, undefined, biteAt + 0.05);
          tl.fromTo(layer, { scaleX: 0.92, scaleY: 1.06 }, { scaleX: 1, scaleY: 1, duration: 0.7, ease: "elastic.out(1,0.4)", immediateRender: false }, biteAt + 0.4);
          t += LENGTHS[6] / CHARS_PER_SECOND + 1.8;

          // Melt everything back to the start so the loop has no cut.
          tl.to(lines, { "--n": 0, duration: 0.7, ease: "power2.inOut" }, t);
          tl.to(caret, { "--cx": 0, "--cl": 0, duration: 0.7, ease: "power2.inOut" }, t);
          tl.to(stamp, { y: OFFSCREEN_STAMP, duration: 0.4, ease: "power3.in" }, t);
          tl.to(bar, { y: OFFSCREEN_BAR, duration: 0.4, ease: "power3.in" }, t);
          tl.to(sprinkles, { y: OFFSCREEN_UP, duration: 0.5, ease: "power3.in", stagger: { each: 0.01, from: "random" } }, t);
          tl.set(barFill, { scaleX: 0 }, t + 0.5);
          tl.set(eaten, { scale: 1 }, t + 0.6);
          tl.to(dough, { morphSVG: { shape: DOUGH.blob[0] }, duration: 0.9, ease: "power3.inOut" }, t + 0.3);
          tl.to(frosting, { morphSVG: { shape: FROSTING.tiny }, duration: 0.9, ease: "power3.inOut" }, t + 0.3);
          tl.to(layer, { scale: 0, duration: 0.5, ease: "back.in(1.7)" }, t + 1.2);

          // Run only while on screen, and not before the panels have risen into place.
          // On a device that cannot keep up (tier 0) the demo parks on its showcase frame.
          let ready = false;
          const parkIfStruggling = () => {
            if (getTier() === 0) tl.pause("showcase");
          };
          const gate = ScrollTrigger.create({
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            onToggle: (self) => tl.paused(!(ready && self.isActive && getTier() > 0)),
          });
          const start = gsap.delayedCall(ENTRANCE_DELAY + 1.2, () => {
            ready = true;
            tl.paused(!gate.isActive);
            parkIfStruggling();
          });
          const unsubscribe = subscribeTier(parkIfStruggling);

          return () => {
            reveal.kill();
            unsubscribe();
            start.kill();
            gate.kill();
            tl.kill();
            timelineRef.current = null;
          };
        });
    },
    { scope: rootRef },
  );

  const replay = () => {
    timelineRef.current?.restart();
  };

  // Tap the donut: it squashes and throws sprinkles from where you touched.
  const poke = (event: PointerEvent<HTMLDivElement>) => {
    emitSprinkles({ x: event.clientX, y: event.clientY, count: 18 });
    const squash = rootRef.current?.querySelector("[data-squash]");
    if (squash) {
      gsap.fromTo(
        squash,
        { scaleX: 1.1, scaleY: 0.9 },
        { scaleX: 1, scaleY: 1, duration: 0.9, ease: "elastic.out(1,0.35)", overwrite: "auto" },
      );
    }
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Demo: a few lines of code build a donut and render it"
      className="mx-auto mt-14 grid w-full max-w-4xl gap-8 text-left md:grid-cols-[1.05fr_1fr] md:items-center"
    >
      <div
        data-demo-panel
        className="rounded-3xl border-[3px] border-ink bg-white shadow-cartoon"
      >
        <div className="flex items-center gap-2 border-b-[3px] border-ink px-4 py-3">
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-tomato" />
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-mustard" />
          <span aria-hidden="true" className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-teal" />
          <span className="ml-2 font-mono text-xs font-bold text-ink/60">donut.ts</span>
        </div>
        <div
          data-code
          className="relative px-4 py-4 font-mono text-[clamp(10.5px,3.3vw,14px)] leading-[1.7] text-ink"
        >
          <CodeLines lines={LINES} />
          <span
            data-caret
            aria-hidden="true"
            className="absolute left-4 top-4 mt-[0.25em] h-[1.2em] w-[0.6em] bg-ink"
          />
        </div>
      </div>

      <div
        ref={frameRef}
        data-demo-panel
        onPointerDown={poke}
        className="relative cursor-pointer rounded-3xl border-[3px] border-ink bg-white p-3 shadow-cartoon"
      >
        <div aria-hidden="true" className="flex justify-between px-1 pb-2.5">
          <SprocketHoles />
        </div>
        <DonutArt />
        <div aria-hidden="true" className="flex justify-between px-1 pt-2.5">
          <SprocketHoles />
        </div>
        <button
          type="button"
          onClick={replay}
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute right-5 top-9 inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 font-mono text-xs font-bold text-ink transition-[background-color,color] duration-200 hover:bg-tomato hover:text-cream motion-reduce:hidden"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12a8 8 0 1 1-2.6-5.9" />
            <path d="M20 4v5h-5" />
          </svg>
          Replay
        </button>
      </div>
    </div>
  );
}
