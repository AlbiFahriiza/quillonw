import Image from "next/image";
import { GitHubButton } from "@/components/github-button";
import { StarSparkleIcon } from "@/components/icons";
import { asset } from "@/lib/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 rounded-t-[2.5rem] border-t-[3px] border-ink bg-ink px-6 pb-10 pt-16 text-cream md:rounded-t-[3.5rem]">
      <StarSparkleIcon
        aria-hidden="true"
        className="absolute -top-6 right-[12%] h-12 w-12 rotate-12 text-mustard"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 text-center">
        <Image
          src={asset("/quillon-mark.png")}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 rounded-2xl border-2 border-cream object-cover"
        />
        <p className="font-grotesk text-2xl font-bold tracking-tight text-cream">
          Quillon
        </p>
        <p className="max-w-md font-sans text-sm leading-6 text-cream/70">
          A programmable video studio — where code becomes cinema.
        </p>
        <GitHubButton variant="onInk" className="mt-2" />
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.25em] text-cream/50">
          © {year} Quillon — Code the frame.
        </p>
      </div>
    </footer>
  );
}
