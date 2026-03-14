import type { MetadataRoute } from "next";
import { site } from "@/lib/config";
import { locales, defaultLocale } from "@/i18n/config";
import { getPublishedYears } from "@/lib/race/get-edition";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const years = await getPublishedYears();

  const staticRoutes = ["/", "/info"];
  const entries: MetadataRoute.Sitemap = [];

  // Localised static routes with hreflang alternates
  for (const route of staticRoutes) {
    const languages: Record<string, string> = {};
    for (const locale of locales) {
      const prefix = locale === defaultLocale ? "" : `/${locale}`;
      languages[locale] = `${site.website}${prefix}${route === "/" ? "" : route}`;
    }
    languages["x-default"] = `${site.website}${route === "/" ? "" : route}`;

    entries.push({
      url: `${site.website}${route === "/" ? "" : route}`,
      lastModified: new Date(),
      alternates: { languages },
    });
  }

  // Race year pages (not localised)
  for (const year of years) {
    entries.push({
      url: `${site.website}/race/${year}`,
      lastModified: new Date(),
    });
  }

  return entries;
}
