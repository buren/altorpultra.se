import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { routing } from '@/i18n/routing';
import { getCurrentEdition } from "@/lib/race/get-edition";
import { site } from "@/lib/config";
import { defaultLocale, locales } from "@/i18n/config";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const edition = await getCurrentEdition();
  const dateFormatted = edition?.dateFormatted ?? "";
  const lapDistanceKm = edition?.lapDistanceKm ?? 7;
  const startTime = edition?.startTime ?? "";
  const endTime = edition?.endTime ?? "";

  const description = locale === 'sv'
    ? `Häng med på en episk dag. Altorp ${lapDistanceKm} km-slinga - "Långa gula". ${dateFormatted}, ${startTime}-${endTime}. Så många varv du kan.`
    : `Join us for an epic day. Altorp ${lapDistanceKm} km loop - "Långa gula". ${dateFormatted}, ${startTime}-${endTime}. As many laps as you can.`;

  const canonical = locale === defaultLocale
    ? site.website
    : `${site.website}/${locale}`;

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = l === defaultLocale ? site.website : `${site.website}/${l}`;
  }
  languages["x-default"] = site.website;

  return {
    title: `${site.name}${dateFormatted ? ` - ${dateFormatted}` : ""}`,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      locale: locale === "sv" ? "sv_SE" : "en_US",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <Script src="https://scripts.simpleanalyticscdn.com/latest.js" />
    </NextIntlClientProvider>
  );
}
