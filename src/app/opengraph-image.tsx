import { ImageResponse } from "next/og";
import { getSettings } from "@/lib/data";

export const alt = "F1 Store Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default social card for pages without their own image (products use their photo).
export default async function OG() {
  const s = await getSettings();
  const [first, ...rest] = s.storeName.toUpperCase().split(" ");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: "#0c0c0c", color: "#f7f6f4", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 4, color: "#e10600" }}>{(s.location ?? "NEPAL").toUpperCase()}</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 128, fontWeight: 800, fontStyle: "italic", lineHeight: 0.9 }}>
          <span>{first}</span>
          <span style={{ color: "#e10600" }}>{rest.join(" ")}</span>
        </div>
        <div style={{ display: "flex", fontSize: 30, color: "#b9b5ae" }}>{s.tagline ?? "Diecast cars, caps and gifts"}</div>
      </div>
    ),
    size,
  );
}
