"use client";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import type { Insight } from "@/lib/api";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

/** Icon per insight focus. */
const ICONS: Record<string, ReactElement> = {
  regulation: (
    <>
      <path d="M12 3.5 4.5 7v5.5c0 4.2 3 7.4 7.5 8.5 4.5-1.1 7.5-4.3 7.5-8.5V7L12 3.5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),
  market: (
    <>
      <path d="M4 19h16M6.5 19v-5M11 19V9M15.5 19v-7M20 19V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  competitors: (
    <>
      <circle cx="8.5" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <circle cx="16" cy="14.5" r="3.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
      <path d="M3.5 20c0-3 2.2-5 5-5M20.5 22c0-2.6-2-4.5-4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
};

/**
 * AI insight sections for the selected focus areas.
 *
 * Each carries the "verify with official sources" note — these are generated
 * overviews, not legal or investment advice.
 */
export function InsightSections({ insights }: { insights: Insight[] }): ReactElement | null {
  if (insights.length === 0) return null;

  return (
    <motion.div
      variants={staggerList}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="space-y-4"
    >
      <motion.h2 variants={fadeUp} className="text-2xl">
        Deeper context
      </motion.h2>
      {insights.map((insight) => (
        <motion.div key={insight.focus} variants={fadeUp}>
          <GlassCard className="p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold-400/12 text-gold-400">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  {ICONS[insight.focus]}
                </svg>
              </span>
              <h3 className="text-lg font-semibold text-foreground">{insight.title}</h3>
            </div>

            <p className="mt-4 leading-relaxed text-foreground-muted">{insight.summary}</p>

            <ul className="mt-4 space-y-2.5">
              {insight.points.map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-relaxed text-foreground-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-400" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <p className="mt-5 rounded-xl border border-hairline bg-white/[0.03] px-3.5 py-2.5 text-xs text-foreground-subtle">
              AI-generated overview, verify with official sources.
            </p>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  );
}