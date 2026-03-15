"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
  const t = useTranslations('footer');

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className={`grid grid-cols-1 gap-8 ${publishedYears.length > 0 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image
                src="/logo.png"
                alt="Altorp Ultra logo"
                width={36}
                height={36}
                className="rounded-full invert"
              />
              <h3 className="text-xl font-bold">{site.name}</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('description', { durationHours })}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">{t('links')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href={raceIdUrl} className="hover:text-white transition-colors">
                  {t('registerOnRaceID')}
                </a>
              </li>
              <li>
                <a href={stravaRoute} className="hover:text-white transition-colors">
                  {t('routeOnStrava')}
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
              <h4 className="font-semibold mb-3 text-gray-300">{t('editions')}</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/race/archive" className="hover:text-white transition-colors">
                    {t('allResults')}
                  </Link>
                </li>
                {publishedYears.map((year) => (
                  <li key={year}>
                    <Link href={`/race/${year}`} className="hover:text-white transition-colors">
                      {site.name} {year}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-3 text-gray-300">{t('contact')}</h4>
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
