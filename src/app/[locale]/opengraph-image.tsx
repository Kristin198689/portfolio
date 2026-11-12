import { ImageResponse } from "next/og";

export const alt = "Christina Volodina, web developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "#fafaf7",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, opacity: 0.6 }}>PORTFOLIO 2026</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 150, fontWeight: 800, lineHeight: 0.9, letterSpacing: -6 }}>
          <span>CHRISTINA</span>
          <span>VOLODINA</span>
        </div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>Web developer · Next.js · SEO · Motion · DE / EN / UK</div>
      </div>
    ),
    size,
  );
}
