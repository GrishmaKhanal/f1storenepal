const HANDLE = /^[A-Za-z0-9._]+$/;
const RESERVED_PATHS = new Set(["accounts", "direct", "explore", "p", "reel", "reels", "stories"]);
const DEFAULT_HANDLE = "lightsoutnepal";

export function instagramDmLink(handle: string | null, profileUrl: string | null): string {
  const supplied = handle?.trim().replace(/^@+/, "");
  if (supplied && HANDLE.test(supplied)) return `https://ig.me/m/${supplied}`;

  if (profileUrl) {
    try {
      const url = new URL(profileUrl);
      const isInstagram = ["instagram.com", "www.instagram.com", "m.instagram.com"].includes(url.hostname.toLowerCase());
      const username = url.pathname.split("/").filter(Boolean)[0];
      if (isInstagram && username && !RESERVED_PATHS.has(username.toLowerCase()) && HANDLE.test(username)) {
        return `https://ig.me/m/${username}`;
      }
    } catch {
      // Fall back to the store account when the saved profile URL is malformed.
    }
  }

  return `https://ig.me/m/${DEFAULT_HANDLE}`;
}
