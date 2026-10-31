"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useMemo } from "react";
import type { ReactElement } from "react";
import { Chip, ChipRow } from "@/app/components/ui/Chip";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { OpportunityCard } from "./OpportunityCard";
import {
  CATEGORIES,
  categoryCounts,
  globalCategoryCounts,
  opportunitiesFor,
} from "@/lib/opportunities";
import type { OpportunityType } from "@/lib/opportunities";
import { COUNTRY_META } from "@/lib/country-meta";
import { SPRING_SOFT, staggerList } from "@/lib/motion";

export type TypeFilter = OpportunityType | "all";

interface ExploreSectionProps {
  /** Selected ISO-2 code, or null for ASEAN-wide. */
  country: string | null;
  /** Active category filter. */
  type: TypeFilter;
  /** Called when either changes; the parent syncs the URL. */
  onChange: (next: { country: string | null; type: TypeFilter }) => void;
}

/**
 * "Explore the ecosystem": the map's companion panel.
 *
 * Desktop shows a sticky side panel next to the map; mobile shows a bottom
 * sheet. Both render the same content here, so there is one source of truth
 * for counts, filters and cards.
 */
export function ExploreSection({
  country,
  type,
  onChange,
}: ExploreSectionProps): ReactElement {
  const reduced = useReducedMotion();

  const counts = useMemo(
    () => (country ? categoryCounts(country) : globalCategoryCounts()),
    [country],
  );

  const cards = useMemo(() => {
    if (!country) return [];
    return opportunitiesFor(country, type);
  }, [country, type]);

  const total = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts],
  );

  const selectType = useCallback(
    (next: TypeFilter) => onChange({ country, type: next }),
    [country, onChange],
  );

  const clear = useCallback(() => onChange({ country: null, type }), [type, onChange]);

  const meta = country ? COUNTRY_META[country] : undefined;
  const countryLabel = meta?.name ?? country ?? "this market";

  return (
    <GlassCard className="flex h-full flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
            {country ? "Selected market" : "ASEAN-wide"}
          </p>
          <h2 className="mt-1.5 text-2xl">
            {country ? countryLabel : "All eleven member states"}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {total} {total === 1 ? "illustrative listing" : "illustrative listings"}
            {country ? ` in ${countryLabel}` : " across the region"}
          </p>
        </div>
        {country && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-subtle transition-colors duration-200 hover:text-gold-400"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category filters. Chips with zero matches stay visible but dim, so the
          shape of each market is readable at a glance. */}
      <ChipRow ariaLabel="Filter by category">
        <Chip
          active={type === "all"}
          onClick={() => selectType("all")}
          showCheck={false}
        >
          All
          <span className="ml-1 text-xs text-foreground-subtle">{total}</span>
        </Chip>
        {CATEGORIES.map((c) => {
          const n = counts[c.id];
          return (
            <Chip
              key={c.id}
              active={type === c.id}
              disabled={n === 0}
              onClick={() => selectType(c.id)}
              ariaLabel={`${c.label}${n === 0 ? ", no matches" : `, ${n} matches`}`}
            >
              {c.label}
              <span className="ml-1 text-xs text-foreground-subtle">{n}</span>
            </Chip>
          );
        })}
      </ChipRow>

      {/* Cards */}
      <div className="min-h-0 flex-1">
        {!country ? (
          <EmptyPrompt />
        ) : cards.length === 0 ? (
          <NoMatches onClear={() => selectType("all")} />
        ) : (
          <motion.ul
            layout={!reduced}
            variants={staggerList}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {cards.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} as="li" />
              ))}
            </AnimatePresence>
          </motion.ul>
        )}
      </div>
    </GlassCard>
  );
}

function EmptyPrompt(): ReactElement {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="rounded-2xl border border-dashed border-hairline px-5 py-8 text-center"
    >
      <p className="text-sm font-medium text-foreground">Pick a country on the map</p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-foreground-muted">
        Select a country to browse illustrative programme and partner listings.
        Current availability and eligibility need verification with each source.
      </p>
    </motion.div>
  );
}

function NoMatches({ onClear }: { onClear: () => void }): ReactElement {
  return (
    <div className="rounded-2xl border border-dashed border-hairline px-5 py-8 text-center">
      <p className="text-sm font-medium text-foreground">
        Nothing in this category here yet
      </p>
      <p className="mx-auto mt-2 max-w-xs text-sm text-foreground-muted">
        This market has no entries under this filter.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-4 rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gold-300"
      >
        Show all categories
      </button>
    </div>
  );
}
