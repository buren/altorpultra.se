import type { Metadata } from "next";
import Script from 'next/script'
import "./globals.css";

import { Manrope } from 'next/font/google'

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Altorp Ultra - May 9, 2026",
  description: 'Join us for an epic day. Altorp 7.0 km loop - "Långa gula". May 9 2026, 10:00-18:00. As many laps as you can.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.className} antialiased`}
      >
        {children}
        <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
      </body>
    </html>
  );
}
