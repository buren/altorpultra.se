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
} from "lucide-react"

import altorpPic from '../public/altorp.webp'
import { QuestionMarkIcon } from "@radix-ui/react-icons"
import GoogleMapsRoute from "./GoogleMapsRoute"
import FAQ from "./FAQ"
import SectionTitle from "./SectionTitle"
import RegisterButton from "./RegisterButton"
import { routePhotos } from "@/lib/route-photos"
import PhotoGallery from "./PhotoGallery"
import React from "react"
import Navbar from "./Navbar"
import Countdown from "./Countdown"
import Footer from "./Footer"
import { currentYear, event, googleMaps, raceIdUrl, stravaRoutes } from "@/lib/constants"

function eventStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": event.name,
    "description": `Join us for an epic day. Altorp ${event.lapDistanceKm} km loop - 'Långa gula'. ${event.dateFormatted}, ${event.startTime}-${event.endTime}. As many laps as you can.`,
    "startDate": event.startDateTime,
    "endDate": event.endDateTime,
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": "Altorp",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Djursholm",
        "addressRegion": event.region,
        "addressCountry": "SE"
      }
    },
    "image": [
      altorpPic.src
    ],
    "offers": {
      "@type": "Offer",
      "url": raceIdUrl,
      "price": String(event.priceSEK),
      "priceCurrency": "SEK",
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-10-09T00:00:00+02:00"
    },
    "performer": {
      "@type": "Organization",
      "name": event.name
    },
    "organizer": {
      "@type": "Organization",
      "name": event.name,
      "url": event.website,
      "email": event.email
    }
  };
}

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

const infoItems = [
  {
    icon: <CalendarDays className="h-8 w-8" />,
    title: "Date",
    description: event.dateFormatted,
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Duration",
    description: `${event.startTime}-${event.endTime} (${event.durationHours}h)`,
  },
  {
    icon: <HandCoins className="h-8 w-8" />,
    title: "Price",
    description: `${event.priceSEK} SEK`,
  },
  {
    icon: <MapPin className="h-8 w-8" />,
    title: "Location",
    description: event.location,
    href: googleMaps.startPin,
  },
  {
    icon: <Route className="h-8 w-8" />,
    title: "Strava route",
    description: `"Långa gula" ${event.lapDistanceKm}km`,
    href: stravaRoutes[currentYear],
  },
  {
    icon: <QuestionMarkIcon className="h-8 w-8" />,
    title: "Questions",
    description: event.email,
    href: `mailto:${event.email}`,
  },
];

const featureItems = [
  {
    icon: <Trees className="h-10 w-10 text-primary" />,
    title: "Beautiful Scenery",
    description: `Run on a stunning ${event.lapDistanceKm}km trail loop through the Altorp forest.`,
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Great Community",
    description: "Enjoy a friendly, supportive atmosphere with fellow runners.",
  },
  {
    icon: <Award className="h-10 w-10 text-primary" />,
    title: "Personal Challenge",
    description: `Run, walk, or rest. See how far you can go in ${event.durationHours} hours.`,
  },
];


export function AltorpUltra() {
  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventStructuredData()) }}
    />
    <Navbar />
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
            {event.name}
          </h1>
          <p className="text-lg md:text-xl text-white/80 text-center font-medium tracking-wide">
            {event.dateFormatted} &middot; {event.location.split(",")[1]?.trim() || event.region}
          </p>
          <a
            href={raceIdUrl}
            className="mt-4 inline-block bg-white text-gray-900 font-semibold text-lg px-8 py-3 rounded-md hover:bg-white/90 transition-colors shadow-lg"
          >
            Register Now
          </a>
          <Countdown />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* About */}
        <section id="about" className="mb-16 text-center scroll-mt-20">
          <SectionTitle title="How many laps can you do?" />
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed">
              Join us for an epic day of pushing your limits on the beautiful <strong>&lsquo;Långa gula&rsquo; {event.lapDistanceKm} km loop</strong> in Altorp. With ~{event.lapElevationM}m of elevation per lap, it&rsquo;s a fun challenge.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed mt-4">
              This isn&rsquo;t just for serious runners. <strong>Everyone is welcome.</strong> Whether you walk one lap or run twelve, the goal is to challenge yourself, enjoy the forest, and be part of an amazing community. Run, walk, rest, and see what you&rsquo;re capable of in {event.durationHours} hours.
            </p>
          </div>
          <div className="text-center mt-8">
            <RegisterButton />
          </div>
        </section>

        {/* Kids Race */}
        <section className="mb-16 bg-primary/10 border border-primary/20 rounded-lg p-8 md:p-12 text-center">
          <span className="inline-block bg-primary text-white text-sm font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            New for {currentYear}
          </span>
          <h2 className="text-3xl font-bold mb-4">Kids Race</h2>
          <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
            This year we&rsquo;re introducing a <strong>kids race</strong>! A fun ~400m run, starting at <strong>09:30</strong> before the main event. It&rsquo;s <strong>free for everyone</strong> &mdash; just show up and run!
          </p>
        </section>

        {/* What to Expect */}
        <section id="expect" className="mb-16 bg-white rounded-lg shadow-sm p-8 md:p-12 scroll-mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">What to Expect</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {featureItems.map((feature) => (
              <div key={feature.title} className="flex flex-col items-center">
                {feature.icon}
                <h3 className="text-2xl font-semibold mt-4 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
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
          <RegisterButton />
        </div>

        {/* FAQ */}
        <div id="faq" className="mt-12 flex justify-center scroll-mt-20">
          <FAQ />
        </div>

        {/* Gallery */}
        <div id="gallery" className="mt-12 flex justify-center scroll-mt-20">
          <PhotoGallery images={routePhotos} />
        </div>

        <div className="mt-12 w-full">
          <GoogleMapsRoute />
        </div>

        <section className="text-center mt-12 mb-8">
          <RegisterButton />
        </section>
      </main>
    </div>
    <Footer />
  </>;
}
