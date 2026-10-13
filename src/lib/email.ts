// One email check for the checkout form and the server, so the form never accepts an
// address the server then refuses (or the other way round).

const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i;

export function isEmail(s: string): boolean {
  const e = s.trim();
  return e.length <= 254 && EMAIL.test(e) && !e.includes("..") && !e.startsWith(".") && !e.split("@")[0].endsWith(".");
}

// The inboxes almost everyone here uses, to catch "gmial.com" and friends.
const COMMON = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "live.com"];

function distance(a: string, b: string) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/** "ram@gmial.com" → "ram@gmail.com". Null when the domain looks deliberate. */
export function emailSuggestion(s: string): string | null {
  const [user, domain] = s.trim().toLowerCase().split("@");
  if (!user || !domain || COMMON.includes(domain)) return null;
  // "gmail" with no ending, or a near miss of a common inbox.
  const bare = COMMON.find((c) => c.split(".")[0] === domain);
  const near = COMMON.find((c) => distance(domain, c) <= 2 && domain.length >= 6);
  const fix = bare ?? near;
  return fix ? `${user}@${fix}` : null;
}
