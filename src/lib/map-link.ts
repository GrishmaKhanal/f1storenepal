// Google's own domains only: www.google.com, maps.google.com.np, google.co.in…
const GOOGLE = /^(www\.|maps\.)?google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/;

/** A Google Maps pin for the given coordinates, or null when they're out of range. */
export function coordsLink(lat: number, lng: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

/**
 * The customer's delivery pin as a Google Maps link, from "lat, lng" or a pasted Google
 * Maps link (share text around the link is fine). Anything else returns null, so only a
 * Google Maps https link ever reaches an href in the admin.
 */
export function mapLink(raw: string): string | null {
  const s = raw.trim();
  const c = s.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (c) return coordsLink(Number(c[1]), Number(c[2]));

  const found = s.match(/https?:\/\/\S+/)?.[0];
  if (!found) return null;
  let url: URL;
  try {
    url = new URL(found);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const maps =
    host === "maps.app.goo.gl" ||
    (host === "goo.gl" && url.pathname.startsWith("/maps")) ||
    (GOOGLE.test(host) && (host.startsWith("maps.") || url.pathname.startsWith("/maps")));
  if (!maps) return null;
  url.protocol = "https:";
  return url.href;
}
