"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { AseanCountry } from "./AseanCountry";
import { buildMapGeometry, projectPoint, countryName } from "@/lib/map-geo";
import type { MapGeometry, MapPoint } from "@/lib/map-geo";
import { MapConnections } from "./MapConnections";
import { MapAmbience } from "./MapAmbience";
import { HUBS, projectHubs, SINGAPORE_MARKER } from "@/lib/map-hubs";
import { SPRING } from "@/lib/motion";

interface AseanMapProps {
  /** Extra classes for the outer figure. */
  className?: string;
  /** Accessible description; defaults to a summary of the map. */
  ariaLabel?: string;
  /** Fired with the ISO-2 country code when a country is selected. */
  onSelect?: (code: string) => void;
}

/** Internal viewBox. The SVG scales fluidly to its container. */
const VIEW_W = 640;
const VIEW_H = 560;

/**
 * Inset for the projection, in viewBox units. Keeps coastlines clear of the
 * rounded frame so Indonesia's southern islands are not clipped by the corner
 * radius.
 */
const VIEW_PADDING = 30;

/**
 * The animated ASEAN map: the landing hero's centrepiece.
 *
 * Presentational only — selection is reported via `onSelect` and the parent
 * (e.g. a client island with `useRouter`) decides what happens next.
 *
 * Structure is deliberately layered so click-to-zoom can be added without
 * rework: every country is its own `<g id="asean-map-country-XX">` with a
 * `data-country` attribute, and all geometry comes from one projection that a
 * zoom transform could simply re-fit.
 */
export function AseanMap({
  className,
  ariaLabel = "Map of the ten ASEAN member states, with routes connecting Singapore, Kuala Lumpur, Jakarta, Bangkok, Manila and Hanoi.",
  onSelect,
}: AseanMapProps): ReactElement {
  const reducedMotion = useReducedMotion() ?? false;
  const [activeId, setActiveId] = useState<string | null>(null);

  /* Geometry, projection and hub positions are computed once per mount.
     `buildMapGeometry` parses the topology a single time. */
  const { geometry, projection } = useMemo(
    () => buildMapGeometry(VIEW_W, VIEW_H, VIEW_PADDING),
    [],
  );

  const hubPositions = useMemo(
    () => projectHubs(HUBS, (lon, lat) => projectPoint(projection, lon, lat)),
    [projection],
  );

  const singaporePoint: MapPoint | null = useMemo(
    () => projectPoint(projection, SINGAPORE_MARKER.lon, SINGAPORE_MARKER.lat),
    [projection],
  );

  /* Stable split so the reveal index counts only the interactive members. */
  const aseanGeometry: MapGeometry[] = useMemo(
    () => geometry.filter((g) => g.isAsean),
    [geometry],
  );

  const activeName = activeId ? countryName(activeId) : undefined;
  /* Position the tooltip over the active country using its projected centroid. */
  const activePoint = useMemo(() => {
    if (!activeId) return null;
    const target = aseanGeometry.find((g) => g.id === activeId);
    return target?.centroid ?? null;
  }, [activeId, aseanGeometry]);

  return (
    <figure className={className} style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full"
        role="img"
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
        </defs>

        {/* Sea */}
        <rect width={VIEW_W} height={VIEW_H} fill="url(#asean-sea)" rx={28} />
        <rect width={VIEW_W} height={VIEW_H} fill="url(#asean-sea-glow)" rx={28} />

        {/* Ambient: clouds + stars, behind the landmasses. */}
        <MapAmbience width={VIEW_W} height={VIEW_H} reduced={reducedMotion} />

        {/* Neighbouring, non-member countries — dim context. */}
        <g>
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
        </g>

        {/* ASEAN members — gold, interactive, staggered reveal. */}
        <g filter="url(#asean-country-glow)">
          {aseanGeometry.map((g, i) => (
            <AseanCountry
              key={g.key}
              geometry={g}
              index={i}
              idPrefix="asean-map"
              isActive={activeId === g.id}
              onActivate={setActiveId}
              onSelect={onSelect}
              reducedMotion={reducedMotion}
            />
          ))}
        </g>

        {/* Singapore is tiny at ASEAN scale: an always-visible marker keeps it
            discoverable and clickable. */}
        {singaporePoint && (
          <g
            transform={`translate(${singaporePoint.x} ${singaporePoint.y})`}
            role="button"
            tabIndex={0}
            aria-label="Singapore, ASEAN member state"
            onMouseEnter={() => setActiveId("702")}
            onMouseLeave={() => setActiveId(null)}
            onFocus={() => setActiveId("702")}
            onBlur={() => setActiveId(null)}
            onClick={() => onSelect?.("SG")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect?.("SG");
              }
            }}
            style={{ cursor: "pointer" }}
          >
            <circle r={3.2} fill="var(--color-gold-300)" stroke="var(--color-night-950)" strokeWidth={1} />
            <circle r={6.5} fill="none" stroke="var(--color-gold-400)" strokeWidth={0.9} strokeOpacity={0.65} />
          </g>
        )}

        {/* Routes of opportunity. */}
        <MapConnections
          positions={hubPositions}
          delay={reducedMotion ? 0 : 1.1}
          reduced={reducedMotion}
        />

        {/* Country tooltip. */}
        <AnimatePresence>
          {activePoint && activeName && (
            <motion.g
              key={activeId}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              transform={`translate(${activePoint.x} ${activePoint.y})`}
              style={{ transformBox: "fill-box", transformOrigin: "center", pointerEvents: "none" }}
            >
              <rect
                x={-38}
                y={-34}
                width={76}
                height={22}
                rx={11}
                fill="var(--material-thick)"
                stroke="var(--material-hairline-strong)"
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
    </figure>
  );
}
