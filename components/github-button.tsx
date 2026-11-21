"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { GitHubMarkIcon, StarBurstIcon } from "@/components/icons";

const NOTICE = "We are building the tools, please wait.";
const TOAST_HOLD_SECONDS = 3.2;
// Same unit on both ends so GSAP can interpolate the inset.
const TOAST_HIDDEN = "inset(160px 0px 0px 0px)";
const TOAST_SHOWN = "inset(-14px -14px -14px -14px)";

const emptySubscribe = () => () => {};

// Server snapshot stays false so the portal (a document.body child) only
// renders after hydration.
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

type GitHubButtonProps = {
  variant?: "default" | "onInk";
  className?: string;
};

export function GitHubButton({
  variant = "default",
  className = "",
}: GitHubButtonProps) {
  const toastRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const mounted = useMounted();

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  function notify() {
    setNotice(NOTICE);
    const toast = toastRef.current;
    if (!toast) return;

    timelineRef.current?.kill();
    const timeline = gsap.timeline({
      onComplete: () => setNotice(null),
    });
    timelineRef.current = timeline;

    // Portaled toast outside the GSAP-animated header, so transforms there
    // can never turn this fixed layer into its containing block.
    // Hidden and shown by clipping the pill, never by fading it. The shown inset is
    // negative so the hard shadow is not cut off.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timeline
        .set(toast, { clipPath: TOAST_SHOWN })
        .set(toast, { clipPath: TOAST_HIDDEN }, TOAST_HOLD_SECONDS);
      return;
    }

    timeline
      .fromTo(
        toast,
        { clipPath: TOAST_HIDDEN, y: 24, scale: 0.94 },
        {
          clipPath: TOAST_SHOWN,
          y: 0,
          scale: 1,
          duration: 0.45,
          ease: "back.out(1.7)",
        },
      )
      .to(
        toast,
        { clipPath: TOAST_HIDDEN, y: 16, duration: 0.3, ease: "power3.in" },
        `+=${TOAST_HOLD_SECONDS}`,
      );
  }

  const tone =
    variant === "onInk"
      ? "border-cream bg-ink text-cream hover:bg-tomato hover:text-cream"
      : "border-ink bg-cream text-ink hover:bg-tomato hover:text-cream";

  return (
    <>
      <button
        type="button"
        onClick={notify}
        aria-label="GitHub, coming soon"
        className={`inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border-2 px-5 font-grotesk text-sm font-bold transition-[background-color,color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-cartoon-sm focus-visible:-translate-y-0.5 active:translate-y-0 ${tone} ${className}`}
      >
        <GitHubMarkIcon className="h-5 w-5 shrink-0" />
        <span className="max-[420px]:hidden">GitHub</span>
      </button>
      {mounted &&
        createPortal(
          <>
            <span role="status" aria-live="polite" className="sr-only">
              {notice ?? ""}
            </span>
            <div
              aria-hidden="true"
              className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
            >
              <div
                ref={toastRef}
                style={{ clipPath: TOAST_HIDDEN }}
                className="flex max-w-full items-center gap-2.5 rounded-3xl border-2 border-ink bg-cream px-5 py-3 text-center shadow-cartoon-sm"
              >
                <StarBurstIcon className="h-4 w-4 shrink-0 text-mustard" />
                <p className="font-grotesk text-sm font-bold text-ink">
                  {NOTICE}
                </p>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
