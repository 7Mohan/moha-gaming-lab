import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Moha Gaming Lab — Android Gaming Performance";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0B0D",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "80px",
          border: "2px solid #1E2329",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              background: "#111318",
              border: "1px solid #00E5A0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00E5A0",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            M
          </div>
          <span style={{ color: "#00E5A0", fontSize: "20px", letterSpacing: "2px", fontWeight: 700 }}>
            MOHA GAMING LAB
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ color: "#F0F2F5", fontSize: "56px", fontWeight: 800, lineHeight: 1.1 }}>
            Gaming Performance.
            <br />
            <span style={{ color: "#00E5A0" }}>Engineered.</span>
          </div>
          <div style={{ color: "#8B95A1", fontSize: "24px", maxWidth: "800px" }}>
            Android gaming optimization, FPS stability, latency diagnostics, and technical tools.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "#4E5967", fontSize: "18px" }}>
          <span>mohagaminglab.com</span>
          <span>•</span>
          <span>FPS &amp; Latency Diagnostics</span>
          <span>•</span>
          <span>Custom Android Tools</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
