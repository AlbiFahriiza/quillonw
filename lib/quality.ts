"use client";

import gsap from "gsap";

/**
 * Runtime quality tier, shared by every animated component.
 *
 * One EMA of the gsap ticker delta decides the tier: if the smoothed frame
 * time stays above SLOW_MS for SLOW_FRAMES consecutive frames, the tier
 * drops one step and never rises again in the session (no flapping). Tier 2
 * is full effects, tier 1 fewer particles and no gooey filter, tier 0 static
 * backgrounds only.
 *
 * Components subscribe with onQualityChange and read the current value with
 * qualityTier(); the value deliberately does not live in React state,
 * because it can change every few frames and re-rendering on it would cost
 * more than it saves.
 */

export type QualityTier = 0 | 1 | 2;

const SLOW_MS = 20;
const SLOW_FRAMES = 30;
const EMA_ALPHA = 0.1;

type Listener = (tier: QualityTier) => void;

let tier: QualityTier = 2;
let emaMs: number | null = null;
let slowStreak = 0;
let measuring = false;
const listeners = new Set<Listener>();

// gsap passes deltaTime in seconds; the contract talks milliseconds.
function onTick(_time: number, deltaTimeSeconds: number) {
  const deltaTime = deltaTimeSeconds * 1000;
  if (deltaTime <= 0) return;
  emaMs =
    emaMs === null
      ? deltaTime
      : EMA_ALPHA * deltaTime + (1 - EMA_ALPHA) * emaMs;

  if (emaMs > SLOW_MS) {
    slowStreak += 1;
    if (slowStreak >= SLOW_FRAMES && tier > 0) {
      tier = (tier - 1) as QualityTier;
      slowStreak = 0;
      for (const listener of listeners) listener(tier);
    }
  } else {
    slowStreak = 0;
  }
}

export function qualityTier(): QualityTier {
  return tier;
}

export function onQualityChange(listener: Listener): () => void {
  listeners.add(listener);
  if (!measuring) {
    measuring = true;
    gsap.ticker.add(onTick);
  }
  return () => {
    listeners.delete(listener);
  };
}
