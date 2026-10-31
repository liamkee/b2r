"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import type { ReactElement } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { SPRING, SPRING_SOFT, fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

/** Scattered sources, as you would find them today without ASEAN ONE. */
const SOURCES = [
  "Agency site",
  "PDF circular",
  "News article",
  "Facebook post",
  "Grant portal",
  "Bank advisory",
  "Consultancy blog",
  "Forum thread",
  "Spreadsheet",
  "Deck from a friend",
] as const;

/** Deterministic scatter positions so the layout is stable across renders. */
const SCATTER = [
  { x: -92, y: -58, r: -8 },
  { x: 66, y: -70, r: 6 },
  { x: -70, y: 44, r: 5 },
  { x: 88, y: 34, r: -6 },
  { x: -18, y: -84, r: 3 },
  { x: 22, y: 74, r: -4 },
  { x: -104, y: 8, r: 7 },
  { x: 108, y: -14, r: -5 },
  { x: -34, y: 88, r: 4 },
  { x: 44, y: -30, r: -3 },
] as const;

/**
 * "Scattered across dozens of sites" → one ordered stack.
 *
 * The chips start jittered and rotated, then settle into a tidy column as the
 * section scrolls into view. Only `transform` and `opacity` animate, so the
 * whole thing stays on the compositor.
 */
export function ProblemToSolution(): ReactElement {
  const reduced = useReducedMotion();

  const chips = useMemo(
    () =>
      SOURCES.map((label, i) => ({
        label,
        ...SCATTER[i % SCATTER.length],
      })),
    [],
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
      {/* Left: the chaos, settling into order */}
      <GlassCard className="relative overflow-hidden p-6 sm:p-8">
        <div className="relative mx-auto h-[22rem] w-full max-w-md">
          {chips.map((chip, i) => (
            <motion.span
              key={chip.label}
              className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full border border-hairline bg-white/[0.04] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-foreground-muted"
              initial={
                reduced
                  ? { opacity: 0 }
                  : { x: chip.x, y: chip.y, rotate: chip.r, opacity: 0.85 }
              }
              whileInView={
                reduced
                  ? { opacity: 1 }
                  : {
                      /* Settle into a tidy stack: centred, evenly spaced. */
                      x: 0,
                      y: (i - (chips.length - 1) / 2) * 34,
                      rotate: 0,
                      opacity: 1,
                      transition: { ...SPRING_SOFT, delay: i * 0.05 },
                    }
              }
              viewport={{ once: true, amount: 0.4 }}
              transition={SPRING}
            >
              <span className="size-1.5 rounded-full bg-error/70" aria-hidden="true" />
              {chip.label}
            </motion.span>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-foreground-subtle">
          Today: the same answer, scattered across dozens of sites.
        </p>
      </GlassCard>

      {/* Right: the promise */}
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="flex flex-col gap-5"
      >
        <motion.p
          variants={fadeUp}
          className="text-xs font-semibold tracking-widest text-gold-400 uppercase"
        >
          The problem
        </motion.p>
        <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl">
          Fragmented answers, <span className="text-gradient-gold">one place to look.</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg leading-relaxed text-foreground-muted">
          Regulation, demand signals and competitors are spread across government
          portals, PDFs and news. Finding the right grant, investor or partner
          for a specific country takes weeks of reading.
        </motion.p>
        <motion.div variants={fadeUp}>
          <GlassCard className="p-6">
            <p className="text-sm font-semibold text-foreground">
              ASEAN ONE puts it in one answer
            </p>
            <ul className="mt-3 space-y-2 text-sm text-foreground-muted">
              <li className="flex gap-2">
                <span className="text-gold-400" aria-hidden="true">—</span>
                Grouped by country, so you can compare markets side by side.
              </li>
              <li className="flex gap-2">
                <span className="text-gold-400" aria-hidden="true">—</span>
                Research summaries show their sources, dates and verification limits.
              </li>
              <li className="flex gap-2">
                <span className="text-gold-400" aria-hidden="true">—</span>
                Evidence comparisons with clear gaps and proposed validation tests.
              </li>
            </ul>
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}
