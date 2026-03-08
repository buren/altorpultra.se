import { site } from "@/lib/config";
import { MapPin } from "lucide-react";

interface FooterProps {
  durationHours: number;
  stravaRoute: string;
  raceIdUrl: string;
  googleMapsStartPin: string;
  publishedYears: number[];
}

export default function Footer({ durationHours, stravaRoute, raceIdUrl, googleMapsStartPin, publishedYears }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 gap-8 ${publishedYears.length > 0 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-2">{site.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              A trail running event in the beautiful Altorp forest, Djursholm.
              Run, walk, or rest &mdash; see how far you can go in {durationHours} hours.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href={raceIdUrl} className="hover:text-white transition-colors">
                  Register on RaceID
                </a>
              </li>
              <li>
                <a href={stravaRoute} className="hover:text-white transition-colors">
                  Route on Strava
                </a>
              </li>
              <li>
                <a href={site.instagram} className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Editions */}
          {publishedYears.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 text-gray-300">Editions</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                {publishedYears.map((year) => (
                  <li key={year}>
                    <a href={`/race/${year}`} className="hover:text-white transition-colors">
                      {site.name} {year}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Contact</h4>
            <p className="text-sm text-gray-400 mb-2">Jacob Burenstam Linder</p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href={`mailto:${site.email}`} className="hover:text-white transition-colors">
                  {site.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <a href={googleMapsStartPin} className="hover:text-white transition-colors">
                  {site.location}, {site.region}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {site.name}
        </div>
      </div>
    </footer>
  );
}
