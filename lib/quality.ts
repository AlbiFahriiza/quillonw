import gsap from "gsap";

// 2 = full effects, 1 = fewer particles and no gooey filter, 0 = no particles.
export type Tier = 0 | 1 | 2;

const SLOW_FRAME_MS = 20; // sustained above this means we are under ~50fps
const SLOW_FRAMES_TO_DROP = 30;
const WARMUP_FRAMES = 90; // hydration and the entrance are allowed to be janky

let tier: Tier = 2;
let started = false;
const listeners = new Set<(next: Tier) => void>();

export function getTier(): Tier {
  return tier;
}

export function subscribeTier(listener: (next: Tier) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setTier(next: Tier) {
  if (next === tier) return;
  tier = next;
  document.documentElement.dataset.quality = String(tier); // readable from QA and DevTools
  listeners.forEach((listener) => listener(tier));
}

// Watches the frame time on the shared ticker and only ever steps down, so a
// weak phone settles on a lighter tier once instead of flapping between two.
// `?tier=0|1|2` locks the tier for QA.
export function startQualityMonitor() {
  if (started || typeof window === "undefined") return;
  started = true;
  // Tells the stylesheet that scripts ran, which switches its no-JS failsafe off.
  document.documentElement.dataset.motion = "on";

  document.documentElement.dataset.quality = String(tier);
  const locked = new URLSearchParams(window.location.search).get("tier");
  if (locked === "0" || locked === "1" || locked === "2") {
    tier = Number(locked) as Tier;
    document.documentElement.dataset.quality = String(tier);
    return;
  }

  let last = performance.now();
  let ema = 16.7;
  let slow = 0;
  let warmup = WARMUP_FRAMES;

  const tick = () => {
    const now = performance.now();
    const delta = now - last;
    last = now;
    if (document.hidden || delta > 250) return; // tab switch or a stall, not load
    if (warmup > 0) {
      warmup--;
      return;
    }
    ema = ema * 0.9 + delta * 0.1;
    slow = ema > SLOW_FRAME_MS ? slow + 1 : Math.max(0, slow - 1);
    if (slow >= SLOW_FRAMES_TO_DROP) {
      setTier(Math.max(0, tier - 1) as Tier);
      ema = 16.7;
      slow = 0;
      warmup = 60;
      if (tier === 0) gsap.ticker.remove(tick);
    }
  };
  gsap.ticker.add(tick);
}
