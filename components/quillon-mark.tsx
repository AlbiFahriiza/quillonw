// Vector mark: a film frame whose sprockets advance one hole on hover, so the
// logo reads at 36px instead of turning into a smudge.
export function QuillonMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <rect
        x="2.75"
        y="6.75"
        width="34.5"
        height="26.5"
        rx="6"
        fill="var(--color-cream)"
        stroke="var(--color-ink)"
        strokeWidth="2.5"
      />
      <g className="mark-sprockets">
        {[8, 15, 22, 29].map((x) => (
          <rect
            key={`top-${x}`}
            x={x}
            y="9.3"
            width="3"
            height="2.6"
            rx="1"
            fill="var(--color-ink)"
          />
        ))}
        {[8, 15, 22, 29].map((x) => (
          <rect
            key={`bottom-${x}`}
            x={x}
            y="28.1"
            width="3"
            height="2.6"
            rx="1"
            fill="var(--color-ink)"
          />
        ))}
      </g>
      <path
        d="M16 14.5 L27 20 L16 25.5 Z"
        fill="var(--color-tomato)"
        stroke="var(--color-ink)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        className="mark-arrow"
      />
    </svg>
  );
}
