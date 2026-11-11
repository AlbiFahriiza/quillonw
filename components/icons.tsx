import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function starPath(points: number, outer: number, inner: number): string {
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    coords.push(
      `${(12 + radius * Math.cos(angle)).toFixed(2)},${(12 + radius * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return `M${coords.join("L")}Z`;
}

const STAR_SPARKLE = starPath(4, 11, 3.1);
const STAR_BURST = starPath(6, 11.5, 4.6);

function StrokeIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GitHubMarkIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function StarSparkleIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path d={STAR_SPARKLE} fill="currentColor" stroke="var(--color-ink)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function StarBurstIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...props}
    >
      <path d={STAR_BURST} fill="currentColor" stroke="var(--color-ink)" strokeWidth={1.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export function TealDiscIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9.5" fill="currentColor" stroke="var(--color-ink)" strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
      <circle cx="15.5" cy="8.5" r="1.6" fill="var(--color-cream)" />
    </svg>
  );
}

export function SquiggleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 80 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 12c6-11 13-11 19 0s13 11 19 0 13-11 19 0 13 11 17 4"
        stroke="var(--color-ink)"
        strokeWidth={2.6}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </StrokeIcon>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <line x1="21" x2="14" y1="4" y2="4" />
      <line x1="10" x2="3" y1="4" y2="4" />
      <line x1="21" x2="12" y1="12" y2="12" />
      <line x1="8" x2="3" y1="12" y2="12" />
      <line x1="21" x2="16" y1="20" y2="20" />
      <line x1="12" x2="3" y1="20" y2="20" />
      <line x1="14" x2="14" y1="2" y2="6" />
      <line x1="8" x2="8" y1="10" y2="14" />
      <line x1="16" x2="16" y1="18" y2="22" />
    </StrokeIcon>
  );
}

export function ClapperboardIcon(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
      <path d="m6.2 5.3 3.1 3.9" />
      <path d="m12.4 3.4 3.1 4" />
      <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </StrokeIcon>
  );
}
