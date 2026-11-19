#!/usr/bin/env python3
"""Performance measurement for the quillonw hero.

Runs each required state (idle hero, morph in progress, donut sequence,
sprinkle burst, scroll through the story) for 10s of recorded frames under
CPU throttle (4x and 6x), then reports average fps and 5th-percentile fps
per state. The rAF probe is the measurement only; the site's own animation
clock stays gsap.ticker. Usage: python3 scripts/perf_check.py
"""

import http.server
import json
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright

PORT = 8186


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory="out", **k)

    def log_message(self, *a):
        pass


STATES = {
    "idle_hero": "window.scrollTo(0, 0)",
    "morph": "window.scrollTo(0, 0)",
    "donut_sequence": "window.scrollTo(0, 0)",
    "sprinkle_burst": (
        "const r = document.querySelector('[data-donut=\"shutter\"]')"
        ".getBoundingClientRect();"
        "window.dispatchEvent(new CustomEvent('quillon:sprinkle-burst', "
        "{ detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }))"
    ),
    "scroll_story": (
        "document.querySelector('[data-scroll-story]').scrollIntoView();"
    ),
}

RECORDER = """
window.__frames = [];
window.__recorder = (t) => {
  window.__frames.push(t);
  window.__raf = requestAnimationFrame(window.__recorder);
};
requestAnimationFrame(window.__recorder);
"""

MEASURE_MS = 10000


def p5_fps(deltas):
    if not deltas:
        return 0.0
    deltas = sorted(deltas)
    idx = max(0, int(len(deltas) * 0.05) - 1)
    return 1000.0 / deltas[idx]


def main():
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{PORT}/quillonw/"
    report = {}

    with sync_playwright() as p:
        browser = p.chromium.launch()

        for throttle in (4, 6):
            for label, action in STATES.items():
                ctx = browser.new_context(viewport={"width": 375, "height": 667})
                page = ctx.new_page()
                client = ctx.new_cdp_session(page)
                client.send(
                    "Emulation.setCPUThrottlingRate", {"rate": throttle}
                )
                page.goto(base, wait_until="networkidle")
                page.evaluate(RECORDER)
                page.evaluate(action)

                if label == "scroll_story":
                    page.evaluate(
                        """() => {
                          let y = window.scrollY;
                          window.__scrollTimer = setInterval(() => {
                            y += 8;
                            window.scrollTo(0, y);
                          }, 100);
                        }"""
                    )

                page.wait_for_timeout(MEASURE_MS)
                if label == "scroll_story":
                    page.evaluate("clearInterval(window.__scrollTimer)")
                frames = page.evaluate("window.__frames")
                deltas = [
                    (b - a) for a, b in zip(frames, frames[1:]) if b > a
                ]
                avg = 1000.0 / (sum(deltas) / len(deltas)) if deltas else 0.0
                report[f"{label}@{throttle}x"] = {
                    "avg_fps": round(avg, 1),
                    "p5_fps": round(p5_fps(deltas), 1),
                    "frames": len(deltas) + 1,
                }
                ctx.close()

        # Desktop pass for the scroll story (pinned).
        ctx = browser.new_context(viewport={"width": 1280, "height": 800})
        page = ctx.new_page()
        client = ctx.new_cdp_session(page)
        client.send("Emulation.setCPUThrottlingRate", {"rate": 6})
        page.goto(base, wait_until="networkidle")
        page.evaluate(RECORDER)
        page.evaluate(STATES["scroll_story"])
        page.evaluate(
            """() => {
              let y = window.scrollY;
              window.__scrollTimer = setInterval(() => {
                y += 10;
                window.scrollTo(0, y);
              }, 100);
            }"""
        )
        page.wait_for_timeout(MEASURE_MS)
        page.evaluate("clearInterval(window.__scrollTimer)")
        frames = page.evaluate("window.__frames")
        deltas = [(b - a) for a, b in zip(frames, frames[1:]) if b > a]
        avg = 1000.0 / (sum(deltas) / len(deltas)) if deltas else 0.0
        report["scroll_story_desktop@6x"] = {
            "avg_fps": round(avg, 1),
            "p5_fps": round(p5_fps(deltas), 1),
            "frames": len(deltas) + 1,
        }
        ctx.close()
        browser.close()

    server.shutdown()
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
