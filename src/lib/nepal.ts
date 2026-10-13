import type { Zone } from "@/db/schema";

// Nepal's 7 provinces and 77 districts (2015 constitution). Nawalparasi and Rukum are
// split in two, each half in a different province.
export const PROVINCES = [
  {
    name: "Koshi",
    districts: ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"],
  },
  { name: "Madhesh", districts: ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"] },
  {
    name: "Bagmati",
    districts: ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"],
  },
  { name: "Gandaki", districts: ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalparasi East", "Parbat", "Syangja", "Tanahun"] },
  { name: "Lumbini", districts: ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Nawalparasi West", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"] },
  { name: "Karnali", districts: ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Rukum West", "Salyan", "Surkhet"] },
  { name: "Sudurpashchim", districts: ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"] },
] as const;

export type Province = (typeof PROVINCES)[number]["name"];

const PROVINCE_OF = new Map<string, Province>(PROVINCES.flatMap((p) => p.districts.map((d) => [d.toLowerCase(), p.name] as const)));
const DISTRICT = new Map<string, string>(PROVINCES.flatMap((p) => p.districts.map((d) => [d.toLowerCase(), d] as const)));

const VALLEY = ["Kathmandu", "Lalitpur", "Bhaktapur"];

// Other spellings maps and people use for the same district.
const ALIASES: Record<string, string> = {
  nawalpur: "Nawalparasi East",
  "nawalparasi (bardaghat susta east)": "Nawalparasi East",
  parasi: "Nawalparasi West",
  "nawalparasi (bardaghat susta west)": "Nawalparasi West",
  kavre: "Kavrepalanchok",
  kavrepalanchowk: "Kavrepalanchok",
  sindhupalchowk: "Sindhupalchok",
  chitawan: "Chitwan",
  makawanpur: "Makwanpur",
  dhanusa: "Dhanusha",
  tanahu: "Tanahun",
  tehrathum: "Terhathum",
  kapilbastu: "Kapilvastu",
  "eastern rukum": "Rukum East",
  "western rukum": "Rukum West",
};

/** The first of these place names that is one of the 77 districts ("Kaski District" counts). */
export function districtIn(names: (string | null | undefined)[]): string | null {
  for (const raw of names) {
    const n = raw?.replace(/\s+district$/i, "").trim().toLowerCase();
    const d = n && (DISTRICT.get(n) ?? ALIASES[n]);
    if (d) return d;
  }
  return null;
}

/** The district's province, or null if it isn't one of the 77. */
export function provinceOf(district: string): Province | null {
  return PROVINCE_OF.get(district.trim().toLowerCase()) ?? null;
}

const words = (s: string) => s.toLowerCase().split(/[^a-z]+/).filter(Boolean);

/**
 * The delivery area that covers a district. Areas are matched by name, most specific
 * first: one listing the district itself ("Jhapa", or "Jhapa, Morang"), then
 * "Kathmandu Valley" for Kathmandu, Lalitpur and Bhaktapur, then one naming the
 * province ("Koshi", "Rest of Koshi Province"). The last area covers everywhere else.
 */
export function zoneFor(district: string, zones: Zone[]): Zone | null {
  const name = DISTRICT.get(district.trim().toLowerCase());
  if (!name || !zones.length) return null;
  const province = PROVINCE_OF.get(name.toLowerCase())!.toLowerCase();
  const parts = (z: Zone) => z.name.split(/,|&|\band\b/i).map((p) => p.trim().toLowerCase());
  return (
    zones.find((z) => parts(z).includes(name.toLowerCase())) ??
    (VALLEY.includes(name) ? zones.find((z) => /kathmandu valley/i.test(z.name)) : undefined) ??
    zones.find((z) => words(z.name).includes(province)) ??
    zones.at(-1)!
  );
}
