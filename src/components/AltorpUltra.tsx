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
import RegisterButton, { baseRegisterUrl } from "./RegisterButton"
import { routePhotos } from "@/lib/route-photos"
import PhotoGallery from "./PhotoGallery"
import React from "react"
// import Link from "next/link"

function eventStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Altorp Ultra",
    "description": "Join us for an epic day. Altorp 7.0 km loop - 'Långa gula'. May 9, 2026, 10:00-18:00. As many laps as you can.",
    "startDate": "2026-05-09T10:00:00+02:00",
    "endDate": "2026-05-09T18:00:00+02:00",
    "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
    "eventStatus": "https://schema.org/EventScheduled",
    "location": {
      "@type": "Place",
      "name": "Altorp",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Djursholm",
        "addressRegion": "Stockholm",
        "addressCountry": "SE"
      }
    },
    "image": [
      altorpPic.src
    ],
    "offers": {
      "@type": "Offer",
      "url": baseRegisterUrl,
      "price": "250",
      "priceCurrency": "SEK",
      "availability": "https://schema.org/InStock",
      "validFrom": "2024-10-09T00:00:00+02:00"
    },
    "performer": {
      "@type": "Organization",
      "name": "Altorp Ultra"
    },
    "organizer": {
      "@type": "Organization",
      "name": "Altorp Ultra",
      "url": "https://altorpultra.se",
      "email": "altorpultra@gmail.com"
    }
  };
}

// This cleans up the main component logic significantly.
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
    description: "May 9, 2026",
  },
  {
    icon: <Clock className="h-8 w-8" />,
    title: "Duration",
    description: "10:00-18:00 (8h)",
  },
  {
    icon: <HandCoins className="h-8 w-8" />,
    title: "Price",
    description: "250 SEK (early bird)",
  },
  {
    icon: <MapPin className="h-8 w-8" />,
    title: "Location",
    description: "Altorp, Djursholm",
    href: "https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9",
  },
  {
    icon: <Route className="h-8 w-8" />,
    title: "Strava route",
    description: "\"Långa gula\" 7.0km",
    href: "https://www.strava.com/routes/3337146615650736332",
  },
  {
    icon: <QuestionMarkIcon className="h-8 w-8" />,
    title: "Questions",
    description: "altorpultra@gmail.com",
    href: "mailto:altorpultra@gmail.com",
  },
];

const featureItems = [
  {
    icon: <Trees className="h-10 w-10 text-primary" />,
    title: "Beautiful Scenery",
    description: "Run on a stunning 7.0km trail loop through the Altorp forest.",
  },
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "Great Community",
    description: "Enjoy a friendly, supportive atmosphere with fellow runners.",
  },
  {
    icon: <Award className="h-10 w-10 text-primary" />,
    title: "Personal Challenge",
    description: "Run, walk, or rest. See how far you can go in 8 hours.",
  },
];


export function AltorpUltra() {
  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventStructuredData()) }}
    />
    <div className="min-h-screen bg-gray-50"> {/* Changed bg to lighter gray */}
      <header className="relative h-[50vh] min-h-[400px]">
        <Image
          src={altorpPic}
          alt="Runners in Altorp forest"
          priority
          fill
          sizes="100vw"
          style={{
            objectFit: "cover"
          }} />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white text-center [text-shadow:2px_2px_8px_rgba(0,0,0,0.7)]">
              Altorp Ultra
            </h1>
            <h3 className="text-lg md:text-xl font-bold text-white text-center mt-4 [text-shadow:2px_2px_8px_rgba(0,0,0,0.7)]">
              May 9, 2026
            </h3>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <section className="mb-16 text-center">
          <SectionTitle title="How many laps can you do?" />
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-700 leading-relaxed">
              Join us for an epic day of pushing your limits on the beautiful <strong>&lsquo;Långa gula&lsquo; 7.0 km loop</strong> in Altorp. With ~100m of elevation per lap, it&rsquo;s a fun challenge.
            </p>
            <p className="text-xl text-gray-700 leading-relaxed mt-4">
              This isn&rsquo;t just for serious runners. <strong>Everyone is welcome.</strong> Whether you walk one lap or run twelve, the goal is to challenge yourself, enjoy the forest, and be part of an amazing community. Run, walk, rest, and see what you&rsquo;re capable of in 8 hours.
            </p>
          </div>
          <div className="text-center mt-8">
            <RegisterButton />
          </div>
        </section>

        <section className="mb-16 bg-white rounded-lg shadow-sm p-8 md:p-12">
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

        <section className="mb-12">
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

        <div className="mt-12 flex justify-center">
          <FAQ />
        </div>

        <div className="mt-12 flex justify-center">
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
  </>;
}
