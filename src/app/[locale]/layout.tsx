import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getCurrentEdition } from "@/lib/race/get-edition";
import { site } from "@/lib/config";
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

  return {
    title: `${site.name}${dateFormatted ? ` - ${dateFormatted}` : ""}`,
    description,
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
    <>
      <script dangerouslySetInnerHTML={{ __html: `document.documentElement.lang="${locale}"` }} />
      <NextIntlClientProvider messages={messages}>
        {children}
      </NextIntlClientProvider>
    </>
  );
}
