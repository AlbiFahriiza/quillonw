"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { qualityTier } from "@/lib/quality";

gsap.registerPlugin(MorphSVGPlugin);

/**
 * The hero joke: a cartoon editor that "renders" a donut.
 *
 * Left, an editor window where the code types itself with a caret; right, a
 * film-frame preview whose SVG donut follows each code step: wobbling dough,
 * hole, frosting with drips, sprinkles, a render stamp, and the closing bite
 * gag. One repeating timeline drives everything (typing sets the beat, about
 * ten seconds a loop). Tapping the preview fires a sprinkle burst on the
 * hero canvas.
 */

const CODE_LINES = [
  'const donut = new Piece("donut");',
  "donut.dough('fluffy');",
  "donut.hole(true);",
  "donut.frosting('strawberry');",
  "donut.sprinkles(99); // counted",
  "await quillon.render(donut);",
  "// bites: 1. nobody saw.",
] as const;

const TYPING_MS_PER_CHAR = 26;
const LINE_GAP_SECONDS = 0.18;

// Wobbling dough blobs. All carry a tiny inner contour so the morph into
// the ring (also two contours) stays contour-matched through hole(true).
const BLOB_A =
  "M100 28 C132 26 166 44 172 74 C178 104 158 132 128 140 C98 148 66 138 52 112 C38 86 44 56 68 40 C80 32 90 29 100 28 Z M100 78 C108 78 114 84 114 92 C114 100 108 106 100 106 C92 106 86 100 86 92 C86 84 92 78 100 78 Z";
const BLOB_B =
  "M100 30 C134 26 164 48 170 78 C176 108 152 136 122 142 C92 148 64 134 52 106 C42 82 50 54 74 40 C84 34 92 31 100 30 Z M100 80 C107 80 113 85 113 92 C113 99 107 105 100 105 C93 105 87 99 87 92 C87 85 93 80 100 80 Z";
const BLOB_C =
  "M100 32 C130 24 162 42 172 72 C182 102 160 134 130 144 C100 152 62 140 50 110 C40 84 48 58 70 42 C82 34 92 34 100 32 Z M100 82 C106 82 112 87 112 93 C112 99 106 104 100 104 C94 104 88 99 88 93 C88 87 94 82 100 82 Z";
const RING =
  "M100 26 C140 26 174 58 174 100 C174 142 140 174 100 174 C60 174 26 142 26 100 C26 58 60 26 100 26 Z M100 76 C114 76 124 86 124 100 C124 114 114 124 100 124 C86 124 76 114 76 100 C76 86 86 76 100 76 Z";

// The frosting is a cap with drips; collapsed it hugs the ring's top edge
// in the dough colour, so the reveal is the morph itself, never a fade.
const DRIPS_FULL =
  "M44 84 C58 96 66 78 78 88 C90 98 100 78 114 90 C126 100 134 84 148 94 C158 100 156 84 156 84 C152 62 128 48 100 48 C72 48 48 62 44 84 Z";
const DRIPS_NONE = "M44 62 C58 48 142 48 156 62 L156 62 C142 48 58 48 44 62 Z";

// Static sprinkle marks on the frosting (SVG), about two dozen.
const SPRINKLE_MARKS = [
  { x: 62, y: 66, r: 24, c: "#2ec4b6" },
  { x: 78, y: 56, r: -40, c: "#1b1b1b" },
  { x: 94, y: 62, r: 70, c: "#fff6e5" },
  { x: 112, y: 54, r: 10, c: "#2ec4b6" },
  { x: 130, y: 62, r: -70, c: "#1b1b1b" },
  { x: 146, y: 74, r: 45, c: "#fff6e5" },
  { x: 68, y: 78, r: 60, c: "#fff6e5" },
  { x: 86, y: 70, r: -15, c: "#2ec4b6" },
  { x: 104, y: 74, r: 30, c: "#1b1b1b" },
  { x: 122, y: 70, r: -55, c: "#fff6e5" },
  { x: 138, y: 80, r: 20, c: "#2ec4b6" },
  { x: 56, y: 90, r: -30, c: "#2ec4b6" },
  { x: 76, y: 88, r: 50, c: "#1b1b1b" },
  { x: 98, y: 86, r: -10, c: "#fff6e5" },
  { x: 118, y: 88, r: 65, c: "#2ec4b6" },
  { x: 134, y: 92, r: -45, c: "#fff6e5" },
  { x: 148, y: 86, r: 15, c: "#1b1b1b" },
  { x: 66, y: 98, r: -60, c: "#fff6e5" },
  { x: 90, y: 96, r: 25, c: "#1b1b1b" },
  { x: 110, y: 98, r: -20, c: "#2ec4b6" },
  { x: 130, y: 100, r: 55, c: "#fff6e5" },
  { x: 100, y: 60, r: 90, c: "#1b1b1b" },
  { x: 84, y: 60, r: 100, c: "#2ec4b6" },
  { x: 120, y: 62, r: 80, c: "#fff6e5" },
] as const;

const SPROCKETS = 6;

// Lexical token classes for the marker-chip colouring.
const KEYWORDS = new Set(["const", "await", "true", "new"]);
const IDENTIFIERS = new Set(["donut", "quillon"]);

type Token = { text: string; chip: string };

function tokenize(line: string): Token[] {
  const tokens =
    line.match(/('[^']*')|([A-Za-z_][A-Za-z0-9_]*)|(\d+)|(\/\/.*$)|(\S)|(\s+)/g) ?? [];
  const out: Token[] = [];
  let chip = "plain";
  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      out.push({ text: token, chip: "plain" });
      continue;
    }
    if (KEYWORDS.has(token)) chip = "kw";
    else if (IDENTIFIERS.has(token)) chip = "id";
    else if (token.startsWith("'")) chip = "str";
    else if (/^\d+$/.test(token)) chip = "num";
    else if (token.startsWith("//")) chip = "cm";
    else if (/^[A-Za-z_]/.test(token)) chip = "fn";
    else chip = "plain";
    out.push({ text: token, chip });
  }
  return out;
}

const CHIP_BG: Record<string, string> = {
  kw: "bg-tomato",
  id: "bg-mustard",
  fn: "bg-teal",
  str: "bg-teal",
  num: "bg-mustard",
  cm: "bg-cream",
  plain: "",
};

export function DonutDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const replay = useCallback(() => {
    timelineRef.current?.restart();
  }, []);

  const onPreviewTap = useCallback((event: React.PointerEvent) => {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    window.dispatchEvent(
      new CustomEvent("quillon:sprinkle-burst", {
        detail: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      }),
    );
  }, []);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (
        !root ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        qualityTier() === 0
      ) {
        return;
      }

      const lines = Array.from(
        root.querySelectorAll<HTMLElement>("[data-code-line]"),
      );
      const caret = root.querySelector<HTMLElement>("[data-caret]");
      const dough = root.querySelector<SVGPathElement>('[data-donut="dough"]');
      const drips = root.querySelector<SVGPathElement>('[data-donut="drips"]');
      const stamp = root.querySelector<SVGGElement>('[data-donut="stamp"]');
      const bite = root.querySelector<SVGCircleElement>('[data-donut="bite"]');
      const marks = Array.from(
        root.querySelectorAll<SVGRectElement>('[data-donut="mark"]'),
      );
      const frame = root.querySelector<HTMLElement>('[data-donut="shutter"]');

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.4 });
      timelineRef.current = tl;

      // --- Typing pass: absolute time per line, chips reveal left to right.
      const lineStarts: number[] = [];
      let cursor = 0;
      lines.forEach((line, index) => {
        const text = CODE_LINES[index];
        const duration = (text.length * TYPING_MS_PER_CHAR) / 1000;
        lineStarts[index] = cursor;

        // Caret slides across the line while the chips reveal underneath.
        if (caret) {
          tl.set(
            caret,
            {
              x: line.offsetLeft,
              y: line.offsetTop + (line.offsetHeight - 16) / 2,
            },
            cursor,
          );
          tl.to(
            caret,
            { x: line.offsetLeft + line.offsetWidth, duration, ease: "none" },
            cursor,
          );
        }

        const chips = Array.from(line.children) as HTMLElement[];
        chips.forEach((chip) => {
          const n = Math.max(chip.textContent?.length ?? 0, 1);
          const chipDuration = (n * TYPING_MS_PER_CHAR) / 1000;
          tl.to(
            chip,
            { clipPath: "inset(0 0% 0 0)", duration: chipDuration, ease: "none" },
            cursor,
          );
          cursor += chipDuration;
        });

        cursor = lineStarts[index] + duration + LINE_GAP_SECONDS;
      });
      const typingTotal = cursor;
      const start = (lineIndex: number) => lineStarts[lineIndex];

      // --- Preview beats, each driven by its code line.

      // 1. Dough wobbles while line 2 types.
      tl.fromTo(
        dough,
        { morphSVG: BLOB_A },
        { morphSVG: BLOB_B, duration: 0.55, ease: "sine.inOut" },
        start(1),
      )
        .to(dough, { morphSVG: BLOB_C, duration: 0.55, ease: "sine.inOut" })
        .to(dough, { morphSVG: BLOB_A, duration: 0.55, ease: "sine.inOut" });

      // 2. hole(true): the blob morphs into the ring.
      tl.to(
        dough,
        { morphSVG: RING, duration: 0.8, ease: "back.inOut(1.4)" },
        start(2),
      );

      // 3. frosting: the drip cap morphs on and its fill tweens to tomato.
      tl.to(
        drips,
        { morphSVG: DRIPS_FULL, duration: 0.7, ease: "power2.out" },
        start(3),
      );
      tl.to(
        drips,
        { fill: "#ff5a4e", duration: 0.5, ease: "power1.inOut" },
        start(3) + 0.2,
      );

      // 4. sprinkles: the marks pop onto the frosting, staggered.
      tl.to(
        marks,
        {
          scale: 1,
          duration: 0.3,
          ease: "back.out(2.4)",
          stagger: 0.035,
          transformOrigin: "50% 50%",
        },
        start(4),
      );

      // 5. render: film-frame stamp pops in with a squash, shutter wipes.
      tl.fromTo(
        stamp,
        { scale: 0.001, transformOrigin: "50% 50%" },
        {
          scale: 1,
          duration: 0.45,
          ease: "back.out(2.2)",
        },
        start(5) + 0.15,
      );
      tl.fromTo(
        frame,
        { clipPath: "inset(0 0 100% 0)" },
        { clipPath: "inset(0 0 0% 0)", duration: 0.3, ease: "power2.in" },
        start(5) + 0.3,
      );
      tl.to(frame, { clipPath: "inset(0 0 0% 0)", duration: 0.01 }, start(5) + 0.9);

      // 6. Ending gag: the bite scales in while the last comment types.
      tl.fromTo(
        bite,
        { scale: 0.001, transformOrigin: "50% 50%" },
        { scale: 1, duration: 0.4, ease: "back.out(2)" },
        start(6) + 0.1,
      );

      // Loop back: morph the ring to dough, fold the frosting away, clear
      // the stamp, bite and marks — all transforms and path morphs.
      const resetAt = typingTotal + 0.5;
      tl.to(dough, { morphSVG: BLOB_A, duration: 0.8, ease: "power2.inOut" }, resetAt);
      tl.to(drips, { morphSVG: DRIPS_NONE, duration: 0.5, ease: "power2.in" }, resetAt);
      tl.to(drips, { fill: "#ffc93c", duration: 0.4 }, resetAt + 0.1);
      tl.to(stamp, { scale: 0.001, duration: 0.3, ease: "back.in(2)" }, resetAt);
      tl.to(bite, { scale: 0.001, duration: 0.3, ease: "back.in(2)" }, resetAt);
      tl.to(marks, { scale: 0.001, duration: 0.25, stagger: 0.012 }, resetAt);
      // Chips and caret reset for the next loop.
      tl.to(lines, { clipPath: "inset(0 100% 0 0)", duration: 0.01 }, resetAt + 0.2);
      lines.forEach((line) => {
        const chips = Array.from(line.children) as HTMLElement[];
        chips.forEach((chip) => {
          tl.set(chip, { clipPath: "inset(0 100% 0 0)" }, resetAt + 0.25);
        });
      });
      if (caret) tl.set(caret, { x: lines[0].offsetLeft, y: 0 }, resetAt + 0.25);
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="mx-auto mt-6 grid w-full max-w-5xl gap-5 md:mt-20 md:grid-cols-2 md:items-center md:gap-10"
    >
      {/* Editor window */}
      <div className="rounded-2xl border-[3px] border-ink bg-white shadow-cartoon">
        <div className="flex items-center gap-2 border-b-[3px] border-ink bg-cream px-4 py-2.5">
          <span className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-tomato" />
          <span className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-mustard" />
          <span className="h-3.5 w-3.5 rounded-full border-2 border-ink bg-teal" />
          <span className="ml-3 font-mono text-xs font-bold text-ink/60">
            donut.quillon
          </span>
        </div>
        <div className="relative px-5 py-4">
          <pre className="font-mono text-[13px] leading-6 text-ink">
            {CODE_LINES.map((line, index) => (
              <div key={index} data-code-line className="whitespace-pre">
                {tokenize(line).map((token, i) => (
                  <span
                    key={i}
                    className={`rounded-md px-0.5 ${CHIP_BG[token.chip]} text-ink`}
                    style={{ clipPath: "inset(0 100% 0 0)" }}
                  >
                    {token.text}
                  </span>
                ))}
              </div>
            ))}
          </pre>
          <span
            data-caret
            aria-hidden="true"
            className="absolute left-5 top-4 h-4 w-[7px] bg-tomato"
          />
        </div>
      </div>

      {/* Film-frame preview */}
      <div className="rounded-2xl border-[3px] border-ink bg-ink p-3 shadow-cartoon">
        <div className="mb-2 flex justify-between px-1" aria-hidden="true">
          {Array.from({ length: SPROCKETS }, (_, i) => (
            <span key={i} className="h-1.5 w-2.5 rounded-full bg-cream" />
          ))}
        </div>
        <div
          data-donut="shutter"
          onPointerDown={onPreviewTap}
          className="relative touch-manipulation overflow-hidden rounded-xl border-2 border-ink bg-cream"
        >
          <svg viewBox="0 0 200 200" className="block h-auto w-full">
            <path
              data-donut="dough"
              d={BLOB_A}
              fill="#ffc93c"
              stroke="#1b1b1b"
              strokeWidth="4"
            />
            <path
              data-donut="drips"
              d={DRIPS_NONE}
              fill="#ffc93c"
              stroke="#1b1b1b"
              strokeWidth="3"
            />
            {SPRINKLE_MARKS.map((mark, index) => (
              <rect
                key={index}
                data-donut="mark"
                x={mark.x - 4}
                y={mark.y - 1.5}
                width="8"
                height="3"
                rx="1.5"
                fill={mark.c}
                transform={`rotate(${mark.r} ${mark.x} ${mark.y}) scale(0.001)`}
                style={{ transformOrigin: `${mark.x}px ${mark.y}px` }}
              />
            ))}
            <g data-donut="stamp" style={{ transform: "scale(0.001)" }}>
              <rect
                x="50"
                y="62"
                width="100"
                height="76"
                rx="6"
                fill="none"
                stroke="#1b1b1b"
                strokeWidth="4"
              />
              <text
                x="100"
                y="104"
                textAnchor="middle"
                fontSize="13"
                fontWeight="700"
                fill="#1b1b1b"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                RENDERED
              </text>
            </g>
            <circle
              data-donut="bite"
              cx="152"
              cy="60"
              r="26"
              fill="#fff6e5"
              stroke="#1b1b1b"
              strokeWidth="4"
              style={{ transform: "scale(0.001)" }}
            />
          </svg>
          <button
            type="button"
            data-donut="replay"
            onClick={replay}
            aria-label="Replay the donut render"
            className="absolute bottom-2 right-2 z-10 inline-flex h-9 items-center gap-1.5 rounded-full border-2 border-ink bg-cream px-3 font-mono text-xs font-bold text-ink shadow-cartoon-sm transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
          >
            Replay
          </button>
        </div>
        <div className="mt-2 flex justify-between px-1" aria-hidden="true">
          {Array.from({ length: SPROCKETS }, (_, i) => (
            <span key={i} className="h-1.5 w-2.5 rounded-full bg-cream" />
          ))}
        </div>
      </div>
    </div>
  );
}
