import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gli Attomatti — Compagnia Teatrale Zurigo",
    short_name: "Gli Attomatti",
    description: "Compagnia teatrale amatoriale di lingua italiana a Zurigo.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#fb7185",
    icons: [
      {
        src: "/logo_attomatti.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48 256x256",
        type: "image/x-icon"
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
