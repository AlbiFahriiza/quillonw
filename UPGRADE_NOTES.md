# Upgrade notes

What changed, how it was checked, and what was not. Written for whoever picks this repo up next, human or agent.

## What changed

- **Marquee** is full edge to edge on phones. The bleed (`--bleed: max(3rem, 4vw)`) now clears the 16px corner radius and the border; it used to be 2vw (7.5px at 375px), so the rounded ends showed at the screen edge.
- **COMING SOON** is one fixed-viewBox SVG. Each letter morphs (GSAP `MorphSVGPlugin`) between the outlines of four fonts, with a squash-and-spring on every letter. Outlines are baked by `scripts/extract-glyphs.py` into `lib/coming-soon-paths.ts`; the width is identical across fonts, so there is no layout shift and no overflow at 320px.
- **Donut demo** in the hero: a code window typed as a joke ("a piece of donut creates") next to a film-frame preview where dough morphs into a ring, gets frosting, sprinkles, a render bar, a RENDERED stamp, and a bite. Tap the preview for sprinkles. All geometry is generated in `lib/donut-shapes.ts` with equal point counts so the morphs stay smooth.
- **Sprinkles**: one canvas, flat palette colours, no gradients or glow. One viewport tall and `sticky`, so its backing store stays small.
- **Scroll story** (What is Quillon): the three existing frames became three scenes (Write, Edit, Render) that continue the donut. Pinned on desktop, unpinned and scrubbed on phones.
- **No opacity animation anywhere.** Entrances are masks, clip-path wipes, transforms and morphs. First-paint states live in CSS (`@media (scripting: enabled)`), with a 4-second failsafe if scripts never run.
- Header button reads "GitHub" (it was labelled "Notify me" with a GitHub icon). Inter, Playfair Display and Bungee are gone; only Space Grotesk and Space Mono load.
- `lib/quality.ts` watches frame time and steps the page down (sprinkles, then morph loop, then demo parks on a calm frame). `?tier=0|1|2` locks it for QA; the current tier is on `<html data-quality>`.

## Not a bug (earlier claim retracted)

The Open Graph image path was reported as broken. It is not: Next joins `metadataBase`'s path with relative URLs, so `/og-image.png` correctly becomes `.../quillonw/og-image.png`. Verified in `node_modules/next/dist/lib/metadata/resolvers/resolve-url.js` and in the built `out/index.html`.

## Checked

Run in a sandbox with headless Chromium (software rendering) against a static export served under `/quillonw`:

- `npm run lint` clean; `next build` passes including TypeScript.
- No horizontal scroll at 320, 375, 430, 768, 1280, 1920, 2560px. No console errors.
- Marquee edges inspected at 320, 430, 2560px: no rounded corners visible.
- Reduced motion renders a complete static composition. Scripts blocked: the page appears after the failsafe. Tab order: logo, GitHub, Replay.
- Bundle (gzip): JS 227 KB -> about 249 KB (MorphSVG), CSS 5.0 -> 5.9 KB, font families 5 -> 2.

Frame rate (rAF counter, Chromium, `tier` unlocked, measured after adaptation settled):

| Page | CPU throttle | Average fps | Frames over 33 ms |
|---|---|---|---|
| Hero, 375px | 1x | 60.0 | 0 of 720 |
| Hero, 375px | 6x | 60.0 | 0 of 720 |
| Hero, 1280px | 4x | 59.9 | 0 of 719 |
| Hero, 375px | 4x | 56.5 | 11 of 680 |
| Story scroll, 375px | 1x | 59.5 | 2 of 517 |
| Story scroll, 1280px | 1x | 59.1 | 3 of 531 |
| Story scroll, 1280px | 4x | about 50 | about 14-23 of 600 |

At 4x-6x the page reaches these numbers by stepping down a tier (the throttled runs ended at tier 0). With the tier locked at 2 (`?tier=2`, no adaptation), 375px at 6x averages about 24 fps and 4x about 38 fps, so full effects need a reasonably capable device; weaker ones get the lighter tiers automatically.

## Not checked

- Real devices. Throttled headless Chromium is a proxy; weak-phone behaviour needs a real test.
- The story scroll at heavy throttle still drops frames (above); its adaptation only swaps morphs for jumps.
- Google Fonts were unreachable in the sandbox, so builds used local copies of the same font files. The real build fetches them as before.
- Safari and Firefox were not run. `translate`, `svh`, `@media (scripting)` and `ch` units are all modern-baseline, but unverified there.
- Hosted deploy (GitHub Pages) was not exercised.

## Regenerating the glyph data

```
pip install fonttools skia-pathops
python3 scripts/extract-glyphs.py
```
