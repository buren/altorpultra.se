import type { Metadata } from "next";
import Script from 'next/script'
import "./globals.css";

import { Manrope } from 'next/font/google'
import { site } from "@/lib/config";

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: site.name,
  description: `Trail running event in Altorp, Djursholm.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className="scroll-smooth">
      <body
        className={`${manrope.className} antialiased`}
      >
        {children}
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      </body>
    </html>
  );
}
