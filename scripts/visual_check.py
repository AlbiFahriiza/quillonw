#!/usr/bin/env python3
"""Visual verification of the exported quillonw site.

Serves out/ under /quillonw (the real deployment path), screenshots the
hero at the required widths, and reports console errors and horizontal
overflow. Usage: python3 scripts/visual_check.py [width ...]
"""

import json
import subprocess
import sys
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out"
PORT = 8177
WIDTHS = [int(w) for w in sys.argv[1:]] or [320, 375, 430, 768, 1280]
SHOT_DIR = Path("/tmp/render")
SHOT_DIR.mkdir(parents=True, exist_ok=True)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(OUT), **kwargs)

    def log_message(self, *args):
        pass


def serve():
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    Thread(target=server.serve_forever, daemon=True).start()
    return server


def main():
    server = serve()
    base = f"http://127.0.0.1:{PORT}/quillonw/"
    report = {"pages": []}

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in WIDTHS:
            page = browser.new_page(viewport={"width": width, "height": 900})
            errors = []
            page.on(
                "console",
                lambda msg, errors=errors: errors.append(msg.text)
                if msg.type in ("error", "warning")
                else None,
            )
            page.on(
                "pageerror",
                lambda exc, errors=errors: errors.append(str(exc)),
            )
            page.goto(base, wait_until="networkidle")
            page.wait_for_timeout(1200)
            overflow = page.evaluate(
                "document.documentElement.scrollWidth - document.documentElement.clientWidth"
            )
            path = SHOT_DIR / f"hero-{width}.png"
            page.screenshot(path=str(path))
            report["pages"].append(
                {"width": width, "overflow_px": overflow, "console": errors}
            )
            page.close()

        # Film-strip the first second at 375px: catches FOUC and jumps.
        page = browser.new_page(viewport={"width": 375, "height": 667})
        page.goto(base, wait_until="commit")
        frames = []
        for i in range(6):
            page.screenshot(path=str(SHOT_DIR / f"first-second-{i}.png"))
            page.wait_for_timeout(180)
            frames.append(i)
        report["filmstrip_frames"] = frames
        page.close()
        browser.close()

    server.shutdown()
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
