import { currentYear, event, googleMaps, raceIdUrl, stravaRoutes } from "@/lib/constants";
import { MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-2">{event.name}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              A trail running event in the beautiful Altorp forest, Djursholm.
              Run, walk, or rest &mdash; see how far you can go in {event.durationHours} hours.
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
                <a href={stravaRoutes[currentYear]} className="hover:text-white transition-colors">
                  Route on Strava
                </a>
              </li>
              <li>
                <a href={event.instagram} className="hover:text-white transition-colors">
                  Instagram
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">Contact</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href={`mailto:${event.email}`} className="hover:text-white transition-colors">
                  {event.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <a href={googleMaps.startPin} className="hover:text-white transition-colors">
                  {event.location}, {event.region}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {event.name}
        </div>
      </div>
    </footer>
  );
}
