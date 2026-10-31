/**
 * Geo data + projection for the ASEAN map.
 *
 * Ported from origin/frontend `frontend/src/components/map/geo.ts`.
 * Uses world-atlas `countries-50m` trimmed to the ASEAN region by
 * `scripts/build-asean-topology.mjs`. 110m was rejected because it omits
 * Singapore entirely.
 *
 * The projection is a Mercator fitted to the ASEAN member shapes themselves
 * (not a hand-built lon/lat box — a polygon ring's winding is interpreted
 * spherically by d3 and easily encloses the wrong hemisphere).
 *
 * NOTE: Timor-Leste (TL) has no polygon in this atlas (CONTEXT only);
 * ASEAN_NUMERIC_IDS covers the other 10 members. The country grid still
 * lists all 11.
 */
import { geoMercator, geoPath } from "d3-geo";
import type { GeoProjection, GeoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import topo from "../public/asean/asean-countries-50m.json";

export type CountryCode =
  | "ID"
  | "MY"
  | "PH"
  | "SG"
  | "TH"
  | "VN"
  | "MM"
  | "KH"
  | "LA"
  | "BN";

/** The atlas is untyped JSON at the import boundary; assert it once. */
const atlas = topo as unknown as Topology<{
  countries: GeometryCollection<{ name?: string }>;
}>;

/** ISO-3166 numeric ids used by world-atlas for the ten ASEAN members. */
export const ASEAN_NUMERIC_IDS: Record<CountryCode, string> = {
  BN: "096",
  KH: "116",
  ID: "360",
  LA: "418",
  MY: "458",
  MM: "104",
  PH: "608",
  SG: "702",
  TH: "764",
  VN: "704",
};

export const ASEAN_ID_SET: ReadonlySet<string> = new Set(
  Object.values(ASEAN_NUMERIC_IDS),
);

/** Reverse lookup: numeric id → ISO-2, for labelling. */
export const NUMERIC_TO_CODE: Record<string, CountryCode> = Object.fromEntries(
  Object.entries(ASEAN_NUMERIC_IDS).map(([code, id]) => [id, code]),
) as Record<string, CountryCode>;

/**
 * Country names keyed by numeric id. Kept local so the map does not depend on
 * the topology's `properties` (which vary between atlas versions).
 */
const NUMERIC_TO_NAME: Record<string, string> = {
  "096": "Brunei",
  "116": "Cambodia",
  "360": "Indonesia",
  "418": "Laos",
  "458": "Malaysia",
  "104": "Myanmar",
  "608": "Philippines",
  "702": "Singapore",
  "764": "Thailand",
  "704": "Vietnam",
};

export function countryName(id: string): string | undefined {
  return NUMERIC_TO_NAME[id];
}

/** A projected point in map (viewBox) coordinates. */
export interface MapPoint {
  x: number;
  y: number;
}

export interface MapGeometry {
  /** Numeric country id (ISO-3166). */
  id: string;
  /**
   * Unique key for React. The atlas contains countries split across several
   * geometries (Australia appears twice), so `id` alone is not unique.
   */
  key: string;
  /** SVG path `d`, or null if the feature had no geometry. */
  path: string | null;
  /** Projected centroid, in map coordinates. */
  centroid: MapPoint | null;
  /** True when this country is an ASEAN member. */
  isAsean: boolean;
  /** Display name, only set for ASEAN members. */
  name?: string;
  /** ISO-2 code, only set for ASEAN members. */
  code?: CountryCode;
}

/* ── Topology is decoded once, at module scope ─────────────────────── */

type AtlasFeature = Feature<Geometry, { name?: string }>;

const collection = feature(
  atlas,
  atlas.objects.countries,
) as unknown as FeatureCollection<Geometry, { name?: string }>;

const allFeatures: AtlasFeature[] = collection.features;

/** Just the ten ASEAN members — used to fit the projection. */
const aseanFeatures: AtlasFeature[] = allFeatures.filter((f) =>
  ASEAN_ID_SET.has(String(f.id ?? "")),
);

/* ── Projection ────────────────────────────────────────────────────── */

/** Builds a Mercator projection fitted to the ASEAN member shapes. */
export function createProjection(
  width: number,
  height: number,
  padding = 0,
): GeoProjection {
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    { type: "FeatureCollection", features: aseanFeatures },
  );
}

/** Projects a lon/lat pair to map coordinates, if the projection succeeds. */
export function projectPoint(
  projection: GeoProjection,
  lon: number,
  lat: number,
): MapPoint | null {
  const point = projection([lon, lat]);
  if (!point || Number.isNaN(point[0]) || Number.isNaN(point[1])) return null;
  return { x: point[0], y: point[1] };
}

/**
 * Computes every country path for a given viewBox size. Call inside `useMemo`
 * so paths are only rebuilt when the size changes.
 */
export function buildMapGeometry(
  width: number,
  height: number,
  padding = 0,
): { geometry: MapGeometry[]; projection: GeoProjection; pathGen: GeoPath } {
  const projection = createProjection(width, height, padding);
  const pathGen = geoPath(projection);

  const seen = new Map<string, number>();
  const geometry: MapGeometry[] = allFeatures
    .map((f) => {
      const id = String(f.id ?? "");
      /* Disambiguate repeated ids (e.g. Australia's two geometries). */
      const occurrence = seen.get(id) ?? 0;
      seen.set(id, occurrence + 1);
      const isAsean = ASEAN_ID_SET.has(id);
      const centroid = pathGen.centroid(f);
      const hasCentroid =
        Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]);
      return {
        id,
        key:
          occurrence === 0 ? id || "unknown" : `${id || "unknown"}-${occurrence}`,
        path: pathGen(f),
        centroid: hasCentroid ? { x: centroid[0], y: centroid[1] } : null,
        isAsean,
        name: isAsean ? countryName(id) : undefined,
        code: isAsean ? NUMERIC_TO_CODE[id] : undefined,
      };
    })
    // Drop features with no projected path (tiny islands d3 collapses).
    .filter((g) => g.path !== null);

  return { geometry, projection, pathGen };
}
