"use client";
import { motion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

interface Capability {
  title: string;
  body: string;
  icon: ReactNode;
}

/**
 * The four things the AI covers. These mirror the Focus chips on the input,
 * so what is advertised here is exactly what /match can produce.
 */
const CAPABILITIES: readonly Capability[] = [
  {
    title: "Opportunity matching",
    body: "Investors, grants, accelerators and partners ranked for your stage and sector.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Government regulations",
    body: "Licensing, ownership and data rules per market, each with an official source.",
    icon: (
      <>
        <path d="M12 3.5 4.5 7v5.5c0 4.2 3 7.4 7.5 8.5 4.5-1.1 7.5-4.3 7.5-8.5V7L12 3.5z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
  },
  {
    title: "Market demand",
    body: "Size, adoption and payment behaviour, drawn from public statistics.",
    icon: (
      <>
        <path d="M4 19h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6.5 19v-5M11 19V9M15.5 19v-7M20 19V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
  {
    title: "Competitor analysis",
    body: "Who you are up against in each market, and where the defensible wedge is.",
    icon: (
      <>
        <circle cx="8.5" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <circle cx="16" cy="14.5" r="3.2" stroke="currentColor" strokeWidth="1.7" fill="none" />
        <path d="M3.5 20c0-3 2.2-5 5-5M20.5 22c0-2.6-2-4.5-4.5-4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </>
    ),
  },
] as const;

/** What the AI can do — four cards, matching the /match focus options. */
export function AiCapabilities(): ReactElement {
  return (
    <section aria-labelledby="ai-capabilities">
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mx-auto max-w-2xl text-center"
      >
        <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
          What the AI can do
        </motion.p>
        <motion.h2 id="ai-capabilities" variants={fadeUp} className="mt-3 text-3xl sm:text-4xl">
          Four angles on every market
        </motion.h2>
      </motion.div>

      <motion.ul
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {CAPABILITIES.map((c) => (
          <motion.li key={c.title} variants={fadeUp}>
            <GlassCard interactive className="flex h-full flex-col gap-3 p-5">
              <span className="grid size-11 place-items-center rounded-2xl bg-gold-400/12 text-gold-400">
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  {c.icon}
                </svg>
              </span>
              <h3 className="text-base font-semibold text-foreground">{c.title}</h3>
              <p className="text-sm leading-relaxed text-foreground-muted">{c.body}</p>
            </GlassCard>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}