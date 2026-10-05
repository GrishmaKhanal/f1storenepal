import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const s = await getSettings();
  return {
    name: s.storeName,
    short_name: s.storeName,
    description: s.seoDescription ?? undefined,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f4",
    theme_color: "#0c0c0c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
