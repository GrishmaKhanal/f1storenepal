// Public origin of the site. Sitemap, canonical tags, JSON-LD and Open Graph need
// absolute URLs, and the server can't know its public domain on its own.
// Server-only (no NEXT_PUBLIC_ prefix).
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export const abs = (path: string) => (/^https?:/.test(path) ? path : `${SITE_URL}${path}`);

export const paths = {
  product: (slug: string) => `/products/${slug}`,
  team: (slug: string) => `/teams/${slug}`,
  driver: (slug: string) => `/drivers/${slug}`,
  category: (slug: string) => `/accessories/${slug}`,
};
