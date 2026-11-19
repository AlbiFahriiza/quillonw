import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--ff-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--ff-spacemono",
  display: "swap",
});

const title = "Quillon — Code the frame.";
const description =
  "Quillon is a programmable video studio — where code becomes cinema. Write code, edit programmatically, render cinema. Coming soon.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "Quillon",
  keywords: [
    "Quillon",
    "programmable video studio",
    "video editing",
    "code",
    "cinema",
    "render",
    "developer tools",
  ],
  authors: [{ name: "AlbiFahriiza", url: "https://github.com/AlbiFahriiza" }],
  creator: "AlbiFahriiza",
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Quillon",
    title,
    description:
      "A programmable video studio — where code becomes cinema. Coming soon.",
    locale: "en_US",
    images: [
      {
        // Root-relative metadata URLs get the basePath prepended by Next
        // itself; routing through asset() here would double the prefix.
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Quillon — Code the frame. Coming soon.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description:
      "A programmable video studio — where code becomes cinema. Coming soon.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FFF6E5",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable}`}
    >
      <body className="flex min-h-svh flex-col overflow-x-clip">{children}</body>
    </html>
  );
}
