// Shared by the header (a client component), footer and social card.
/** "Lights Out Nepal" -> ["LIGHTS OUT", "NEPAL"]: the last word is drawn in red. */
export function wordmark(name: string): [string, string] {
  const words = name.toUpperCase().split(" ");
  const last = words.length > 1 ? words.pop()! : "";
  return [words.join(" "), last];
}
