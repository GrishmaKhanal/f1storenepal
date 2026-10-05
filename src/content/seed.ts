// Starter content, taken from the Claude Design homepage. It's imported once into the
// database (`npm run db:seed` or "Import starter content" in the admin) and edited there.
// Without a DATABASE_URL the public site renders these defaults read-only.
import type { SiteSettings } from "@/db/schema";
import { bburagoImages } from "./bburago";

export const defaultSettings: SiteSettings = {
  storeName: "F1 Store Nepal",
  tagline: "Cars · Gifts",
  location: "Jhapa, Nepal",
  streetAddress: null,
  phone: null,
  email: null,
  instagramUrl: "https://www.instagram.com/f1storenepal/",
  instagramHandle: "@f1storenepal",
  whatsapp: null,
  announcements: ["Delivered across Nepal from Jhapa", "Cash on delivery · eSewa · Khalti"],
  heroStyle: "dark",
  heroEyebrow: "New arrival · 1:43 scale",
  heroTitle: "Hamilton's\nSF-25, in\n*Nepal.*",
  heroBody: "Bburago Formula Racing diecast with clear display case. Limited stock, delivered across Nepal.",
  heroImageId: null,
  heroProductId: null,
  heroSecondaryLabel: "All Ferrari",
  heroSecondaryHref: "/teams/ferrari",
  heroWatermark: "44",
  steps: [
    { title: "Order online or on Instagram", body: "Check out here or DM @f1storenepal." },
    { title: "Pay your way", body: "eSewa, Khalti, bank transfer or cash on delivery." },
    { title: "Delivered across Nepal", body: "Shipped from Jhapa. Delivery times depend on your area." },
  ],
  deliveryZones: [
    { name: "Jhapa", fee: 100 },
    { name: "Rest of Koshi Province", fee: 150 },
    { name: "Kathmandu Valley", fee: 200 },
    { name: "Elsewhere in Nepal", fee: 250 },
  ],
  freeDeliveryOver: null,
  paymentMethods: [
    { key: "cod", label: "Cash on delivery", instructions: "Pay the rider when your order arrives." },
    { key: "esewa", label: "eSewa", instructions: "We'll message you with payment details to confirm your order." },
    { key: "khalti", label: "Khalti", instructions: "We'll message you with payment details to confirm your order." },
    { key: "bank", label: "Bank transfer", instructions: "We'll message you with bank details to confirm your order." },
  ],
  lowStockThreshold: 2,
  deliveryInfo:
    "We ship from Jhapa to anywhere in Nepal.\n\nDelivery fees depend on your area and are shown at checkout. We'll call or message you to confirm every order before it ships.",
  returnsInfo:
    "If something arrives damaged or isn't what you ordered, message us within 3 days of delivery with photos and we'll sort it out.",
  contactInfo: "The quickest way to reach us is a DM on Instagram.",
  footerDisclaimer: "Independent retailer. Not affiliated with Formula 1 or its teams.",
  seoTitle: "F1 Store Nepal: F1 diecast cars, caps and gifts",
  seoDescription:
    "Formula 1 diecast model cars, team caps, keychains and gifts, delivered across Nepal from Jhapa. Shop by driver or team. Cash on delivery, eSewa and Khalti.",
};

// [name, colour]
export const seedTeams: [string, string][] = [
  ["Ferrari", "#e10600"],
  ["McLaren", "#ff8000"],
  ["Red Bull Racing", "#1e2a78"],
  ["Mercedes", "#00a19c"],
  ["Aston Martin", "#006f62"],
  ["Williams", "#1868db"],
  ["Alpine", "#0093cc"],
  ["Haas", "#9c9fa2"],
  ["Racing Bulls", "#4c6bd8"],
  ["Audi", "#b0b3b5"],
  ["Cadillac", "#2b2b2b"],
];

// [number, name, team, featured]
export const seedDrivers: [number, string, string, boolean][] = [
  [44, "Lewis Hamilton", "Ferrari", true],
  [16, "Charles Leclerc", "Ferrari", true],
  [4, "Lando Norris", "McLaren", true],
  [81, "Oscar Piastri", "McLaren", true],
  [1, "Max Verstappen", "Red Bull Racing", true],
  [6, "Isack Hadjar", "Red Bull Racing", false],
  [63, "George Russell", "Mercedes", true],
  [12, "Kimi Antonelli", "Mercedes", false],
  [14, "Fernando Alonso", "Aston Martin", false],
  [18, "Lance Stroll", "Aston Martin", false],
  [55, "Carlos Sainz", "Williams", false],
  [23, "Alex Albon", "Williams", true],
  [10, "Pierre Gasly", "Alpine", false],
  [43, "Franco Colapinto", "Alpine", false],
  [31, "Esteban Ocon", "Haas", false],
  [87, "Oliver Bearman", "Haas", false],
  [30, "Liam Lawson", "Racing Bulls", false],
  [41, "Arvid Lindblad", "Racing Bulls", false],
  [27, "Nico Hülkenberg", "Audi", false],
  [5, "Gabriel Bortoleto", "Audi", false],
  [11, "Sergio Pérez", "Cadillac", false],
  [77, "Valtteri Bottas", "Cadillac", false],
];

// [name, isAccessory, showAsTab]
export const seedCategories: [string, boolean, boolean][] = [
  ["Diecast", false, true],
  ["Caps", true, true],
  ["Keychains", true, false],
  ["Display cases", true, false],
  ["Posters & prints", true, false],
  ["Mugs & bottles", true, false],
  ["Gift sets", true, true],
];

export type SeedProduct = {
  name: string;
  team: string | null;
  driver: string | null;
  category: string;
  brand: string | null;
  scale: string | null;
  price: number;
  badge: string | null;
  description: string;
  // Files in public/assets, or https URLs (downloaded at import). First is the main photo.
  images: string[];
  variants: { label: string | null; stock: number | null }[];
  hero?: boolean;
};

// Prices and stock are placeholders: set real ones in the admin.
const car = (o: Omit<SeedProduct, "category" | "brand" | "scale"> & { scale?: string }): SeedProduct => ({ category: "Diecast", brand: "Bburago", scale: "1:43", ...o });

export const seedProducts: SeedProduct[] = [
  car({
    name: "Ferrari SF-25 Lewis Hamilton with display case",
    team: "Ferrari",
    driver: "Lewis Hamilton",
    price: 5499,
    badge: "New",
    description: "Bburago Formula Racing 1:43 diecast of Lewis Hamilton's #44 Ferrari SF-25 from the 2025 season, with a clear display case.",
    images: ["sf25-case.png"],
    variants: [{ label: null, stock: 4 }],
    hero: true,
  }),
  car({
    name: "Bburago Formula Racing SF-25 Lewis Hamilton",
    team: "Ferrari",
    driver: "Lewis Hamilton",
    price: 4299,
    badge: "Bestseller",
    description: "Bburago Formula Racing 1:43 diecast of the 2025 Ferrari SF-25, #44 Lewis Hamilton, in its retail box.",
    images: ["sf25-box.png", ...bburagoImages["Lewis Hamilton"]],
    variants: [{ label: null, stock: 6 }],
  }),
  car({
    name: "Ferrari SF-25 Charles Leclerc",
    team: "Ferrari",
    driver: "Charles Leclerc",
    price: 4299,
    badge: null,
    description: "Bburago Formula Racing 1:43 diecast of Charles Leclerc's #16 Ferrari SF-25 from the 2025 season, in its retail box.",
    images: bburagoImages["Charles Leclerc"],
    variants: [{ label: null, stock: 5 }],
  }),
  car({
    name: "McLaren MCL39 Lando Norris with display case",
    team: "McLaren",
    driver: "Lando Norris",
    price: 5499,
    badge: null,
    description: "Bburago 1:43 diecast of Lando Norris's #4 McLaren MCL39 from the 2025 season, on a base with a clear display case.",
    images: bburagoImages["Lando Norris"],
    variants: [{ label: null, stock: 3 }],
  }),
  car({
    name: "McLaren MCL39 Oscar Piastri with display case",
    team: "McLaren",
    driver: "Oscar Piastri",
    price: 5499,
    badge: "New",
    description: "Bburago 1:43 diecast of Oscar Piastri's #81 McLaren MCL39 from the 2025 season, on a base with a clear display case.",
    images: bburagoImages["Oscar Piastri"],
    variants: [{ label: null, stock: 3 }],
  }),
  car({
    name: "Red Bull RB21 Max Verstappen with display case",
    team: "Red Bull Racing",
    driver: "Max Verstappen",
    price: 5499,
    badge: null,
    description: "Bburago 1:43 diecast of Max Verstappen's #1 Red Bull RB21 from the 2025 season, on a base with a clear display case.",
    images: bburagoImages["Max Verstappen"],
    variants: [{ label: null, stock: 2 }],
  }),
  car({
    name: "Mercedes W16 George Russell",
    team: "Mercedes",
    driver: "George Russell",
    price: 4299,
    badge: "Pre-order",
    description: "Bburago Formula Racing 1:43 diecast of George Russell's #63 Mercedes W16 from the 2025 season. Pre-order: we'll confirm the arrival date when you order.",
    images: bburagoImages["George Russell"],
    variants: [{ label: null, stock: null }],
  }),
  car({
    name: "Mercedes W16 Kimi Antonelli with display case",
    team: "Mercedes",
    driver: "Kimi Antonelli",
    price: 5499,
    badge: null,
    description: "Bburago 1:43 diecast of Kimi Antonelli's #12 Mercedes W16 from the 2025 season, on a base with a clear display case.",
    images: bburagoImages["Kimi Antonelli"],
    variants: [{ label: null, stock: 3 }],
  }),
  car({
    name: "Aston Martin AMR25 Fernando Alonso with helmet and display case",
    team: "Aston Martin",
    driver: "Fernando Alonso",
    price: 5999,
    badge: null,
    description: "Bburago 1:43 diecast of Fernando Alonso's #14 Aston Martin AMR25 from the 2025 season, with a mini helmet and a clear display case.",
    images: bburagoImages["Fernando Alonso"],
    variants: [{ label: null, stock: 2 }],
  }),
  {
    name: "Charles Leclerc driver cap",
    team: "Ferrari",
    driver: "Charles Leclerc",
    category: "Caps",
    brand: null,
    scale: null,
    price: 2499,
    badge: null,
    description: "Ferrari driver cap with Charles Leclerc's #16. Adjustable strap.",
    images: [],
    variants: [
      { label: "Adult", stock: 5 },
      { label: "Kids", stock: 2 },
    ],
  },
  {
    name: "Acrylic display case",
    team: null,
    driver: null,
    category: "Display cases",
    brand: null,
    scale: "1:43",
    price: 1199,
    badge: null,
    description: "Clear acrylic case with a black base, sized for 1:43 F1 models.",
    images: [],
    variants: [{ label: null, stock: 10 }],
  },
  {
    name: "Team keychain set of 5",
    team: null,
    driver: null,
    category: "Keychains",
    brand: null,
    scale: null,
    price: 899,
    badge: null,
    description: "Five metal keychains in team colours.",
    images: [],
    variants: [{ label: null, stock: 12 }],
  },
];
