"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { MapPoint } from "@/lib/map-geo";
import { DURATION, EASE, SPRING } from "@/lib/motion";

interface MapSelectionOverlayProps {
  /** Dots inside the selected country, in base map coordinates. */
  dots: MapPoint[];
  /** Ripple origin, in base map coordinates. */
  origin: MapPoint | null;
  /** Large display name, e.g. "Indonesia". */
  name: string;
  /** Opportunity count shown under the name. */
  count: number;
  /** Extra label, e.g. "opportunities". */
  countLabel?: string;
  /** Distance (base coords) the ripple must travel to clear the country. */
  rippleRadius: number;
  /** Changes when a different country is picked, to restart the animation. */
  selectionKey: string;
  /** Rendered width of the map, used to scale type with the container. */
  viewW: number;
  viewH: number;
}

/**
 * The selection flourish: a radial "ignition" ripple that lights the dots in
 * sequence, then the country name in large display type with a count-up line.
 *
 * Everything here animates `transform`, `opacity` or `r` (an SVG attribute
 * that browsers composite) and lives in base map coordinates, so it inherits
 * the camera transform from its parent group and stays aligned while zooming.
 */
export function MapSelectionOverlay({
  dots,
  origin,
  name,
  count,
  countLabel = "opportunities",
  rippleRadius,
  selectionKey,
  viewW,
  viewH,
}: MapSelectionOverlayProps): ReactElement | null {
  const reduced = useReducedMotion();

  if (!origin) return null;

  /* How long the ripple takes to sweep the country. */
  const sweep = reduced ? 0.01 : 1.05;

  return (
    <g style={{ pointerEvents: "none" }} aria-hidden="true">
      {/* Ripple ring — scales out from the click origin. */}
      <motion.circle
        key={`ripple-${selectionKey}`}
        cx={origin.x}
        cy={origin.y}
        fill="none"
        stroke="var(--color-gold-400)"
        strokeWidth={2}
        initial={{ r: 0, opacity: reduced ? 0 : 0.75 }}
        animate={{ r: rippleRadius, opacity: 0 }}
        transition={{ duration: sweep * 1.15, ease: EASE.out }}
      />
      {/* A second, delayed ring gives the wave depth. */}
      {!reduced && (
        <motion.circle
          key={`ripple2-${selectionKey}`}
          cx={origin.x}
          cy={origin.y}
          fill="none"
          stroke="var(--color-gold-300)"
          strokeWidth={1.1}
          initial={{ r: 0, opacity: 0.5 }}
          animate={{ r: rippleRadius * 0.82, opacity: 0 }}
          transition={{ duration: sweep, delay: 0.16, ease: EASE.out }}
        />
      )}

      {/* Opportunity dots, lit in sequence by distance from the origin. */}
      <g>
        {dots.map((d, i) => {
          const dist = Math.hypot(d.x - origin.x, d.y - origin.y);
          const delay = reduced ? 0 : (dist / Math.max(1, rippleRadius)) * sweep * 0.9;
          return (
            <motion.circle
              key={`${selectionKey}-dot-${i}`}
              cx={d.x}
              cy={d.y}
              r={1.5}
              fill="var(--color-gold-300)"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              animate={
                reduced
                  ? { opacity: 0.9, scale: 1, transition: { duration: DURATION.instant, delay: 0 } }
                  : {
                      opacity: [0, 1, 0.85],
                      scale: [0.4, 1.5, 1],
                      transition: {
                        duration: 0.5,
                        delay,
                        ease: EASE.out,
                      },
                    }
              }
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                filter: "drop-shadow(0 0 2.5px rgb(255 215 80 / 0.9))",
              }}
            />
          );
        })}
      </g>

      {/* Display name + count, sitting behind the dots visually. */}
      <CountryTitle
        key={`title-${selectionKey}`}
        origin={origin}
        name={name}
        count={count}
        countLabel={countLabel}
        viewW={viewW}
        viewH={viewH}
        reduced={reduced}
      />
    </g>
  );
}

interface CountryTitleProps {
  origin: MapPoint;
  name: string;
  count: number;
  countLabel: string;
  viewW: number;
  viewH: number;
  reduced: boolean | null;
}

/**
 * Large outlined display type, revealed letter by letter, with a counting-up
 * number beneath. Rendered in map coordinates so it scales with the map.
 */
function CountryTitle({
  origin,
  name,
  count,
  countLabel,
  viewW,
  viewH,
  reduced,
}: CountryTitleProps): ReactElement {
  const shown = useCountUp(count, reduced ? 0 : 0.9);
  /* Type size relative to the viewBox so it holds up at any container size. */
  const fontSize = Math.max(26, Math.min(viewW, viewH) * 0.085);
  const letters = [...name];

  return (
    <g transform={`translate(${origin.x} ${origin.y})`}>
      <text
        textAnchor="middle"
        y={fontSize * 0.32}
        fill="none"
        stroke="var(--color-gold-400)"
        strokeWidth={1.1}
        strokeOpacity={0.62}
        style={{
          fontSize,
          fontWeight: 800,
          letterSpacing: "-0.02em",
        }}
      >
        {letters.map((ch, i) => (
          <motion.tspan
            key={`${ch}-${i}`}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduced
                ? { duration: DURATION.instant, delay: 0 }
                : { ...SPRING, delay: 0.42 + i * 0.035 }
            }
            style={{ display: "inline-block" }}
          >
            {ch === " " ? "\u00A0" : ch}
          </motion.tspan>
        ))}
      </text>

      <motion.text
        textAnchor="middle"
        y={fontSize * 1.12}
        fill="var(--color-foreground)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.base, delay: reduced ? 0 : 0.75 }}
        style={{ fontSize: fontSize * 0.34, fontWeight: 600, letterSpacing: "0.02em" }}
      >
        {shown} {countLabel}
      </motion.text>
    </g>
  );
}

/**
 * Animates an integer from 0 to `target`. Uses rAF so the count is smooth and
 * cheap; under reduced motion it jumps straight to the target.
 */
function useCountUp(target: number, duration: number): number {
  /* With no duration the target is the initial value, so nothing animates. */
  const [value, setValue] = useState(() => (duration === 0 ? target : 0));

  useEffect(() => {
    if (duration === 0) return;
    let frame = 0;
    let start: number | null = null;
    const tick = (ts: number): void => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / (duration * 1000));
      /* Ease-out so the number decelerates into place. */
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}