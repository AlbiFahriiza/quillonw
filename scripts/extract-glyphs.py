#!/usr/bin/env python3
"""Extract SVG glyph outlines for the COMING SOON morph.

One-off generator: reads the four display fonts used by the hero cycle,
instances the variable ones at wght=700, extracts the outlines of the
letters C, O, M, I, N, G, S and writes them as normalised SVG path data
to lib/coming-soon-paths.ts.

Each font keeps its natural advance-based spacing, is scaled so every
line occupies the same total width, and is centred on the shared ink
bounding box. The overall box therefore never changes between fonts,
which is what fixes the width jitter (bug B5).

Usage: python3 scripts/extract-glyphs.py <font-dir> <out-file>
The font directory must contain Bungee-Regular.ttf, SpaceMono-Bold.ttf,
SpaceGrotesk-wght.ttf and PlayfairDisplay-Italic-wght.ttf.
"""

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.misc.transform import Transform

# Order matches FONT_CYCLE in components/hero.tsx.
FONTS = [
    ("grotesk", "SpaceGrotesk-wght.ttf", {"wght": 700}),
    ("playfair", "PlayfairDisplay-Italic-wght.ttf", {"wght": 700}),
    ("spacemono", "SpaceMono-Bold.ttf", {}),
    ("bungee", "Bungee-Regular.ttf", {}),
]

LETTERS = "COMINGS"

# Letter gap and word gap in em, plus the slot reserved for the separator
# star that lives at the end of the line inside the same SVG.
GAP_EM = 0.22
WORD_GAP_EM = 0.5
STAR_SLOT_EM = 0.9

# Three decimals keep sub-pixel smoothness for the morph at display sizes
# (1 unit ~ 60px on a phone) while the total data stays small.
COORD_PRECISION = 3


def ntos(value: float) -> str:
    return f"{value:.{COORD_PRECISION}f}".rstrip("0").rstrip(".") or "0"


def load_font(path: Path, location: dict[str, int]) -> TTFont:
    font = TTFont(str(path))
    if "fvar" in font and location:
        from fontTools.varLib.instancer import instantiateVariableFont

        instantiateVariableFont(font, location, inplace=True)
    return font


class KeepTopKContoursPen:
    """Keep only the k largest closed contours, largest first.

    MorphSVGPlugin matches contours by size across the two shapes being
    morphed, so a glyph must carry the same contour count as its partner
    in every other font. Playfair's italic N splits its serif terminals
    into extra tiny contours (3 vs 1 everywhere else); keeping the
    largest contour restores the match. Letters whose counts already
    agree everywhere (O and its counter) pass through untouched.
    """

    def __init__(self, out_pen, k):
        self.out_pen = out_pen
        self.k = k
        self._contours = []
        self._current = None

    def _closeCurrent(self):
        if self._current:
            self._contours.append(self._current)
            self._current = None

    def moveTo(self, pt):
        self._closeCurrent()
        self._current = [("moveTo", (pt,))]

    def lineTo(self, pt):
        self._current.append(("lineTo", (pt,)))

    def qCurveTo(self, *pts):
        self._current.append(("qCurveTo", pts))

    def curveTo(self, *pts):
        self._current.append(("curveTo", pts))

    def closePath(self):
        self._current.append(("closePath", ()))
        self._closeCurrent()

    def endPath(self):
        self._closeCurrent()

    def addComponent(self, glyph_name, transform):
        self.out_pen.addComponent(glyph_name, transform)

    def result(self):
        self._closeCurrent()
        sized = []
        for contour in self._contours:
            xs = [p[0] for op, args in contour for p in args if p]
            ys = [p[1] for op, args in contour for p in args if p]
            if not xs:
                continue
            area = (max(xs) - min(xs)) * (max(ys) - min(ys))
            sized.append((area, contour))
        sized.sort(key=lambda item: -item[0])
        # Draw largest-first so the outer outline is always contour 0, the
        # position every other font's matching contour also occupies.
        for _, contour in sized[: self.k]:
            for op, args in contour:
                getattr(self.out_pen, op)(*args)
        return len(sized) > 0


def main() -> None:
    font_dir = Path(sys.argv[1])
    out_file = Path(sys.argv[2])

    per_font = {}
    for key, filename, location in FONTS:
        font = load_font(font_dir / filename, location)
        upm = font["head"].unitsPerEm
        cmap = font.getBestCmap()
        glyph_set = font.getGlyphSet()

        # Contour counts per letter, used to compute the target count the
        # four fonts must agree on for a letter (majority wins).
        contour_counts = {}
        for ch in LETTERS:
            gn = cmap[ord(ch)]
            rp = RecordingPen()
            glyph_set[gn].draw(rp)
            contour_counts[ch] = sum(
                1 for op, _ in rp.value if op == "closePath"
            )

        glyphs = {}
        for ch in LETTERS:
            glyph_name = cmap[ord(ch)]
            glyph = glyph_set[glyph_name]
            bounds_pen = BoundsPen(glyph_set)
            glyph.draw(bounds_pen)
            glyphs[ch] = {
                "name": glyph_name,
                # Em-space metrics: bounds relative to the pen origin,
                # advance for the natural spacing.
                "lsb": bounds_pen.bounds[0] / upm,
                "x1": bounds_pen.bounds[2] / upm,
                "y0": bounds_pen.bounds[1] / upm,
                "y1": bounds_pen.bounds[3] / upm,
                "advance": font["hmtx"][glyph_name][0] / upm,
            }
        per_font[key] = {
            "glyph_set": glyph_set,
            "upm": upm,
            "glyphs": glyphs,
            "contours": contour_counts,
        }

    def line_layout(glyphs):
        seq = ["C", "O", "M", "I", "N", "G", " ", "S", "O", "O", "N"]
        placements = []
        x = 0.0
        for ch in seq:
            if ch == " ":
                x += WORD_GAP_EM
                continue
            placements.append((ch, x))
            x += glyphs[ch]["advance"] + GAP_EM
        x -= GAP_EM
        x += WORD_GAP_EM + STAR_SLOT_EM
        return placements, x

    layouts = {}
    widths = {}
    for key, data in per_font.items():
        placements, total_w = line_layout(data["glyphs"])
        layouts[key] = placements
        widths[key] = total_w

    # Shared canvas: the widest line sets the width; the tallest scaled ink
    # span sets the height, so every font fits without cropping.
    view_w = max(widths.values())
    ink_heights = {}
    for key, data in per_font.items():
        s = widths[key] / view_w
        y0 = min(g["y0"] for g in data["glyphs"].values())
        y1 = max(g["y1"] for g in data["glyphs"].values())
        ink_heights[key] = s * (y1 - y0)
    view_h = max(ink_heights.values())

    # Target contour count per letter: what the majority of fonts carry.
    # A font with more (Playfair's N serif terminals) gets trimmed to it;
    # a letter whose counts differ (O: 2 with counter) stays 2 everywhere.
    target_contours = {}
    for ch in LETTERS:
        counts = [per_font[key]["contours"][ch] for key, _, _ in FONTS]
        target_contours[ch] = max(set(counts), key=counts.count)

    path_data = {}
    for key, data in per_font.items():
        glyphs = data["glyphs"]
        s = widths[key] / view_w

        # Ink bounding box of the laid-out line, in em, pen-origin relative.
        placed = layouts[key]
        ink_x0 = min(x + glyphs[ch]["lsb"] for ch, x in placed)
        ink_x1 = max(x + glyphs[ch]["x1"] for ch, x in placed)
        ink_y0 = min(g["y0"] for g in glyphs.values())
        ink_y1 = max(g["y1"] for g in glyphs.values())

        # Centre the scaled ink box on the canvas: identical overall
        # bbox for every font, so swapping fonts never shifts layout.
        dx = (view_w - s * (ink_x1 - ink_x0)) / 2 - s * ink_x0
        # Flip y (font units grow up, SVG grows down) and centre vertically.
        dy = view_h / 2 + s * (ink_y0 + ink_y1) / 2

        # Transform: em = units/upm, then scale, flip and translate.
        t = Transform(s / data["upm"], 0, 0, -s / data["upm"], dx, dy)
        font_paths = []
        for ch, _ in placed:
            pen = SVGPathPen(data["glyph_set"], ntos=ntos)
            filtered = KeepTopKContoursPen(pen, target_contours[ch])
            data["glyph_set"][glyphs[ch]["name"]].draw(
                TransformPen(filtered, t)
            )
            filtered.result()
            font_paths.append(pen.getCommands())
        path_data[key] = font_paths

    # Star geometry in em units, centred on its own origin: the separator
    # morphs through these shapes. All single-contour so MorphSVG matches
    # them cleanly; the ring uses two arcs to fake a closed circle.
    star_r = 0.26

    def star_points(points: int, outer: float, inner: float) -> str:
        import math

        coords = []
        for i in range(points * 2):
            r = outer if i % 2 == 0 else inner
            a = math.pi / points * i - math.pi / 2
            coords.append(f"{r * math.cos(a):.3f} {r * math.sin(a):.3f}")
        return "M" + "L".join(coords) + "Z"

    star_shapes = [
        star_points(4, star_r, star_r * 0.28),
        star_points(5, star_r, star_r * 0.42),
        f"M0 -{star_r:.3f}A{star_r:.3f} {star_r:.3f} 0 1 1 -0.001 -{star_r:.3f}Z",
        star_points(6, star_r, star_r * 0.5),
    ]
    star_cx = view_w - 0.55 * star_r
    star_cy = view_h / 2

    # Per-slot ink centres (from the reference font) for the static tilt
    # origin used by the component.
    ref = FONTS[0][0]
    ref_s = widths[ref] / view_w
    ref_dx = None
    slots = []
    glyph_list = per_font[ref]["glyphs"]
    placed_ref = layouts[ref]
    ink_x0 = min(x + glyph_list[ch]["lsb"] for ch, x in placed_ref)
    ink_x1 = max(x + glyph_list[ch]["x1"] for ch, x in placed_ref)
    ref_dx = (view_w - ref_s * (ink_x1 - ink_x0)) / 2 - ref_s * ink_x0
    for ch, x in placed_ref:
        g = glyph_list[ch]
        slots.append(
            {
                "key": ch,
                "cx": ref_dx + ref_s * (x + (g["lsb"] + g["x1"]) / 2),
                "cy": view_h / 2,
            }
        )

    out_lines = [
        "// AUTO-GENERATED by scripts/extract-glyphs.py — do not edit by hand.",
        "// Glyph outlines for the COMING SOON morph. Each font is scaled to",
        "// the same total line width and centred on the shared ink box, so",
        "// morphs never shift the bounding box. PATHS entries are positioned",
        "// per slot in the shared viewBox, in FONT_KEYS order.",
        "",
        f"export const VIEW_W = {view_w:.3f};",
        f"export const VIEW_H = {view_h:.3f};",
        "",
        "export const FONT_KEYS = [",
    ]
    for key, _, _ in FONTS:
        out_lines.append(f'  "{key}",')
    out_lines.append("] as const;")
    out_lines.append("")
    out_lines.append(
        "// Ink centre per slot: the origin for the static per-letter tilt."
    )
    out_lines.append(
        "export const SLOTS: { key: string; cx: number; cy: number }[] = ["
    )
    for slot in slots:
        out_lines.append(
            f'  {{ key: "{slot["key"]}", cx: {slot["cx"]:.3f}, cy: {slot["cy"]:.3f} }},'
        )
    out_lines.append("];")
    out_lines.append("")
    out_lines.append("// The separator star morphs through these shapes in order.")
    out_lines.append("export const STAR_SHAPES = [")
    for d in star_shapes:
        out_lines.append(f'  "{d}",')
    out_lines.append("] as const;")
    out_lines.append(f"export const STAR_CX = {star_cx:.3f};")
    out_lines.append(f"export const STAR_CY = {star_cy:.3f};")
    out_lines.append("")
    out_lines.append("export const PATHS: Record<string, string[]> = {")
    for key, _, _ in FONTS:
        out_lines.append(f'  "{key}": [')
        for d in path_data[key]:
            out_lines.append(f'    "{d}",')
        out_lines.append("  ],")
    out_lines.append("};")
    out_lines.append("")

    out_file.write_text("\n".join(out_lines), encoding="utf-8")
    print(f"wrote {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")
    for key in per_font:
        print(f"  {key}: line {widths[key]:.3f} em, scale {widths[key] / view_w:.4f}")


if __name__ == "__main__":
    main()
