/**
 * Display metadata for the 11 ASEAN countries the app covers.
 *
 * Kept separate from `data/countries/*.json` so client components can render
 * names, capitals and coordinates without pulling the full server-side data
 * files into the browser bundle.
 */
export interface CountryMeta {
  code: string;
  name: string;
  capital: string;
  /** Approximate centre, used for map markers and framing. */
  lon: number;
  lat: number;
  /** True for the ten members with land on the main map. */
  onMap: boolean;
}

export const COUNTRY_META: Record<string, CountryMeta> = {
  BN: { code: "BN", name: "Brunei", capital: "Bandar Seri Begawan", lon: 114.7277, lat: 4.5353, onMap: true },
  KH: { code: "KH", name: "Cambodia", capital: "Phnom Penh", lon: 104.991, lat: 12.5657, onMap: true },
  ID: { code: "ID", name: "Indonesia", capital: "Jakarta", lon: 106.8456, lat: -6.2088, onMap: true },
  LA: { code: "LA", name: "Laos", capital: "Vientiane", lon: 102.4955, lat: 19.8563, onMap: true },
  MY: { code: "MY", name: "Malaysia", capital: "Kuala Lumpur", lon: 101.6869, lat: 3.139, onMap: true },
  MM: { code: "MM", name: "Myanmar", capital: "Naypyidaw", lon: 95.956, lat: 21.9162, onMap: true },
  PH: { code: "PH", name: "Philippines", capital: "Manila", lon: 120.9842, lat: 14.5995, onMap: true },
  SG: { code: "SG", name: "Singapore", capital: "Singapore", lon: 103.8198, lat: 1.3521, onMap: true },
  TH: { code: "TH", name: "Thailand", capital: "Bangkok", lon: 100.5018, lat: 13.7563, onMap: true },
  VN: { code: "VN", name: "Vietnam", capital: "Hanoi", lon: 105.8342, lat: 21.0278, onMap: true },
  TL: { code: "TL", name: "Timor-Leste", capital: "Dili", lon: 125.7275, lat: -8.8742, onMap: false },
};

/** All 11 countries, in the order the country grid uses (by code). */
export const ALL_COUNTRIES: readonly CountryMeta[] = Object.values(COUNTRY_META).sort(
  (a, b) => a.code.localeCompare(b.code),
);

/** Country name by code, falling back to the raw code. */
export function metaName(code: string): string {
  return COUNTRY_META[code.toUpperCase()]?.name ?? code;
}