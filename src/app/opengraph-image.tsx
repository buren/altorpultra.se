import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Altorp Ultra – Trail running in Altorp, Djursholm";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          Altorp Ultra
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            marginBottom: 32,
          }}
        >
          Trail running in Altorp, Djursholm
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#64748b",
            display: "flex",
            gap: 24,
          }}
        >
          <span>8 hours</span>
          <span>·</span>
          <span>7 km loop</span>
          <span>·</span>
          <span>As many laps as you can</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
