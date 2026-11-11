export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://albifahriiza.github.io/quillonw";
export const REPO_URL = "https://github.com/AlbiFahriiza/quillonw";

// Public assets land at the root of the export; the deployment serves them
// under BASE_PATH, so every hand-written reference needs the prefix.
export function asset(path: string): string {
  return `${BASE_PATH}${path}`;
}
