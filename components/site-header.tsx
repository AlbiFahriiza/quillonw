"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GitHubButton } from "@/components/github-button";
import { asset } from "@/lib/site";

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap
        .matchMedia()
        .add("(prefers-reduced-motion: no-preference)", () => {
          gsap.from("[data-header-item]", {
            y: -28,
            autoAlpha: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: "power3.out",
          });
        });
    },
    { scope: headerRef },
  );

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-4 top-4 z-50 flex items-center justify-between rounded-full border-2 border-ink bg-cream px-4 py-2.5 shadow-cartoon-sm md:inset-x-8 md:top-6 md:px-6"
    >
      <Link
        href="/"
        data-header-item
        className="group flex items-center gap-3"
        aria-label="Quillon home"
      >
        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-ink bg-cream shadow-cartoon-sm transition-transform duration-200 group-hover:-rotate-6">
          <Image
            src={asset("/quillon-mark.png")}
            alt=""
            width={36}
            height={36}
            priority
            className="h-full w-full object-cover"
          />
        </span>
        <span className="font-grotesk text-lg font-bold tracking-tight text-ink">
          Quillon
        </span>
      </Link>
      <div data-header-item>
        <GitHubButton />
      </div>
    </header>
  );
}
