"use client";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import type { MapGeometry } from "@/lib/map-geo";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/cn";

interface AseanCountryProps {
  geometry: MapGeometry;
  /** Reveal delay index, so countries fade in one by one. */
  index: number;
  /** Used as the stable DOM id so click-to-zoom can target it later. */
  idPrefix: string;
  /** True while this country is hovered or focused. */
  isActive: boolean;
  onActivate: (id: string | null) => void;
  /** Fired on click / Enter / Space with the ISO-2 code. */
  onSelect?: (code: string) => void;
  /** Reduced-motion flag: skips the staggered rise. */
  reducedMotion: boolean;
}

/**
 * A single country shape. ASEAN members are gold-tinted and interactive;
 * neighbours are dimmed, inert decoration.
 *
 * Interaction is animating `transform`/`opacity` only — the lift is a
 * `translateY` on the path group, never a layout property.
 */
export function AseanCountry({
  geometry,
  index,
  idPrefix,
  isActive,
  onActivate,
  onSelect,
  reducedMotion,
}: AseanCountryProps): ReactElement | null {
  if (!geometry.path) return null;

  const { id, key, isAsean, name, code } = geometry;
  const domId = `${idPrefix}-country-${code ?? key}`;

  /* Non-member neighbours: static, dim, non-interactive. */
  if (!isAsean) {
    return (
      <path
        id={domId}
        d={geometry.path}
        className="fill-night-700/55"
        stroke="var(--material-hairline)"
        strokeWidth={0.5}
        vectorEffect="non-scaling-stroke"
        aria-hidden="true"
        pointerEvents="none"
      />
    );
  }

  return (
    <motion.g
      id={domId}
      data-country={code}
      role="button"
      tabIndex={0}
      aria-label={`${name}, ASEAN member state`}
      /* The gold stroke + glow already signal focus; the default outline
         would draw a hard rectangle around the country's bounding box. */
      className="focus-visible:outline-none"
      onMouseEnter={() => onActivate(id)}
      onMouseLeave={() => onActivate(null)}
      onFocus={() => onActivate(id)}
      onBlur={() => onActivate(null)}
      onClick={() => {
        if (code) onSelect?.(code);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && code) {
          e.preventDefault();
          onSelect?.(code);
        }
      }}
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
      animate={
        reducedMotion
          ? { opacity: 1, scale: 1, transition: { duration: 0.12, delay: index * 0.02 } }
          : {
              opacity: 1,
              scale: 1,
              transition: { ...SPRING, delay: 0.15 + index * 0.045 },
            }
      }
      whileHover={reducedMotion ? undefined : { y: -3, scale: 1.03 }}
      whileFocus={reducedMotion ? undefined : { y: -3, scale: 1.03 }}
      style={{ originX: "center", originY: "center", cursor: "pointer" }}
      transition={SPRING}
    >
      <path
        d={geometry.path}
        className={cn(
          "transition-[fill,stroke-opacity] duration-200",
          isActive ? "fill-gold-400/45" : "fill-gold-400/25",
        )}
        stroke="var(--color-gold-400)"
        strokeWidth={isActive ? 1.1 : 0.5}
        strokeOpacity={isActive ? 0.95 : 0.4}
        vectorEffect="non-scaling-stroke"
      />
      {/* Soft glow that fades in on hover/focus. */}
      <path
        d={geometry.path}
        className="pointer-events-none transition-opacity duration-200"
        fill="none"
        stroke="var(--color-gold-400)"
        strokeWidth={2.5}
        strokeOpacity={isActive ? 0.28 : 0}
        vectorEffect="non-scaling-stroke"
        style={{ filter: "blur(2px)" }}
      />
    </motion.g>
  );
}
