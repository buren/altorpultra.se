import type { Metadata } from "next";
import Script from 'next/script'
import "./globals.css";

import { Manrope } from 'next/font/google'
import { event, site } from "@/lib/config";

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `${site.name} - ${event.dateFormatted}`,
  description: `Join us for an epic day. Altorp ${event.lapDistanceKm} km loop - "Långa gula". ${event.dateFormatted}, ${event.startTime}-${event.endTime}. As many laps as you can.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${manrope.className} antialiased`}
      >
        {children}
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      </body>
    </html>
  );
}
