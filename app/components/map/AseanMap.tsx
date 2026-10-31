"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { AseanCountry } from "./AseanCountry";
import {
  buildMapGeometry,
  projectPoint,
  countryName,
  DEFAULT_PADDING,
} from "@/lib/map-geo";
import type { MapPoint } from "@/lib/map-geo";
import { MapConnections } from "./MapConnections";
import { MapAmbience } from "./MapAmbience";
import { MapSelectionOverlay } from "./MapSelectionOverlay";
import { HUBS, projectHubs, SINGAPORE_MARKER } from "@/lib/map-hubs";
import { SPRING, SPRING_SOFT } from "@/lib/motion";
import { useMapSelection } from "./useMapSelection";
import { opportunitiesFor } from "@/lib/opportunities";

/**
 * Country codes with no polygon in the atlas but a real presence on the map.
 * Brunei has a tiny polygon; Singapore's is sub-pixel, so both get markers.
 */
const MARKER_CODES = ["SG", "BN"] as const;

/** Human labels for the marker-only countries. */
const MARKER_LABELS: Record<string, string> = {
  SG: "Singapore",
  BN: "Brunei",
};

interface AseanMapProps {
  /** Extra classes for the outer figure. */
  className?: string;
  /** Accessible description; defaults to a summary of the map. */
  ariaLabel?: string;
  /**
   * Fired when a country is selected (click/Enter) or cleared. The parent
   * usually syncs this to the URL.
   */
  onSelect?: (code: string | null) => void;
  /** Controlled selection. When provided, the map follows it. */
  selected?: string | null;
  /** Height hint for the container; the map scales to its box. */
  compact?: boolean;
}

/** Internal viewBox. The SVG scales fluidly to its container. */
const VIEW_W = 640;
const VIEW_H = 560;

/**
 * The animated ASEAN map: the landing hero's centrepiece and the home
 * explorer's picking surface.
 *
 * Layering, bottom to top: sea, ambience, neighbour countries, ASEAN members,
 * dots + display name (inside the zoom group), hub arcs, tooltip, Back pill.
 * The camera is a single spring-animated `transform` on one `<g>`, so zooming
 * never re-lays-out the DOM.
 */
export function AseanMap({
  className,
  ariaLabel = "Interactive map of the ten ASEAN member states. Select a country to see its opportunities.",
  onSelect,
  selected: controlledSelected,
  compact = false,
}: AseanMapProps): ReactElement {
  const reducedMotion = useReducedMotion() ?? false;
  const [hoverId, setHoverId] = useState<string | null>(null);

  const { geometry, projection } = useMemo(
    () => buildMapGeometry(VIEW_W, VIEW_H, DEFAULT_PADDING),
    [],
  );

  const hubPositions = useMemo(
    () => projectHubs(HUBS, (lon, lat) => projectPoint(projection, lon, lat)),
    [projection],
  );

  const markerPoints = useMemo(() => {
    const out = new Map<string, MapPoint>();
    const sg = projectPoint(projection, SINGAPORE_MARKER.lon, SINGAPORE_MARKER.lat);
    if (sg) out.set("SG", sg);
    const bn = projectPoint(projection, 114.7277, 4.5353);
    if (bn) out.set("BN", bn);
    return out;
  }, [projection]);

  const aseanGeometry = useMemo(() => geometry.filter((g) => g.isAsean), [geometry]);

  const { selection, select } = useMapSelection({
    geometry,
    viewW: VIEW_W,
    viewH: VIEW_H,
    compact,
    hubPositions,
  });

  /* Selection can be driven from the URL by the parent. */
  const activeCode = controlledSelected !== undefined ? controlledSelected : selection.code;
  const activeGeometry = useMemo(
    () => (activeCode ? aseanGeometry.find((g) => g.code === activeCode) ?? null : null),
    [activeCode, aseanGeometry],
  );

  const handleSelect = useCallback(
    (code: string | null) => {
      select(code);
      onSelect?.(code);
    },
    [select, onSelect],
  );

  /* Keep the internal hook in step when the parent controls selection. */
  useEffect(() => {
    if (controlledSelected === undefined) return;
    if (controlledSelected !== selection.code) select(controlledSelected);
  }, [controlledSelected, selection.code, select]);

  const activeName = activeGeometry?.name ?? (hoverId ? countryName(hoverId) : undefined);
  const hoverPoint = useMemo(() => {
    if (!hoverId || activeCode) return null;
    return aseanGeometry.find((g) => g.id === hoverId)?.centroid ?? null;
  }, [hoverId, activeCode, aseanGeometry]);

  /* How far the ripple must travel to sweep the selected country. */
  const rippleRadius = useMemo(() => {
    if (!activeGeometry?.bounds) return 60;
    const b = activeGeometry.bounds;
    return Math.hypot(b.x1 - b.x0, b.y1 - b.y0) / 2 + 12;
  }, [activeGeometry]);

  const count = activeCode ? opportunitiesFor(activeCode).length : 0;

  const camera = controlledSelected !== undefined && activeCode !== selection.code
    ? { scale: 1, tx: 0, ty: 0 }
    : selection.camera;

  return (
    <figure className={className} style={{ margin: 0 }}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="h-full w-full"
          role="group"
          aria-label={ariaLabel}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="asean-sea" x1="0" y1="0" x2="0.35" y2="1">
              <stop offset="0%" stopColor="var(--color-ocean-900)" />
              <stop offset="45%" stopColor="var(--color-ocean-800)" />
              <stop offset="100%" stopColor="var(--color-night-950)" />
            </linearGradient>
            <radialGradient id="asean-sea-glow" cx="50%" cy="42%" r="62%">
              <stop offset="0%" stopColor="var(--color-ocean-600)" stopOpacity="0.45" />
              <stop offset="70%" stopColor="var(--color-ocean-800)" stopOpacity="0" />
            </radialGradient>
            <filter id="asean-country-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <clipPath id="asean-sea-clip">
              <rect width={VIEW_W} height={VIEW_H} rx={28} />
            </clipPath>
          </defs>

          {/* Sea — outside the camera group so it never moves. */}
          <rect width={VIEW_W} height={VIEW_H} fill="url(#asean-sea)" rx={28} />
          <rect width={VIEW_W} height={VIEW_H} fill="url(#asean-sea-glow)" rx={28} />

          {/* Everything geographic lives inside the camera group. The rounded clip
              sits OUTSIDE the transform: a clip rect defined in local units would
              otherwise scale with the camera and cut the focused country away. */}
          <g clipPath="url(#asean-sea-clip)">
            <motion.g
              animate={{ scale: camera.scale, x: camera.tx, y: camera.ty }}
              initial={false}
              transition={reducedMotion ? { duration: 0.01 } : { ...SPRING_SOFT, stiffness: 220, damping: 30 }}
              style={{ transformOrigin: "0 0" }}
            >
              {/* Clouds drift apart and fade as the zoom lands. */}
              <motion.g
                animate={{ opacity: activeCode ? 0.25 : 1, scale: activeCode ? 1.12 : 1 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "50% 50%" }}
              >
                <MapAmbience width={VIEW_W} height={VIEW_H} reduced={reducedMotion} />
              </motion.g>

              {/* Neighbouring, non-member countries — dim context. */}
              <motion.g
                animate={{ opacity: activeCode ? 0.2 : 1 }}
                transition={{ duration: 0.45 }}
              >
                {geometry
                  .filter((g) => !g.isAsean)
                  .map((g) => (
                    <AseanCountry
                      key={g.key}
                      geometry={g}
                      index={0}
                      idPrefix="asean-map"
                      isActive={false}
                      onActivate={() => undefined}
                      reducedMotion={reducedMotion}
                    />
                  ))}
              </motion.g>

              {/* ASEAN members — gold, interactive, staggered reveal.
                  Unselected members dim to 20% once something is selected. */}
              <g filter="url(#asean-country-glow)">
                {aseanGeometry.map((g, i) => {
                  const isDimmed = Boolean(activeCode) && activeCode !== g.code;
                  return (
                    <motion.g
                      key={g.key}
                      animate={{ opacity: isDimmed ? 0.2 : 1 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <AseanCountry
                        geometry={g}
                        index={i}
                        idPrefix="asean-map"
                        isActive={hoverId === g.id || activeCode === g.code}
                        selected={activeCode === g.code}
                        onActivate={setHoverId}
                        onSelect={handleSelect}
                        reducedMotion={reducedMotion}
                      />
                    </motion.g>
                  );
                })}
              </g>

              {/* Country markers for Singapore and Brunei. */}
              {MARKER_CODES.map((code) => {
                const p = markerPoints.get(code);
                if (!p) return null;
                const isActive = activeCode === code;
                const isDimmed = Boolean(activeCode) && !isActive;
                return (
                  <motion.g
                    key={code}
                    transform={`translate(${p.x} ${p.y})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${MARKER_LABELS[code] ?? code}, ASEAN member state`}
                    onMouseEnter={() => setHoverId(null)}
                    onFocus={() => setHoverId(null)}
                    onClick={() => handleSelect(isActive ? null : code)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(isActive ? null : code);
                      }
                    }}
                    animate={{ opacity: isDimmed ? 0.25 : 1 }}
                    style={{ cursor: "pointer" }}
                    className="focus-visible:outline-none"
                  >
                    <circle
                      r={3.4}
                      fill={isActive ? "var(--color-gold-200)" : "var(--color-gold-300)"}
                      stroke="var(--color-night-950)"
                      strokeWidth={1}
                    />
                    <circle
                      r={7}
                      fill="none"
                      stroke="var(--color-gold-400)"
                      strokeWidth={isActive ? 1.4 : 0.9}
                      strokeOpacity={isActive ? 1 : 0.65}
                    />
                  </motion.g>
                );
              })}

              {/* Opportunity dots + display name for the selection. */}
              <AnimatePresence>
                {activeGeometry && selection.dots.length >= 0 && (
                  <MapSelectionOverlay
                    key={activeGeometry.code ?? "sel"}
                    dots={selection.dots}
                    origin={selection.origin}
                    name={activeGeometry.name ?? ""}
                    count={count}
                    rippleRadius={rippleRadius}
                    selectionKey={activeGeometry.code ?? "sel"}
                    viewW={VIEW_W}
                    viewH={VIEW_H}
                  />
                )}
              </AnimatePresence>
            </motion.g>
          </g>

          {/* Routes of opportunity — re-routed from the selection. */}
          <MapConnections
            positions={hubPositions}
            hubs={HUBS}
            delay={reducedMotion ? 0 : 1.1}
            reduced={reducedMotion}
            fromCountry={activeCode}
            compact={compact}
          />

          {/* Hover tooltip (suppressed once a country is framed). */}
          <AnimatePresence>
            {hoverPoint && activeName && !activeCode && (
              <motion.g
                key={hoverId}
                initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={SPRING}
                transform={`translate(${hoverPoint.x} ${hoverPoint.y})`}
                style={{
                  transformBox: "fill-box",
                  transformOrigin: "center",
                  pointerEvents: "none",
                }}
              >
                <rect
                  x={-40}
                  y={-34}
                  width={80}
                  height={22}
                  rx={11}
                  fill="var(--material-thick)"
                  stroke="var(--material-hairline)"
                  strokeWidth={0.8}
                />
                <text
                  x={0}
                  y={-19}
                  textAnchor="middle"
                  fill="var(--color-foreground)"
                  style={{ fontSize: 10, fontWeight: 600, letterSpacing: "-0.01em" }}
                >
                  {activeName}
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* Back pill — reverses the selection. */}
        <AnimatePresence>
          {activeCode && (
            <motion.button
              type="button"
              onClick={() => handleSelect(null)}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.94 }}
              transition={SPRING}
              className="glass-thick absolute top-4 left-4 inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-foreground transition-colors duration-200 hover:text-gold-400"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M10 3.5 5 8l5 4.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to ASEAN
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </figure>
  );
}