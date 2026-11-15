import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Christina Volodina, web developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Share image: the eyes mark from the icon set and the name. Latin text only, because the default OG font has no Arabic.
export default function OpengraphImage() {
  const mark = readFileSync(join(process.cwd(), "public/icons/mark.png")).toString("base64");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(150deg, #0a0a0a 0%, #14122b 55%, #1f1a4a 100%)",
          color: "#fafaf7",
          padding: 72,
          position: "relative",
        }}
      >
        {/* big eyes mark on the right */}
        <img
          src={`data:image/png;base64,${mark}`}
          width={300}
          height={300}
          alt=""
          style={{ position: "absolute", right: 64, top: 165 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ fontSize: 26, letterSpacing: 5, color: "#bdb8fc" }}>PORTFOLIO 2026</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 140, fontWeight: 800, lineHeight: 0.9, letterSpacing: -6 }}>
          <span>CHRISTINA</span>
          <span>VOLODINA</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#d6d3f5" }}>Web developer · Next.js · SEO · DE / EN / UK / AR</div>
      </div>
    ),
    size,
  );
}
