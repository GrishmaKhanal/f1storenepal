import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, DM_Sans, JetBrains_Mono } from "next/font/google";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

// Self-hosted by next/font: no request to Google at runtime and no layout shift.
const barlow = Barlow_Condensed({ variable: "--font-barlow", subsets: ["latin"], weight: ["600", "700", "800"], style: ["normal", "italic"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], axes: ["opsz"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"] });

export const viewport: Viewport = { themeColor: "#0c0c0c" };

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const title = s.seoTitle || s.storeName;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s | ${s.storeName}` },
    description: s.seoDescription ?? undefined,
    applicationName: s.storeName,
    // Canonical is set per page, never globally, or every page claims to be "/".
    openGraph: { type: "website", siteName: s.storeName, title, description: s.seoDescription ?? undefined, locale: "en_NP" },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true, googleBot: { "max-image-preview": "large" } },
    formatDetection: { telephone: false },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NP" className={`${barlow.variable} ${dmSans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
