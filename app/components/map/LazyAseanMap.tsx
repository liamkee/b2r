"use client";
import dynamic from "next/dynamic";

/**
 * The map pulls in d3-geo, topojson-client and the 146 KB topology. Loading it
 * lazily keeps that off the critical path, so the hero and heading paint
 * immediately and the map fades in when its chunk arrives.
 */
const AseanMap = dynamic(() => import("./AseanMap").then((m) => m.AseanMap), {
  ssr: false,
  loading: () => (
    <div
      className="glass-thin relative aspect-[8/7] w-full animate-pulse rounded-3xl"
      aria-hidden="true"
    />
  ),
});

interface LazyAseanMapProps {
  className?: string;
  /** Fired with the ISO-2 code on select, or null to clear. */
  onSelect?: (code: string | null) => void;
  ariaLabel?: string;
  /** Controlled selection, e.g. from the URL. */
  selected?: string | null;
  /** Mobile: coarser dot grid and fewer arcs. */
  compact?: boolean;
}

export function LazyAseanMap({
  className,
  onSelect,
  ariaLabel,
  selected,
  compact,
}: LazyAseanMapProps) {
  return (
    <div className={className}>
      <AseanMap
        onSelect={onSelect}
        ariaLabel={ariaLabel}
        selected={selected}
        compact={compact}
      />
    </div>
  );
}