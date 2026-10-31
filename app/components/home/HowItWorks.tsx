"use client";
import { motion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

interface Step {
  title: string;
  body: string;
  icon: ReactNode;
}

const STEPS: readonly Step[] = [
  {
    title: "Describe your startup",
    body: "Plain language. Stage, sector, where you are and where you want to go.",
    icon: (
      <>
        <path d="M4 6h16M4 11h11M4 16h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "AI finds ranked matches",
    body: "Investors, grants, accelerators and partners — grouped by country, with the reasoning shown.",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Take action",
    body: "Save what matters, draft outreach, and move your pipeline forward.",
    icon: (
      <>
        <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
] as const;

/** Three steps, each with a simple custom SVG icon. */
export function HowItWorks(): ReactElement {
  return (
    <section aria-labelledby="how-it-works">
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
          How it works
        </motion.p>
        <motion.h2 id="how-it-works" variants={fadeUp} className="mt-3 text-3xl sm:text-4xl">
          Three steps to a shortlist
        </motion.h2>
      </motion.div>

      <motion.ol
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mt-10 grid gap-4 md:grid-cols-3"
      >
        {STEPS.map((step, i) => (
          <motion.li key={step.title} variants={fadeUp}>
            <GlassCard interactive className="flex h-full flex-col gap-3">
              <span className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-400/12 text-gold-400">
                  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                    {step.icon}
                  </svg>
                </span>
                <span className="text-xs font-semibold tracking-widest text-foreground-subtle">
                  STEP {i + 1}
                </span>
              </span>
              <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-foreground-muted">{step.body}</p>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ol>
    </section>
  );
}