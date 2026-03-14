import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  CalendarDays,
  MapPin,
  Clock,
  Route,
  HandCoins,
  Trees,
  Users,
  Award,
  UtensilsCrossed,
  Music,
  PartyPopper,
} from "lucide-react"

import altorpPic from '../public/altorp.webp'
import { QuestionMarkIcon } from "@radix-ui/react-icons"
import StravaRouteEmbed from "./StravaRouteEmbed"
import FAQ from "./FAQ"
import SectionTitle from "./SectionTitle"
import RegisterButton from "./RegisterButton"
import { routePhotos } from "@/lib/route-photos"
import { edition2025Photos } from "@/lib/edition-2025-photos"
import PhotoGallery from "./PhotoGallery"
import React from "react"
import Navbar from "./Navbar"
import Countdown from "./Countdown"
import Footer from "./Footer"
import { site, DAYS_SHOW_RESULTS_LINK } from "@/lib/config"
import { Edition } from "@/lib/race/editions"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  href?: string;
}

function InfoCard({ icon, title, children, href }: InfoCardProps) {
  const content = (
    <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
      <CardContent className="flex items-center p-6">
        <div className="h-8 w-8 text-primary mr-4 flex-shrink-0">{icon}</div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-gray-700">{children}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getResultsLink(edition: Edition, t: any): { label: string; href: string } | null {
  const now = new Date();
  const endMs = new Date(edition.endDateTime).getTime();
  const startMs = new Date(edition.startDateTime).getTime();
  const nowMs = now.getTime();

  if (nowMs >= startMs && nowMs < endMs) {
    return { label: t('hero.viewLeaderboard'), href: `/race/${edition.year}` };
  }

  const daysSinceEnd = (nowMs - endMs) / (1000 * 60 * 60 * 24);
  if (daysSinceEnd >= 0 && daysSinceEnd <= DAYS_SHOW_RESULTS_LINK) {
    return { label: t('hero.viewResults', { year: edition.year }), href: `/race/${edition.year}` };
  }

  return null;
}

export async function AltorpUltra({ edition, publishedYears }: { edition: Edition; publishedYears: number[] }) {
  const t = await getTranslations();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": site.name,
    "description": `Join us for an epic day. Altorp ${edition.lapDistanceKm} km loop - 'Långa gula'. ${edition.dateFormatted}, ${edition.startTime}-${edition.endTime}. As many laps as you can.`,
    "startDate": edition.startDateTime,
    "endDate": edition.endDateTime,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": "Altorp",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Djursholm",
        "addressRegion": site.region,
        "addressCountry": "SE"
      }
    },
    "image": [altorpPic.src],
    "offers": {
      "@type": "Offer",
      "url": edition.raceIdUrl,
      "price": String(edition.priceSEK),
      "priceCurrency": "SEK",
      "availability": "https://schema.org/InStock",
    },
    "performer": { "@type": "Organization", "name": site.name },
    "organizer": { "@type": "Organization", "name": site.name, "url": site.website, "email": site.email }
  };

  const infoItems = [
    {
      icon: <CalendarDays className="h-8 w-8" />,
      title: t('infoCards.date'),
      description: edition.dateFormatted,
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: t('infoCards.duration'),
      description: `${edition.startTime}-${edition.endTime} (${edition.durationHours}h)`,
    },
    {
      icon: <HandCoins className="h-8 w-8" />,
      title: t('infoCards.price'),
      description: `${edition.priceSEK} SEK`,
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: t('infoCards.location'),
      description: site.location,
      href: edition.googleMaps.startPin,
    },
    {
      icon: <Route className="h-8 w-8" />,
      title: t('infoCards.stravaRoute'),
      description: `"Långa gula" ${edition.lapDistanceKm}km`,
      href: edition.stravaRoute,
    },
    {
      icon: <QuestionMarkIcon className="h-8 w-8" />,
      title: t('infoCards.questions'),
      description: site.email,
      href: `mailto:${site.email}`,
    },
  ];

  const featureItems = [
    {
      icon: <Trees className="h-10 w-10 text-primary" />,
      title: t('moreThanRace.beautifulScenery'),
      description: t('moreThanRace.beautifulSceneryDesc', { lapDistanceKm: edition.lapDistanceKm }),
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: t('moreThanRace.greatCommunity'),
      description: t('moreThanRace.greatCommunityDesc'),
    },
    {
      icon: <Award className="h-10 w-10 text-primary" />,
      title: t('moreThanRace.personalChallenge'),
      description: t('moreThanRace.personalChallengeDesc', { durationHours: edition.durationHours }),
    },
  ];

  const resultsLink = getResultsLink(edition, t);
  const raceIsLive = resultsLink?.label === t('hero.viewLeaderboard');

  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
    <Navbar raceIdUrl={edition.raceIdUrl} />
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <Image
          src={altorpPic}
          alt="Runners in Altorp forest"
          priority
          fill
          sizes="100vw"
          className="object-cover scale-105"
          style={{
            objectPosition: "center 40%",
          }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white text-center tracking-tight [text-shadow:2px_2px_12px_rgba(0,0,0,0.5)]">
            {site.name}
          </h1>
          <p className="text-lg md:text-xl text-white/80 text-center font-medium tracking-wide">
            {edition.dateFormatted} &middot; {site.region}
          </p>
          <Countdown startDateTime={edition.startDateTime} endDateTime={edition.endDateTime} />
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            {!raceIsLive && (
              <a
                href={edition.raceIdUrl}
                className="inline-block bg-white text-gray-900 font-semibold text-lg px-8 py-3 rounded-md hover:bg-white/90 transition-colors shadow-lg"
              >
                {t('hero.registerNow')}
              </a>
            )}
            {resultsLink && (
              <Link
                href={resultsLink.href}
                className="inline-block border-2 border-white text-white font-semibold text-lg px-8 py-3 rounded-md hover:bg-white/10 transition-colors"
              >
                {resultsLink.label}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* About */}
        <section id="about" className="mb-16 text-center scroll-mt-20">
          <SectionTitle title={t('about.title')} />
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed">
              {t.rich('about.text1', {
                strong: (chunks) => <strong>{chunks}</strong>,
                lapDistanceKm: edition.lapDistanceKm,
                lapElevationM: edition.lapElevationM,
              })}
            </p>
            <p className="text-xl text-gray-700 leading-relaxed mt-4">
              {t.rich('about.text2', {
                strong: (chunks) => <strong>{chunks}</strong>,
                durationHours: edition.durationHours,
              })}
            </p>
          </div>
          <div className="text-center mt-8">
            {!raceIsLive && <RegisterButton raceIdUrl={edition.raceIdUrl} />}
          </div>
        </section>

        {/* Kids Race */}
        <section className="mb-16 bg-primary/10 border border-primary/20 rounded-lg p-8 md:p-12 text-center">
          <span className="inline-block bg-primary text-white text-sm font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            {t('kidsRace.badge', { year: edition.year })}
          </span>
          <h2 className="text-3xl font-bold mb-4">{t('kidsRace.title')}</h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
            {t.rich('kidsRace.text', {
              strong: (chunks) => <strong>{chunks}</strong>,
              strong2: (chunks) => <strong>{chunks}</strong>,
              strong3: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </section>

        {/* More Than a Race */}
        <section className="mb-16 bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('moreThanRace.title')}</h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto mb-8">
            {t('moreThanRace.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureItems.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center">
                {feature.icon}
                <h3 className="text-2xl font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
            <div className="flex flex-col items-center">
              <UtensilsCrossed className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-semibold mt-4 mb-2">{t('moreThanRace.foodDrinks')}</h3>
              <p className="text-gray-600">
                {t.rich('moreThanRace.foodDrinksDesc', {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <Music className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-semibold mt-4 mb-2">{t('moreThanRace.music')}</h3>
              <p className="text-gray-600">{t('moreThanRace.musicDesc')}</p>
            </div>
            <div className="flex flex-col items-center">
              <PartyPopper className="h-10 w-10 text-primary" />
              <h3 className="text-2xl font-semibold mt-4 mb-2">{t('moreThanRace.hangOut')}</h3>
              <p className="text-gray-600">{t('moreThanRace.hangOutDesc')}</p>
            </div>
          </div>
        </section>

        {/* Info Cards */}
        <section id="info" className="mb-12 scroll-mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {infoItems.map((item) => (
              <InfoCard key={item.title} icon={item.icon} title={item.title} href={item.href}>
                {item.description}
              </InfoCard>
            ))}
          </div>
        </section>

        <div className="text-center mt-4">
          <RegisterButton raceIdUrl={edition.raceIdUrl} />
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-12 flex justify-center scroll-mt-20">
          <FAQ priceSEK={edition.priceSEK} />
        </div>

        {/* Gallery */}
        <section id="gallery" className="mt-12 scroll-mt-20">
          <SectionTitle title="2025 Edition" />
          <PhotoGallery images={edition2025Photos} />
          <div className="mt-6">
            <Link
              href="/race/2025"
              className="inline-block bg-gray-900 text-white font-semibold px-6 py-2.5 rounded-md hover:bg-gray-800 transition-colors"
            >
              {t('hero.viewResults', { year: 2025 })} &rarr;
            </Link>
          </div>
          <div className="mt-16">
            <SectionTitle title="The Route" />
          </div>
          <PhotoGallery images={routePhotos} />
        </section>

        <div className="mt-12 w-full">
          <StravaRouteEmbed />
        </div>

        <section className="text-center mt-12 mb-8">
          <RegisterButton raceIdUrl={edition.raceIdUrl} />
        </section>
      </main>
    </div>
    <Footer
      durationHours={edition.durationHours}
      stravaRoute={edition.stravaRoute}
      raceIdUrl={edition.raceIdUrl}
      googleMapsStartPin={edition.googleMaps.startPin}
      publishedYears={publishedYears}
    />
  </>;
}
