"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import { Chip } from "@/app/components/ui/Chip";
import { useSaved } from "@/app/components/providers/SavedProvider";
import { cn } from "@/lib/cn";
import { categoryLabel } from "@/lib/opportunities";
import type { Opportunity } from "@/lib/opportunities";
import { metaName } from "@/lib/country-meta";
import { SPRING } from "@/lib/motion";

interface OpportunityCardProps {
  opportunity: Opportunity;
  /** Optional relevance score (0–100) shown as a ring, used on /match. */
  score?: number;
  /** Optional "why it matches" line, used on /match. */
  reason?: string;
  /** Renders as a list item when inside a <ul>. */
  as?: "div" | "li" | "article";
  className?: string;
  /** Extra actions rendered alongside the source link and save button. */
  footer?: ReactNode;
}

/** Colour per category, so badges read distinctly without extra contrast work. */
const TYPE_TONE: Record<string, string> = {
  investor: "text-ocean-300 border-ocean-400/40 bg-ocean-500/15",
  accelerator: "text-gold-300 border-gold-400/40 bg-gold-400/15",
  partner: "text-success border-success/40 bg-success/15",
  market: "text-foreground border-white/25 bg-white/10",
  funding: "text-gold-200 border-gold-300/40 bg-gold-400/12",
  talent: "text-foreground-muted border-white/20 bg-white/5",
};

/**
 * One opportunity. Used in the home explorer, the featured rail and the match
 * results, so the badge, verified tick and save button stay identical.
 */
export function OpportunityCard({
  opportunity,
  score,
  reason,
  as = "div",
  className,
  footer,
}: OpportunityCardProps): ReactElement {
  const reduced = useReducedMotion();
  const { isSaved, toggle } = useSaved();
  const saved = isSaved(opportunity.id);

  const Component = motion[as];

  return (
    <Component
      layout={!reduced}
      className={cn(
        "glass-thin rounded-2xl p-4 transition-colors duration-200 hover:border-white/20",
        className,
      )}
      {...(reduced ? {} : { transition: SPRING })}
    >
      <div className="flex items-start gap-3">
        {score !== undefined && <ScoreRing score={score} />}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold tracking-wide uppercase",
                TYPE_TONE[opportunity.type] ?? TYPE_TONE.market,
              )}
            >
              {categoryLabel(opportunity.type)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-hairline px-2 py-0.5 text-[0.68rem] font-medium text-foreground-subtle">
              <span className="size-1.5 rounded-full bg-gold-400" aria-hidden="true" />
              {metaName(opportunity.country)}
            </span>
            <CatalogueLabel />
          </div>

          <h3 className="mt-2 text-base leading-snug font-semibold text-foreground">
            {opportunity.name}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground-muted">
            {opportunity.blurb}
          </p>

          {reason && (
            <p className="mt-2.5 rounded-xl border border-gold-400/20 bg-gold-400/[0.07] px-3 py-2 text-sm leading-relaxed text-gold-100/90">
              <span className="font-semibold text-gold-300">Why it matches: </span>
              {reason}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-subtle">
            <span>{opportunity.amount}</span>
            <span aria-hidden="true">·</span>
            <span>{opportunity.stage}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={opportunity.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-hairline px-3 py-1.5 text-xs font-medium text-foreground-muted transition-colors duration-200 hover:border-gold-400/50 hover:text-gold-400"
            >
              Visit {opportunity.sourceName} ↗
            </a>
            <SaveButton saved={saved} onToggle={() => toggle(opportunity.id)} />
            {footer}
          </div>
        </div>
      </div>
    </Component>
  );
}

function CatalogueLabel(): ReactElement {
  return (
    <span
      className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-foreground-muted"
      title="Illustrative catalogue entry; verify availability and terms with the linked source"
    >
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.18" />
        <path
          d="M8 7.2v4M8 4.6v.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Demo listing
    </span>
  );
}

/** Small circular score indicator used on match results. */
function ScoreRing({ score }: { score: number }): ReactElement {
  const reduced = useReducedMotion();
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div className="relative shrink-0" aria-label={`Match score ${pct} out of 100`}>
      <svg width="40" height="40" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--material-hairline)" strokeWidth="3" />
        <motion.circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="var(--color-gold-400)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduced ? { strokeDashoffset: c * (1 - pct / 100) } : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={reduced ? { duration: 0 } : { duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[0.7rem] font-bold text-foreground">
        {pct}
      </span>
    </div>
  );
}

function SaveButton({
  saved,
  onToggle,
}: {
  saved: boolean;
  onToggle: () => void;
}): ReactElement {
  return (
    <Chip
      active={saved}
      onClick={onToggle}
      showCheck={false}
      ariaLabel={saved ? "Remove from saved" : "Save opportunity"}
      className="px-3 py-1.5 text-xs"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M4 2.5h8a1 1 0 0 1 1 1V14l-5-3-5 3V3.5a1 1 0 0 1 1-1z"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {saved ? "Saved" : "Save"}
    </Chip>
  );
}
