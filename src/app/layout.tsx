import type { Metadata } from "next";
import Script from 'next/script'
import "./globals.css";

import { Manrope } from 'next/font/google'
import { site } from "@/lib/config";
import { getCurrentEdition } from "@/lib/race/get-edition";

export const dynamic = "force-dynamic";

const manrope = Manrope({ subsets: ['latin'] });

export async function generateMetadata(): Promise<Metadata> {
  const edition = await getCurrentEdition();
  const dateFormatted = edition?.dateFormatted ?? "";
  const lapDistanceKm = edition?.lapDistanceKm ?? 7;
  const startTime = edition?.startTime ?? "";
  const endTime = edition?.endTime ?? "";

  return {
    title: `${site.name}${dateFormatted ? ` - ${dateFormatted}` : ""}`,
    description: `Join us for an epic day. Altorp ${lapDistanceKm} km loop - "Långa gula". ${dateFormatted}, ${startTime}-${endTime}. As many laps as you can.`,
  };
}

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
