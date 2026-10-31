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

/** A projected point as a tuple, matching the GeoJSON coordinate shape. */
type Pt = [number, number];

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
  /** Projected bounding box, for framing the camera on selection. */
  bounds: { x0: number; y0: number; x1: number; y1: number } | null;
  /**
   * Projected polygon rings (outer ring first per polygon), used for
   * sampling the dotted texture inside a country. Null when unavailable.
   */
  polygons: Pt[][][] | null;
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

/**
 * Default inset for the projection, in viewBox units.
 *
 * Sized so every member gets clear margin on all four sides — Eastern
 * Indonesia (Papua) reaches lon 140.98, which is the easternmost point and was
 * previously flush against the frame edge, reading as "cut off".
 */
export const DEFAULT_PADDING = 44;

/** Builds a Mercator projection fitted to the ASEAN member shapes. */
export function createProjection(
  width: number,
  height: number,
  padding = DEFAULT_PADDING,
): GeoProjection {
  return geoMercator().fitExtent(
    [
      [padding, padding],
      [width - padding, height - padding],
    ],
    { type: "FeatureCollection", features: aseanFeatures },
  );
}

/* ── Point-in-polygon + dot sampling ───────────────────────────────── */

/** Ray-casting point-in-ring test on projected (map) coordinates. */
function inRing(x: number, y: number, ring: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** True when a projected point falls inside a country's outer rings. */
function inPolygon(x: number, y: number, polygons: Pt[][][]): boolean {
  for (const polygon of polygons) {
    if (inRing(x, y, polygon[0])) return true;
  }
  return false;
}

/**
 * Samples a grid of dots inside one country's projected shape.
 *
 * Used for the "opportunity dots" that light up on selection. The first pass
 * uses a coarse step; selecting a country re-samples with a finer step so the
 * pattern stays crisp as the camera zooms in.
 *
 * `box` is the projected bounding box of the country; only points inside it
 * are tested, which keeps the scan cheap.
 */
export function sampleDots(
  geometry: MapGeometry,
  box: { x0: number; y0: number; x1: number; y1: number },
  step: number,
  seed = 1,
): MapPoint[] {
  if (!geometry.polygons) return [];
  const dots: MapPoint[] = [];
  /* Deterministic jitter so the grid looks organic but stable across renders. */
  const jitter = (i: number, j: number, axis: number): number => {
    const h = Math.sin((i * 12.9898 + j * 78.233 + seed * 37.719 + axis * 4.1)) * 43758.5453;
    return (h - Math.floor(h) - 0.5) * step * 0.5;
  };

  let row = 0;
  for (let y = box.y0; y <= box.y1; y += step, row += 1) {
    let col = 0;
    for (let x = box.x0; x <= box.x1; x += step, col += 1) {
      const px = x + jitter(row, col, 0);
      const py = y + jitter(row, col, 1);
      if (inPolygon(px, py, geometry.polygons)) {
        dots.push({ x: px, y: py });
      }
    }
  }
  return dots;
}

/**
 * Computes the projected bounds of a single country plus the transform that
 * frames it inside `viewW`/`viewH` at the given margin.
 *
 * Returns null when the country has no usable geometry.
 */
export function countryFrame(
  geometry: MapGeometry,
  viewW: number,
  viewH: number,
  margin = 0.18,
): { scale: number; tx: number; ty: number; center: MapPoint; span: number } | null {
  if (!geometry.bounds) return null;
  const { x0, y0, x1, y1 } = geometry.bounds;
  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);
  const usableW = viewW * (1 - margin * 2);
  const usableH = viewH * (1 - margin * 2);
  const scale = Math.min(usableW / w, usableH / h);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  return {
    scale,
    tx: viewW / 2 - cx * scale,
    ty: viewH / 2 - cy * scale,
    center: { x: cx, y: cy },
    span: Math.max(w, h),
  };
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
 * Projects a GeoJSON Polygon/MultiPolygon into map coordinates, keeping only
 * outer rings (holes are rare in country shapes and would complicate the
 * inside-shape test).
 */
function projectPolygons(
  geom: Geometry | null | undefined,
  project: (c: number[]) => Pt | null,
): Pt[][][] | null {
  if (!geom) return null;

  const ringsToPolygons = (rings: number[][][]): Pt[][] =>
    rings.map((ring) =>
      ring.map((c) => project(c)).filter((p): p is Pt => p !== null),
    );

  if (geom.type === "Polygon") return [ringsToPolygons(geom.coordinates)];
  if (geom.type === "MultiPolygon") {
    return geom.coordinates.map((poly: number[][][]) => ringsToPolygons(poly));
  }
  return null;
}

/**
 * Computes every country path for a given viewBox size. Call inside `useMemo`
 * so paths are only rebuilt when the size changes.
 */
export function buildMapGeometry(
  width: number,
  height: number,
  padding = DEFAULT_PADDING,
): { geometry: MapGeometry[]; projection: GeoProjection; pathGen: GeoPath } {
  const projection = createProjection(width, height, padding);
  const pathGen = geoPath(projection);
  const project = (c: number[]): [number, number] | null => {
    const p = projection([c[0], c[1]]);
    if (!p || Number.isNaN(p[0]) || Number.isNaN(p[1])) return null;
    return [p[0], p[1]];
  };

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

      const polygons = projectPolygons(f.geometry, project);

      /* Bounds from the projected rings — cheaper and more reliable than
         pathGen.bounds for MultiPolygons with many islands. */
      let bounds: MapGeometry["bounds"] = null;
      if (polygons) {
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        for (const polygon of polygons) {
          for (const ring of polygon) {
            for (const [x, y] of ring) {
              if (x < x0) x0 = x;
              if (y < y0) y0 = y;
              if (x > x1) x1 = x;
              if (y > y1) y1 = y;
            }
          }
        }
        if (Number.isFinite(x0) && Number.isFinite(y0)) bounds = { x0, y0, x1, y1 };
      }

      return {
        id,
        key:
          occurrence === 0 ? id || "unknown" : `${id || "unknown"}-${occurrence}`,
        path: pathGen(f),
        centroid: hasCentroid ? { x: centroid[0], y: centroid[1] } : null,
        bounds,
        polygons,
        isAsean,
        name: isAsean ? countryName(id) : undefined,
        code: isAsean ? NUMERIC_TO_CODE[id] : undefined,
      };
    })
    // Drop features with no projected path (tiny islands d3 collapses).
    .filter((g) => g.path !== null);

  return { geometry, projection, pathGen };
}
