import type { Metadata } from "next";
import "./globals.css";

import { site } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(site.website),
  title: site.name,
  description: `Trail running event in Altorp, Djursholm.`,
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "sv_SE",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
