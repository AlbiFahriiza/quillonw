// Every donut shape is generated from a few numbers with the same point counts
// (outer contour + hole contour), which is what keeps the path morphs smooth.
export const CX = 200;
export const CY = 136;
const N_OUT = 60;
const N_HOLE = 24;
export const RING_R = 100;
export const HOLE_R = 34;
export const BITE_ANGLE = -0.62; // upper right, in radians from +x with y down

type Pt = [number, number];
const round1 = (v: number) => Math.round(v * 10) / 10;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

function contour(n: number, radius: (theta: number) => number, reverse = false): Pt[] {
  const points: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2 - Math.PI / 2;
    const r = radius(theta);
    points.push([CX + r * Math.cos(theta), CY + r * Math.sin(theta)]);
  }
  return reverse ? points.reverse() : points;
}

// Closed Catmull-Rom spline as cubic Beziers.
function smooth(pts: Pt[]): string {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M${round1(pts[0][0])} ${round1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round1(c1[0])} ${round1(c1[1])} ${round1(c2[0])} ${round1(c2[1])} ${round1(p2[0])} ${round1(p2[1])}`;
  }
  return d + "Z";
}

const shape = (outer: (t: number) => number, hole: (t: number) => number) =>
  smooth(contour(N_OUT, outer)) + smooth(contour(N_HOLE, hole, true));

// A bite is two overlapping circles, so the edge has two scallops and a cusp.
const BITE_CIRCLES = [-0.2, 0.2].map((offset) => {
  const a = BITE_ANGLE + offset;
  return { cx: 106 * Math.cos(a), cy: 106 * Math.sin(a), rho: 38 };
});
function biteRadius(theta: number, r: number): number {
  const ux = Math.cos(theta), uy = Math.sin(theta);
  let out = r;
  for (const c of BITE_CIRCLES) {
    const along = c.cx * ux + c.cy * uy;
    if (along <= 0) continue; // the ray points away from this circle, so it cannot bite
    const off2 = c.cx * c.cx + c.cy * c.cy - along * along;
    if (off2 >= c.rho * c.rho) continue;
    const near = along - Math.sqrt(c.rho * c.rho - off2);
    if (near < out) out = Math.max(near, HOLE_R + 14);
  }
  return out;
}

const ringR = (t: number) => RING_R + 1.8 * Math.sin(5 * t + 0.6);
const blobR = (a: [number, number, number], p: [number, number, number]) => (t: number) =>
  78 + a[0] * Math.sin(2 * t + p[0]) + a[1] * Math.sin(3 * t + p[1]) + a[2] * Math.sin(5 * t + p[2]);

const DRIPS = [
  { at: -0.2, amp: 13 }, { at: 0.9, amp: 8 }, { at: 1.9, amp: 14 }, { at: 3.3, amp: 9 }, { at: 4.4, amp: 12 },
];
const frostingR = (t: number) => {
  let r = 79 + 4 * Math.sin(9 * t);
  for (const { at, amp } of DRIPS) r += amp * Math.exp(-((wrap(t - at) / 0.14) ** 2));
  return r;
};

const hole = (r: number) => () => r;

export const DOUGH = {
  blob: [
    shape(blobR([7, 4, 2], [0.3, 1.2, 0.5]), hole(2.4)),
    shape(blobR([8, 5, 2], [1.4, 0.2, 2.0]), hole(2.4)),
    shape(blobR([6, 5, 3], [2.5, 2.2, 1.1]), hole(2.4)),
  ],
  ring: shape(ringR, hole(HOLE_R)),
  bitten: shape((t) => biteRadius(t, ringR(t)), hole(HOLE_R)),
};

export const FROSTING = {
  tiny: shape(hole(3.4), hole(2.4)),
  sliver: shape(hole(HOLE_R + 1.8), hole(HOLE_R)),
  full: shape(frostingR, hole(HOLE_R)),
  bitten: shape((t) => Math.min(frostingR(t), biteRadius(t, ringR(t)) - 2), hole(HOLE_R)),
};

// Seeded so server and client render the same sprinkles.
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SPRINKLE_COLORS = ["var(--color-teal)", "var(--color-cream)", "var(--color-mustard)", "var(--color-ink)"] as const;
export const SPRINKLES = (() => {
  const rand = mulberry32(99);
  const count = 26;
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.25;
    const radius = 46 + rand() * 28;
    return {
      x: round1(CX + radius * Math.cos(angle)),
      y: round1(CY + radius * Math.sin(angle)),
      rotate: Math.round(rand() * 180),
      color: SPRINKLE_COLORS[i % SPRINKLE_COLORS.length],
      eaten: Math.abs(wrap(angle - BITE_ANGLE)) < 0.5 && radius > 52,
    };
  });
})();
