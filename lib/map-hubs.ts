/**
 * Hub cities + connection arcs for the ASEAN map.
 *
 * Ported verbatim from origin/frontend `frontend/src/components/map/hubs.ts`
 * (only the `CountryCode` import is re-pointed at `@/lib/map-geo`).
 */
import type { CountryCode } from "./map-geo";

/** A projected point in map (viewBox) coordinates. */
export interface HubPoint {
  x: number;
  y: number;
}

/** Hub cities that anchor the "routes of opportunity" motif. */
export interface Hub {
  id: string;
  /** City label shown in the marker tooltip. */
  city: string;
  country: CountryCode;
  lon: number;
  lat: number;
  /** Which arc ring this hub belongs to, used to vary pulse timing. */
  ring: "core" | "outer";
}

/** Six hub cities: the region's startup and finance centres. */
export const HUBS: readonly Hub[] = [
  { id: "sg", city: "Singapore", country: "SG", lon: 103.8198, lat: 1.3521, ring: "core" },
  { id: "kl", city: "Kuala Lumpur", country: "MY", lon: 101.6869, lat: 3.139, ring: "core" },
  { id: "jkt", city: "Jakarta", country: "ID", lon: 106.8456, lat: -6.2088, ring: "core" },
  { id: "bkk", city: "Bangkok", country: "TH", lon: 100.5018, lat: 13.7563, ring: "outer" },
  { id: "mnl", city: "Manila", country: "PH", lon: 120.9842, lat: 14.5995, ring: "outer" },
  { id: "hno", city: "Hanoi", country: "VN", lon: 105.8342, lat: 21.0278, ring: "outer" },
] as const;

/**
 * Connection pairs for the animated arcs. Each pair is a hub id → hub id.
 * Kept deliberately sparse so the map reads clearly rather than as a mesh.
 */
export const HUB_LINKS: ReadonlyArray<readonly [string, string]> = [
  ["sg", "kl"],
  ["sg", "jkt"],
  ["sg", "bkk"],
  ["sg", "mnl"],
  ["sg", "hno"],
  ["kl", "jkt"],
  ["bkk", "hno"],
] as const;

/**
 * Singapore is tiny at ASEAN scale, so it always gets an extra marker even
 * when its country polygon is barely visible.
 */
export const SINGAPORE_MARKER = { lon: 103.8198, lat: 1.3521 } as const;

/**
 * Projects every hub once, keyed by hub id. Hubs whose projection fails are
 * dropped rather than rendered at a bogus position.
 */
export function projectHubs(
  hubs: readonly Hub[],
  project: (lon: number, lat: number) => HubPoint | null,
): Map<string, HubPoint> {
  const out = new Map<string, HubPoint>();
  for (const hub of hubs) {
    const p = project(hub.lon, hub.lat);
    if (p) out.set(hub.id, p);
  }
  return out;
}
