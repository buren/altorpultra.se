import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Clock, Route, HandCoins } from "lucide-react"

import altorpPic from '../public/altorp.webp'
import { QuestionMarkIcon } from "@radix-ui/react-icons"
import GoogleMapsRoute from "./GoogleMapsRoute"
import FAQ from "./FAQ"
import SectionTitle from "./SectionTitle"
import RegisterButton from "./RegisterButton"
import ImageCarousel from "./ImageCarousel"
import { routePhotos } from "@/lib/route-photos"

function eventStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "Altorp Ultra",
    "description": "Join us for an epic day. Altorp 6.7 km loop - 'Långa gula'. May 10, 2025, 10:00-18:00. As many laps as you can.",
    "startDate": "2025-05-10T10:00:00+02:00",
    "endDate": "2025-05-10T18:00:00+02:00",
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
      "url": "https://i.washere.io/join/CAJI1EYS?utm_source=altorpultra.se",
      "price": "200",
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

export function AltorpUltra() {
  return <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(eventStructuredData()) }}
    />
    <div className="min-h-screen bg-gray-100">
      <header className="relative h-[50vh] min-h-[400px]">
        <Image
          src={altorpPic}
          alt="Altorp Ultra"
          priority
          fill
          sizes="100vw"
          style={{
            objectFit: "cover"
          }} />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold text-white text-center">
              Altorp Ultra
            </h1>
            <h3 className="text-lg md:text-xl font-bold text-white text-center mt-4">May 10, 2025</h3>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="text-center mx-auto">
            <SectionTitle title="How many laps can you do?" />
            {/* <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join us for an epic day.
            </p> */}
          </div>
          <div className="text-xl text-gray-600">
            <ul className="w-96 mx-auto">
              <li className="leading-8">Join us for an epic day.</li>
              <li className="leading-8">Altorp 6.7 km loop - &lsquo;Långa gula&lsquo;.</li>
              <li className="leading-8">~120m of elevation per loop.</li>
              <li className="leading-8">May 10 2025, between 10:00 and 18:00.</li>
              <li className="leading-8">As many laps as you can in 8 hours.</li>
              <li className="leading-8">Go further than you think.</li>
              <li className="leading-8">Challenge yourself, friends and family.</li>
            </ul>

            <section className="text-center mt-4">
              <RegisterButton />
            </section>
          </div>
        </section>

        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <CalendarDays className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold text-lg">Date</h3>
                  <p>May 10, 2025</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold text-lg">Duration</h3>
                  <p>10:00-18:00 (8h)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <HandCoins className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold text-lg">Price</h3>
                  <p>200 SEK (early bird)</p>
                </div>
              </CardContent>
            </Card>
            <a href="https://maps.app.goo.gl/cYXEF76q3T1Xoj4T9">
              <Card>
                <CardContent className="flex items-center p-6">
                  <MapPin className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg">Location</h3>
                    <p>Altorp, Djursholm</p>
                  </div>
                </CardContent>
              </Card>
            </a>
            <a href="https://strava.app.link/3ngwyVPOmNb">
              <Card>
                <CardContent className="flex items-center p-6">
                  <Route className="h-8 w-8 text-primary mr-4" />
                  <div>
                    <h3 className="font-semibold text-lg">Strava route</h3>
                    <p>&quot;Långa gula&quot; 6.7km</p>
                  </div>
                </CardContent>
              </Card>
            </a>
            <Card>
              <CardContent className="flex items-center p-6">
                <QuestionMarkIcon className="h-8 w-8 text-primary mr-4" />
                <div>
                  <h3 className="font-semibold text-lg">Questions</h3>
                  <p>altorpultra@gmail.com</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="text-center mt-4">
          <RegisterButton />
        </div>

        <div className="mt-4 flex justify-center">
          <FAQ />
        </div>

        <div className="mt-4 w-full">
          <GoogleMapsRoute />
        </div>

        <div className="mt-4 flex justify-center">
          <ImageCarousel images={routePhotos} />
        </div>

        <section className="text-center mt-4">
          <RegisterButton />
        </section>
      </main>
    </div>
  </>;
}
