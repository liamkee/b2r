"use client";
import { motion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

interface Point {
  title: string;
  body: ReactNode;
  icon: ReactNode;
}

/**
 * Trust section. Claims are deliberately modest and checkable — no accuracy
 * percentages we cannot substantiate.
 */
const POINTS: readonly Point[] = [
  {
    title: "Traceable evidence",
    body: (
      <>
        Research findings link to their source records and show editorial dates
        and access limitations. An editorial review date does not establish
        current legal clearance.
      </>
    ),
    icon: (
      <>
        <path d="M12 3.5 4.5 7v5.5c0 4.2 3 7.4 7.5 8.5 4.5-1.1 7.5-4.3 7.5-8.5V7L12 3.5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  {
    title: "Evidence first, optional AI",
    body: (
      <>
        Local keyword retrieval works without a model key. Optional model
        analysis requires server configuration and usage controls; results
        identify evidence-only mode and uncertainty.
      </>
    ),
    icon: (
      <>
        <path d="M12 3.5v17M3.5 12h17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" fill="none" />
      </>
    ),
  },
  {
    title: "Clear data handling",
    body: (
      <>
        Submitted answers are processed by the server and, when enabled, the
        model provider. Saved drafts remain in this browser; clear them on a
        shared device. The research endpoint does not save business profiles.
      </>
    ),
    icon: (
      <>
        <rect x="4.5" y="10" width="15" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinecap="round" />
      </>
    ),
  },
] as const;

/** Three trust points, kept factual. */
export function TrustSection(): ReactElement {
  return (
    <section aria-labelledby="trust">
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
          How we work
        </motion.p>
        <motion.h2 id="trust" variants={fadeUp} className="mt-3 text-3xl sm:text-4xl">
          Built to be checked
        </motion.h2>
      </motion.div>

      <motion.ul
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mt-10 grid gap-4 md:grid-cols-3"
      >
        {POINTS.map((p) => (
          <motion.li key={p.title} variants={fadeUp}>
            <GlassCard className="flex h-full flex-col gap-3 p-6">
              <span className="grid size-11 place-items-center rounded-2xl bg-white/[0.06] text-foreground">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  {p.icon}
                </svg>
              </span>
              <h3 className="text-base font-semibold text-foreground">{p.title}</h3>
              <p className="text-sm leading-relaxed text-foreground-muted">{p.body}</p>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
