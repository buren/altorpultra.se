import type { Metadata } from "next";
import "./globals.css";

import { Manrope } from 'next/font/google'

const manrope = Manrope({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Altorp Ultra - May 10, 2025",
  description: "How many laps can you do? Join us for an epic day. Challenge yourself, go further than you think you could.",
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
      </body>
    </html>
  );
}
