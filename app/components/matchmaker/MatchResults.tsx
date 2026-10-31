"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ReactElement } from "react";
import { OpportunityCard } from "@/app/components/explore/OpportunityCard";
import { Button } from "@/app/components/ui/Button";
import { metaName } from "@/lib/country-meta";
import type { CountryMatches } from "@/lib/api";
import { layoutIndicator, staggerList } from "@/lib/motion";

interface MatchResultsProps {
  matches: CountryMatches[];
}

/**
 * Ranked results grouped by country.
 *
 * A tab row switches market (with a shared layout indicator), and each group
 * renders its opportunities ranked by score. Cards animate in with a spring
 * stagger.
 */
export function MatchResults({ matches }: MatchResultsProps): ReactElement {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string>(matches[0]?.country ?? "");

  const total = useMemo(
    () => matches.reduce((n, m) => n + m.opportunities.length, 0),
    [matches],
  );

  const group = matches.find((m) => m.country === active) ?? matches[0];
  if (!group) return <div />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">
          Ranked matches
          <span className="ml-2 text-base font-normal text-foreground-subtle">
            {total} across {matches.length} {matches.length === 1 ? "market" : "markets"}
          </span>
        </h2>
      </div>

      {/* Country tabs */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Markets with matches">
        {matches.map((m) => {
          const isActive = m.country === group.country;
          return (
            <button
              key={m.country}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(m.country)}
              className={
                "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 " +
                (isActive ? "text-gold-400" : "text-foreground-muted hover:text-foreground")
              }
            >
              <span className="relative z-10">
                {m.countryName}
                <span className="ml-1.5 text-xs text-foreground-subtle">
                  {m.opportunities.length}
                </span>
              </span>
              {isActive && (
                <motion.span
                  layoutId="match-tab-pill"
                  className="absolute inset-0 rounded-full bg-gold-400/12"
                  transition={reduced ? { duration: 0 } : layoutIndicator}
                />
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.ul
          key={group.country}
          layout={!reduced}
          variants={staggerList}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {group.opportunities.map((o) => (
            <OpportunityCard
              key={o.id}
              as="li"
              opportunity={o}
              score={o.score}
              reason={o.reason}
              footer={<DraftOutreachButton name={o.name} />}
            />
          ))}
        </motion.ul>
      </AnimatePresence>
    </div>
  );
}

/** UI-only for now: a visible affordance for the outreach step. */
function DraftOutreachButton({ name }: { name: string }): ReactElement {
  const [copied, setCopied] = useState(false);

  const onClick = (): void => {
    /* Placeholder: no email is generated yet, so we just acknowledge. */
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      aria-label={`Draft outreach for ${name}`}
    >
      {copied ? "Drafting soon" : "Draft outreach"}
    </Button>
  );
}

/** Small helper re-exported for the match page's market summary. */
export function marketLabel(code: string): string {
  return metaName(code);
}