import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Altorp Ultra — Race Admin",
    short_name: "Altorp Ultra",
    description: "Race administration for Altorp Ultra",
    start_url: "/race/admin",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#111827",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      {
        name: "Register Laps",
        url: "/race/admin",
        description: "Register laps for runners",
      },
      {
        name: "Leaderboard",
        url: "/race",
        description: "View the live race leaderboard",
      },
    ],
  };
}
