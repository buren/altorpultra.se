import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { Manrope } from "next/font/google";
import "./globals.css";

import { site } from "@/lib/config";

const manrope = Manrope({ subsets: ["latin"] });

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className="scroll-smooth">
      <body className={`${manrope.className} antialiased`}>{children}</body>
    </html>
  );
}
