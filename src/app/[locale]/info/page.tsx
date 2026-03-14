import type { Metadata } from "next"
import SectionTitle from "@/components/SectionTitle"
import { site } from "@/lib/config"
import { getCurrentEdition } from "@/lib/race/get-edition"
import { getTranslations, setRequestLocale } from "next-intl/server"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const title = locale === "sv"
    ? `Praktisk info – ${site.name}`
    : `Practical info – ${site.name}`;
  const description = locale === "sv"
    ? `Allt du behöver veta inför ${site.name}: start- och sluttid, vägbeskrivning, betalning, utrustning och baninfo.`
    : `Everything you need to know for ${site.name}: start time, directions, payment, equipment and course info.`;

  return { title, description };
}

export default async function Info({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('info');
  const edition = await getCurrentEdition();

  if (!edition) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">No edition found</div>;
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <main className="container mx-auto px-4 py-8">
          <section className="mb-12">
            <div className="mx-auto max-w-lg">
              <SectionTitle title={t('title')} />
              <p>{t.rich('notRegistered', {
                link: (chunks) => <a href={edition.raceIdUrl} className="underline text-blue-600">{chunks}</a>,
              })}</p>
              <br />
              <p>{t('intro')}</p>
              <p>{t('hangArea')}</p>
              <br />
              <p><strong>{t('startTimeLabel')}</strong> {t('startTimeText', { startTime: edition.startTime, endTime: edition.endTime, year: edition.year })}</p>
              <br />
              <p><strong>{t('howToFindLabel')}</strong></p>
              <p>{t.rich('howToFindText1', {
                link: (chunks) => <a className="underline text-blue-600" href={edition.googleMaps.startPin}>{chunks}</a>,
              })}</p>
              <p>{t('howToFindText2')}</p>
              <p>{t.rich('howToFindText3', {
                link: (chunks) => <a className="underline text-blue-600" href={edition.googleMaps.parkingPin}>{chunks}</a>,
              })}</p>
              <br />
              <p><strong>{t('paymentLabel')}</strong> {t.rich('paymentText', {
                priceSEK: edition.priceSEK,
                link: (chunks) => <a className="underline text-blue-600" href={edition.raceIdUrl}>{chunks}</a>,
              })}</p>
              <br />
              <p><strong>{t('formatLabel')}:</strong> {t('formatText')}</p>
              <br />
              <p><strong>{t('howToWinLabel')}:</strong> {t('howToWinText', { endTime: edition.endTime })}</p>
              <br />
              <p><strong>{t('fluidsLabel')}:</strong> {t('fluidsText', { durationHours: edition.durationHours })}</p>
              <br />
              <p>{t('grillingText')}</p>
              <br />
              <p><strong>{t('courseInfoLabel')}</strong>: {t.rich('courseInfoText', {
                lapDistanceKm: edition.lapDistanceKm,
                lapElevationM: edition.lapElevationM,
                stravaLink: (chunks) => <a className="underline text-blue-600" href={edition.stravaRoute}>{chunks}</a>,
                mapsLink: (chunks) => <a className="underline text-blue-600" href={edition.googleMaps.routeViewer}>{chunks}</a>,
              })}</p>
              <br />
              <p><strong>{t('bibLabel')}:</strong> {t('bibText')}</p>
              <br />
              <p><strong>{t('equipmentLabel')}:</strong> {t('equipmentText')}</p>
              <br />
              <p><strong>{t('valuablesLabel')}:</strong> {t('valuablesText')}</p>
              <br />
              <p><strong>{t('bagsLabel')}:</strong> {t('bagsText')}</p>
              <br />
              <p><strong>{t('paymentLabel2')}:</strong> {t.rich('paymentText2', {
                priceSEK: edition.priceSEK,
                link: (chunks) => <a className="underline text-blue-600" href={edition.raceIdUrl}>{chunks}</a>,
              })}</p>
              <br />
              <p>{t.rich('questionsText', {
                email: site.email,
                link: (chunks) => <a className="underline" href={`mailto:${site.email}`}>{chunks}</a>,
              })}</p>

            </div>
          </section>
        </main>
      </div>
    </>
  )
}
