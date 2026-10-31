"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { MapGeometry } from "@/lib/map-geo";
import { countryFrame, sampleDots, NUMERIC_TO_CODE } from "@/lib/map-geo";
import type { MapPoint } from "@/lib/map-geo";

/** Countries too small to frame from their own polygon; use a fixed zoom. */
const FIXED_ZOOM: Record<string, { scale: number; lon: number; lat: number }> = {
  // Singapore is ~4x2 viewBox units — frame around the marker instead.
  SG: { scale: 26, lon: 103.8198, lat: 1.3521 },
  // Brunei is ~14x11 units; a moderate fixed zoom reads better than a tight fit.
  BN: { scale: 7.5, lon: 114.7277, lat: 4.5353 },
};

/** Dot grid spacing (viewBox units) at rest and when zoomed in. */
const DOT_STEP_FAR = 11;
const DOT_STEP_NEAR = 3.2;

/** Mobile gets a coarser grid to stay at 60fps. */
const DOT_STEP_FAR_MOBILE = 15;
const DOT_STEP_NEAR_MOBILE = 5;

export interface CameraTransform {
  scale: number;
  tx: number;
  ty: number;
}

export interface SelectionState {
  /** ISO-2 code of the selected country, or null when showing all ASEAN. */
  code: string | null;
  /** The selected country's geometry, when found. */
  geometry: MapGeometry | null;
  /** Simple integer id used to key the ripple animation. */
  numericId: string | null;
  /** Camera transform for the SVG group. Identity when nothing is selected. */
  camera: CameraTransform;
  /**
   * Dots sampled inside the selected country — finer when zoomed in.
   * Empty when nothing is selected.
   */
  dots: MapPoint[];
  /**
   * Centre of the selection in viewBox coords, used as the ripple origin and
   * for placing the display name.
   */
  origin: MapPoint | null;
}

interface UseMapSelectionArgs {
  geometry: MapGeometry[];
  viewW: number;
  viewH: number;
  /** True on narrow viewports — coarser sampling. */
  compact: boolean;
  /** Projected hub positions, for framing Singapore/Brunei. */
  hubPositions: Map<string, MapPoint>;
}

/**
 * Owns the map's selection + camera state.
 *
 * Kept separate from the render component so the zoom maths and the dot
 * resampling are testable and so the SVG stays declarative.
 */
export function useMapSelection({
  geometry,
  viewW,
  viewH,
  compact,
  hubPositions,
}: UseMapSelectionArgs): {
  selection: SelectionState;
  select: (code: string | null) => void;
  clear: () => void;
} {
  const [code, setCode] = useState<string | null>(null);

  const selected = useMemo(
    () => (code ? geometry.find((g) => g.code === code) ?? null : null),
    [code, geometry],
  );

  const numericId = useMemo(() => {
    if (!code) return null;
    const entry = Object.entries(NUMERIC_TO_CODE).find(([, c]) => c === code);
    return entry ? entry[0] : null;
  }, [code]);

  const camera = useMemo<CameraTransform>(() => {
    if (!code || !selected) return { scale: 1, tx: 0, ty: 0 };

    const fixed = FIXED_ZOOM[code];
    if (fixed) {
      // Frame around a known point rather than the polygon bounds.
      const p = hubPositions.get(code.toLowerCase()) ?? null;
      const cx = p ? p.x : selected.centroid?.x ?? viewW / 2;
      const cy = p ? p.y : selected.centroid?.y ?? viewH / 2;
      return {
        scale: fixed.scale,
        tx: viewW / 2 - cx * fixed.scale,
        ty: viewH / 2 - cy * fixed.scale,
      };
    }

    const frame = countryFrame(selected, viewW, viewH, 0.16);
    if (!frame) return { scale: 1, tx: 0, ty: 0 };
    /* Cap the zoom so small countries do not blow up into abstraction. */
    const scale = Math.min(frame.scale, 9);
    return {
      scale,
      tx: viewW / 2 - frame.center.x * scale,
      ty: viewH / 2 - frame.center.y * scale,
    };
  }, [code, selected, hubPositions, viewW, viewH]);

  /**
   * Dots for the selected country.
   *
   * Sampling happens in *base* map coordinates, then the same camera
   * transform is applied by the parent group — so the dots stay aligned to
   * the landmass at any zoom. The step is chosen from the resulting on-screen
   * size, giving a denser grid when zoomed in.
   */
  const dots = useMemo(() => {
    if (!selected || !selected.bounds) return [];
    const onScreenScale = camera.scale;
    const near = onScreenScale > 3.2;
    const step = compact
      ? near
        ? DOT_STEP_NEAR_MOBILE
        : DOT_STEP_FAR_MOBILE
      : near
        ? DOT_STEP_NEAR
        : DOT_STEP_FAR;
    /* Expand the search box slightly so edge dots are not missed. */
    const b = selected.bounds;
    return sampleDots(
      selected,
      { x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 },
      step,
      near ? 2 : 1,
    );
  }, [selected, camera.scale, compact]);

  const origin = useMemo<MapPoint | null>(() => {
    if (!selected) return null;
    if (selected.centroid) return selected.centroid;
    if (selected.bounds) {
      return {
        x: (selected.bounds.x0 + selected.bounds.x1) / 2,
        y: (selected.bounds.y0 + selected.bounds.y1) / 2,
      };
    }
    return null;
  }, [selected]);

  const select = useCallback((next: string | null) => setCode(next), []);
  const clear = useCallback(() => setCode(null), []);

  /* Escape clears the selection — the documented way back to ASEAN. */
  useEffect(() => {
    if (!code) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setCode(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [code]);

  return {
    selection: {
      code,
      geometry: selected,
      numericId,
      camera,
      dots,
      origin,
    },
    select,
    clear,
  };
}