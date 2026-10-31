"use client";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { ButtonLink } from "@/app/components/ui/Button";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

/** A worked example, clearly labelled as a sample. */
const ROADMAP = [
  {
    step: "Validate the Indonesia entry",
    detail: "Confirm the OJK sandbox route applies before committing to a licence.",
    chip: "Market entry",
  },
  {
    step: "Line up local capital",
    detail: "Approach an Indonesian fintech fund alongside your existing lead.",
    chip: "Investor",
  },
  {
    step: "Set up the local entity",
    detail: "Use the investment facilitation window to register and invoice.",
    chip: "Market entry",
  },
  {
    step: "Ship with a distribution partner",
    detail: "Partner with a telco or bank for reach you cannot buy alone.",
    chip: "Partner",
  },
] as const;

/**
 * Sample founder roadmap: "Malaysian fintech to Indonesia".
 *
 * Deliberately marked SAMPLE — this is an illustration of the output shape, not
 * a real recommendation.
 */
export function SampleRoadmap(): ReactElement {
  return (
    <section aria-labelledby="sample-roadmap">
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="max-w-2xl">
          <motion.p variants={fadeUp} className="flex items-center gap-2 text-xs font-semibold tracking-widest text-gold-400 uppercase">
            Example roadmap
            <span className="rounded-full border border-gold-400/40 bg-gold-400/10 px-2 py-0.5 text-[0.65rem] font-bold tracking-wider text-gold-300">
              SAMPLE
            </span>
          </motion.p>
          <motion.h2 id="sample-roadmap" variants={fadeUp} className="mt-3 text-3xl sm:text-4xl">
            Malaysian fintech to Indonesia
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-3 text-foreground-muted">
            What a short plan looks like once the AI has matched a founder to
            opportunities across one target market.
          </motion.p>
        </div>
        <motion.div variants={fadeUp}>
          <ButtonLink href="/match" variant="secondary" size="md">
            Try with your startup
          </ButtonLink>
        </motion.div>
      </motion.div>

      <motion.ol
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="relative mt-10 space-y-4 pl-6 sm:pl-8"
      >
        {/* The timeline spine. */}
        <span
          className="absolute top-2 bottom-2 left-[0.4rem] w-px bg-gradient-to-b from-gold-400/60 via-gold-400/25 to-transparent sm:left-[0.65rem]"
          aria-hidden="true"
        />
        {ROADMAP.map((item, i) => (
          <motion.li key={item.step} variants={fadeUp} className="relative">
            <span
              className="absolute top-6 -left-6 grid size-3 place-items-center rounded-full bg-gold-400 ring-4 ring-night-950 sm:-left-8"
              aria-hidden="true"
            />
            <GlassCard className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold tracking-widest text-foreground-subtle">
                  STEP {i + 1}
                </span>
                <span className="rounded-full border border-hairline px-2 py-0.5 text-[0.68rem] font-medium text-foreground-muted">
                  {item.chip}
                </span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-foreground">{item.step}</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted">{item.detail}</p>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}