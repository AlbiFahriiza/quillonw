import type { MetadataRoute } from "next";

export const dynamic = "force-static";
import { asset } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quillon",
    short_name: "Quillon",
    description: "A programmable video studio — where code becomes cinema.",
    start_url: asset("/"),
    display: "standalone",
    background_color: "#FFF6E5",
    theme_color: "#FFF6E5",
    icons: [
      {
        src: asset("/web-app-manifest-192x192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: asset("/web-app-manifest-512x512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
