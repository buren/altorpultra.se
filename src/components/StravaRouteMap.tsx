import Script from "next/script";

export default function StravaRouteMap() {
  return (
    <>
      <div
        className="strava-embed-placeholder"
        data-embed-type="route"
        data-embed-id="altorp_3771133989584529065"
        data-units="metric"
        data-full-width="true"
        data-style="standard"
        data-from-embed="false"
      ></div>
      <Script src="https://strava-embeds.com/embed.js"></Script>
    </>
  );
}