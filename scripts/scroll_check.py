#!/usr/bin/env python3
"""Verify the scroll story: desktop pin, phone per-scene scrub."""

import http.server
import json
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler

from playwright.sync_api import sync_playwright


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory="out", **k)

    def log_message(self, *a):
        pass


def main():
    server = HTTPServer(("127.0.0.1", 8184), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    with sync_playwright() as p:
        b = p.chromium.launch()

        page = b.new_page(viewport={"width": 1280, "height": 800})
        page.goto("http://127.0.0.1:8184/quillonw/", wait_until="networkidle")
        page.wait_for_timeout(500)
        print(
            "desktop:",
            json.dumps(
                page.evaluate(
                    """() => ({
                      pinSpacers: document.querySelectorAll('.pin-spacer').length,
                      story: !!document.querySelector('[data-scroll-story]'),
                    })"""
                )
            ),
        )
        page.close()

        page = b.new_page(viewport={"width": 375, "height": 667})
        page.goto("http://127.0.0.1:8184/quillonw/", wait_until="networkidle")
        page.wait_for_timeout(400)
        print(
            "phone-before-scroll:",
            json.dumps(
                page.evaluate(
                    """() => ({
                      pinSpacers: document.querySelectorAll('.pin-spacer').length,
                      sceneCount: document.querySelectorAll('[data-scene-donut]').length,
                    })"""
                )
            ),
        )
        page.evaluate(
            "document.querySelector('[data-scroll-story]').scrollIntoView()"
        )
        page.wait_for_timeout(400)
        scale = page.evaluate(
            """() => {
              const el = document.querySelector('[data-scene-donut="1"] [data-scene-shape]');
              return el.getAttribute('transform') || el.style.transform || '(none)';
            }"""
        )
        print("phone scene1 transform after scroll:", scale)
        page.close()
        b.close()
    server.shutdown()


if __name__ == "__main__":
    main()
