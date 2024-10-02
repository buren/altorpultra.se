import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDays, MapPin, Clock, Route } from "lucide-react"

import altorpPic from '../public/altorp.webp'


export function UltramarathonStartPageComponent() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="relative h-[50vh] min-h-[400px]">
        <Image
          src={altorpPic}
          alt="Altorp Ultra"
          layout="fill"
          objectFit="cover"
          priority
        />
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
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-semibold mb-4">How many laps can you do?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join us for an epic day. Challenge yourself, go further than you think you could.
          </p>
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
                  <p>10:00-18:00 (6h)</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center p-6">
                <MapPin className="h-8 w-8 text-primary mr-4" />
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
          </div>
        </section>

        <section className="text-center">
          <a href="https://i.washere.io/join/CAJI1EYS?utm_source=altorpultra.se">
            <Button size="lg" className="text-lg px-8 py-6">
              Register Now
            </Button>

            <p className="text-xl text-gray-600 max-w-2xl mx-auto pt-4">
              Download your wallet pass to join!
            </p>
          </a>
        </section>
      </main>
    </div>
  )
}