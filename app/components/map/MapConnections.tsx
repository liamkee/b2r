import type { ReactElement } from "react";
import { HUB_LINKS, HUBS } from "@/lib/map-hubs";
import type { Hub, HubPoint } from "@/lib/map-hubs";

interface MapConnectionsProps {
  /** Hub id → projected point. */
  positions: Map<string, HubPoint>;
  /** Delay (s) before the arcs begin drawing, after the countries reveal. */
  delay: number;
  /** Drop every other arc and slow the pulse on small/heavy viewports. */
  reduced: boolean;
}

/** Builds a curved path between two points, bowing perpendicular to the line. */
function arcPath(from: HubPoint, to: HubPoint): string {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  /* Bow proportional to distance, so long hops arc more gracefully. */
  const bow = distance * 0.18;
  /* Perpendicular unit vector. */
  const nx = distance === 0 ? 0 : -dy / distance;
  const ny = distance === 0 ? 0 : dx / distance;
  const cx = mx + nx * bow;
  const cy = my + ny * bow;
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

/**
 * The "routes of opportunity": pulsing hub markers joined by animated dashed
 * arcs. Arcs animate `stroke-dashoffset` (compositor-friendly) rather than
 * redrawing geometry.
 */
export function MapConnections({
  positions,
  delay,
  reduced,
}: MapConnectionsProps): ReactElement {
  const links = reduced ? HUB_LINKS.slice(0, 4) : HUB_LINKS;
  const hubs: readonly Hub[] = reduced ? HUBS.slice(0, 4) : HUBS;

  return (
    <>
      <style>{`
        @keyframes asean-arc-flow {
          from { stroke-dashoffset: 26; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes asean-arc-draw {
          from { stroke-dashoffset: 1; opacity: 0; }
          to   { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes asean-hub-pulse {
          0%   { transform: scale(0.6); opacity: 0.55; }
          70%  { transform: scale(2.1); opacity: 0; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .asean-arc-flow, .asean-hub-pulse { animation: none !important; }
        }
      `}</style>

      {/* Arcs sit under the markers. */}
      <g className="pointer-events-none">
        {links.map(([fromId, toId], i) => {
          const from = positions.get(fromId);
          const to = positions.get(toId);
          if (!from || !to) return null;
          const d = arcPath(from, to);
          return (
            <g key={`${fromId}-${toId}`}>
              {/* Faint base line so the route reads even before it animates. */}
              <path
                d={d}
                fill="none"
                stroke="var(--color-ocean-400)"
                strokeWidth={1}
                strokeOpacity={0.12}
                vectorEffect="non-scaling-stroke"
              />
              {/* Drawn-in arc, then a flowing dash on top. */}
              <path
                className="asean-arc-flow"
                d={d}
                fill="none"
                stroke="var(--color-gold-400)"
                strokeWidth={1.1}
                strokeLinecap="round"
                strokeDasharray="4 22"
                strokeOpacity={0.5}
                vectorEffect="non-scaling-stroke"
                style={{
                  animation: `asean-arc-flow ${5 + i * 0.6}s linear ${
                    delay + i * 0.12
                  }s infinite`,
                  willChange: "stroke-dashoffset",
                }}
              />
            </g>
          );
        })}
      </g>

      {/* Hub markers. */}
      <g>
        {hubs.map((hub, i) => {
          const p = positions.get(hub.id);
          if (!p) return null;
          const isCore = hub.ring === "core";
          return (
            <g key={hub.id} transform={`translate(${p.x} ${p.y})`}>
              {/* Pulsing halo. */}
              <circle
                className="asean-hub-pulse"
                r={isCore ? 6 : 5}
                fill="var(--color-gold-400)"
                style={{
                  transformOrigin: "center",
                  transformBox: "fill-box",
                  animation: `asean-hub-pulse ${isCore ? 3.2 : 3.8}s ease-out ${
                    delay * 0.6 + i * 0.35
                  }s infinite`,
                  willChange: "transform, opacity",
                }}
              />
              {/* Solid core. */}
              <circle
                r={isCore ? 3.4 : 2.8}
                fill="var(--color-gold-400)"
                stroke="var(--color-night-950)"
                strokeWidth={1}
              />
              <circle r={isCore ? 1.4 : 1.1} fill="var(--color-gold-200)" />
              <title>{`${hub.city}, ${hub.country}`}</title>
            </g>
          );
        })}
      </g>
    </>
  );
}
