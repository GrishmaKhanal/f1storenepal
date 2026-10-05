import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";

// The admin path is intentionally NOT listed (that would advertise it); it sends
// `X-Robots-Tag: noindex` instead. Checkout pages carry a noindex meta tag.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/order/", "/search"] },
    sitemap: abs("/sitemap.xml"),
  };
}
