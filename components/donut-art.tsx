import { useId } from "react";
import { DOUGH, FROSTING, SPRINKLES } from "@/lib/donut-shapes";

// Static markup for the donut scene. Whoever renders it drives it: the hero plays a
// timed timeline, the scroll story scrubs one. Selectors are the data-* attributes.
export function DonutArt({ className = "" }: { className?: string }) {
  const doughId = `donut-dough-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 400 300"
      aria-hidden="true"
      className={`block aspect-[4/3] w-full touch-manipulation overflow-hidden rounded-xl border-2 border-ink bg-cream ${className}`}
    >
      <g data-squash>
        <g data-pre data-dough>
          <g fill="var(--color-ink)" stroke="var(--color-ink)" strokeWidth={3.5} strokeLinejoin="round">
            <use href={`#${doughId}`} transform="translate(9 9)" />
          </g>
          <g fill="var(--color-mustard)" stroke="var(--color-ink)" strokeWidth={3.5} strokeLinejoin="round">
            <path id={doughId} data-dough-path d={DOUGH.blob[0]} fillRule="evenodd" />
          </g>
          <path
            data-frosting
            d={FROSTING.tiny}
            fill="var(--color-tomato)"
            stroke="var(--color-ink)"
            strokeWidth={3.5}
            strokeLinejoin="round"
            fillRule="evenodd"
          />
        </g>
        {SPRINKLES.map((sprinkle, index) => (
          <g key={index} transform={`translate(${sprinkle.x} ${sprinkle.y})`}>
            <g data-pre data-sprinkle={sprinkle.eaten ? "eaten" : "kept"}>
              <rect
                x={-6.5}
                y={-2.5}
                width={13}
                height={5}
                rx={2.5}
                transform={`rotate(${sprinkle.rotate})`}
                fill={sprinkle.color}
                stroke="var(--color-ink)"
                strokeWidth={1.6}
              />
            </g>
          </g>
        ))}
        <g data-pre data-bar>
          <text
            x={24}
            y={257}
            fontFamily="var(--ff-spacemono), monospace"
            fontSize={12}
            fontWeight={700}
            fill="var(--color-ink)"
          >
            render.mp4
          </text>
          <rect x={24} y={264} width={352} height={14} rx={7} fill="#fff" stroke="var(--color-ink)" strokeWidth={2.5} />
          <rect data-bar-fill x={26} y={266} width={348} height={10} rx={5} fill="var(--color-teal)" />
        </g>
        <g transform="translate(112 64) rotate(-9)">
          <g data-pre data-stamp>
            <rect x={-70} y={-19} width={150} height={40} rx={10} fill="var(--color-ink)" />
            <rect x={-75} y={-24} width={150} height={40} rx={10} fill="var(--color-mustard)" stroke="var(--color-ink)" strokeWidth={3} />
            <text
              x={0}
              y={2}
              textAnchor="middle"
              fontFamily="var(--ff-spacemono), monospace"
              fontSize={18}
              fontWeight={700}
              fill="var(--color-ink)"
            >
              RENDERED
            </text>
          </g>
        </g>
      </g>
    </svg>
  );
}
