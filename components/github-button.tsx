"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { GitHubMarkIcon, StarBurstIcon } from "@/components/icons";

const NOTICE = "We are building the tools, please wait.";
const TOAST_HOLD_SECONDS = 3.2;

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timeline
        .set(toast, { autoAlpha: 1 })
        .set(toast, { autoAlpha: 0 }, TOAST_HOLD_SECONDS);
      return;
    }

    timeline
      .fromTo(
        toast,
        { autoAlpha: 0, y: 18, scale: 0.94 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.34,
          ease: "back.out(1.7)",
        },
      )
      .to(
        toast,
        { autoAlpha: 0, y: 12, duration: 0.26, ease: "power1.in" },
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
        aria-label="Notify me"
        className={`inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border-2 px-5 font-grotesk text-sm font-bold transition-[background-color,color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-cartoon-sm focus-visible:-translate-y-0.5 active:translate-y-0 ${tone} ${className}`}
      >
        <GitHubMarkIcon className="h-5 w-5 shrink-0" />
        <span className="max-[420px]:hidden">Notify me</span>
      </button>
      {mounted &&
        createPortal(
          <>
            <span role="status" aria-live="polite" className="sr-only">
              {notice ?? ""}
            </span>
            <div
              ref={toastRef}
              aria-hidden="true"
              className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 opacity-0 invisible"
            >
              <div className="flex max-w-full items-center gap-2.5 rounded-3xl border-2 border-ink bg-cream px-5 py-3 text-center shadow-cartoon-sm">
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
