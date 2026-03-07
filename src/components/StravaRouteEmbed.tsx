"use client";

import { useEffect, useRef } from "react";

export default function StravaRouteEmbed() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Load the Strava embed script
    const script = document.createElement("script");
    script.src = "https://strava-embeds.com/embed.js";
    script.async = true;
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <div
        className="strava-embed-placeholder"
        data-embed-type="route"
        data-embed-id="3456172908731637010"
        data-units="metric"
        data-full-width="true"
        data-style="standard"
        data-map-hash="12.41/59.41672/18.07003"
        data-club-id="1981140"
        data-from-embed="true"
      />
    </div>
  );
}
