import SectionTitle from "@/components/SectionTitle"
import { site } from "@/lib/config"
import { getCurrentEdition } from "@/lib/race/get-edition"

export default async function Info() {
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
              <SectionTitle title="Information om loppet" />
              <p>Inte registrerad än? <a href={edition.raceIdUrl} className="underline text-blue-600">Registrera dig här</a>.</p>
              <br />
              <p>Det finns absolut inget krav på hur många varv man springer, om det är att promenera ett varv med barnvagn, springa ett eller tio varv är helt upp till er! Alla är välkomna och det kommer vara en salig blandning. Det går alldeles utmärkt att ta sig an ett varv och sedan vila i 1, 2, 3 eller 4 timmar och sedan ta sig an ett till, alla gör som man vill.</p>
              <p>Vi kommer se till att det blir bra häng i start/mål området med nice musik, snacks och grill!</p>
              <br />
              <p><strong>Starttid</strong> Loppet startar {edition.startTime} och pågår till {edition.endTime}, lördag 9 maj {edition.year}.</p>
              <br />
              <p><strong>Hur hittar jag till starten?</strong></p>
              <p>Här är en <a className="underline text-blue-600" href={edition.googleMaps.startPin}>Google Maps pin</a> till där starten går. </p>
              <p>Åker ni kommunalt så kan ni ta er hit med Roslagsbanan mot Näsbypark från Tekniska Högskolan på under 15 minuter. Det är knappt 200 meter till starten från stationen.</p>
              <p>Tar ni bilen finns det parkering precis vid stationen (<a className="underline text-blue-600" href={edition.googleMaps.parkingPin}>Google Maps pin</a>).</p>
              <br />
              <p><strong>Betalning:</strong> Anmälningsavgiften är {edition.priceSEK} SEK. Registrera dig och betala direkt via <a className="underline text-blue-600" href={edition.raceIdUrl}>RaceID</a>.</p>
              <br />
              <p><strong>Format:</strong> Så många varv som möjligt. Det finns ingen maxtid på varje varv ta den tid ni behöver (det är INTE ett backyard format). </p>
              <br />
              <p><strong>Hur vinner man?:</strong> Den som har sprungit färdigt flest varv kl {edition.endTime} vinner. Är det flera som sprungit lika många vinner den som tidigast kom in på det sista varvet.</p>
              <br />
              <p><strong>Vätska och energi:</strong> För alla som är med kommer det finnas tillgång till vatten och enkla snacks (kexchoklad, kanelbullar och liknande). För er som verkligen vill pusha er själva alla {edition.durationHours} timmarna rekommenderar jag att ni tar med er egen sportdryck och gels. Om ni har vänner och familj med er som tittar på så kommer de få köpa snacka till ett rimligt pris, vatten bjuder vi på såklart.</p>
              <br />
              <p>Utöver snacks så planerar vi grilla burgare, korv och dylikt som man kan köpa.</p>
              <br />
              <p><strong>Information om banan</strong>: Varje varv är {edition.lapDistanceKm} km och drygt {edition.lapElevationM} höjdmeter. <a className="underline text-blue-600" href={edition.stravaRoute}>Här finns rutten på Strava</a> och <a className="underline text-blue-600" href={edition.googleMaps.routeViewer}>här på Google Maps</a>.</p>
              <br />
              <p><strong>Bib/nummerlapp:</strong> Nummerlappar delas ut från kl 09:00 på tävlingsdagen.</p>
              <br />
              <p><strong>Vad behöver jag för utrustning?:</strong> Precis det du vill! Det finns inga specifika krav på utrustning.</p>
              <br />
              <p><strong>Värdesaker:</strong> Ta gärna med så lite värdesaker som möjligt och i första hand lägg det i bilen, ge det till en kompis eller familjemedlem som är på plats. Skulle det inte vara möjligt så kan ni lämna t.ex telefon och plånbok så har vi koll på det under dagen, har ni andra behov hör av er. </p>
              <br />
              <p><strong>Väskor:</strong> Väskor med tröjor, extra skor, energi etc kommer ni kunna lämna på området och vi kommer generellt ha lite koll, dock kan vi ej ansvara för värdesaker i väskorna.</p>
              <br />
              <p><strong>Betalning:</strong> Anmälningsavgiften är {edition.priceSEK} SEK. Registrera dig och betala direkt via <a className="underline text-blue-600" href={edition.raceIdUrl}>RaceID</a>.</p>
              <br />
              <p>Har ni frågor är det bara att höra av er till <a className="underline" href={`mailto:${site.email}`}>{site.email}</a>.</p>

            </div>
          </section>
        </main>
      </div>
    </>
  )
}
