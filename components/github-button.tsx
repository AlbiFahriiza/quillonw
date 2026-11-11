import { GitHubMarkIcon } from "@/components/icons";
import { REPO_URL } from "@/lib/site";

type GitHubButtonProps = {
  variant?: "default" | "onInk";
  className?: string;
};

export function GitHubButton({
  variant = "default",
  className = "",
}: GitHubButtonProps) {
  const tone =
    variant === "onInk"
      ? "border-cream bg-ink text-cream hover:bg-tomato hover:text-cream"
      : "border-ink bg-cream text-ink hover:bg-tomato hover:text-cream";

  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Star on GitHub"
      className={`inline-flex h-11 items-center gap-2.5 rounded-full border-2 px-5 font-grotesk text-sm font-bold transition-[background-color,color,translate,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-cartoon-sm focus-visible:-translate-y-0.5 active:translate-y-0 ${tone} ${className}`}
    >
      <GitHubMarkIcon className="h-5 w-5 shrink-0" />
      <span className="max-[420px]:hidden">Star on GitHub</span>
    </a>
  );
}
