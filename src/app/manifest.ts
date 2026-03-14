import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Altorp Ultra",
    short_name: "Altorp Ultra",
    description: "Trail running event in Altorp, Djursholm",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "1024x1024", type: "image/png" },
    ],
  };
}
