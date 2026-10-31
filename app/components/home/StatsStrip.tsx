"use client";
import { motion, useReducedMotion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { CATEGORIES, coveredCountries, totalOpportunities } from "@/lib/opportunities";
import { fadeUp, staggerListTight, VIEWPORT } from "@/lib/motion";

/** The figures shown in the strip, all derived from the catalogue. */
function stats() {
  return [
    { value: totalOpportunities(), label: "Opportunities" },
    { value: coveredCountries(), label: "Countries" },
    { value: CATEGORIES.length, label: "Categories" },
  ];
}

/** Stats strip: counts computed from data, counting up when scrolled into view. */
export function StatsStrip(): ReactElement {
  const items = stats();

  return (
    <motion.ul
      variants={staggerListTight}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="grid gap-4 sm:grid-cols-3"
      aria-label="Catalogue at a glance"
    >
      {items.map((s) => (
        <motion.li key={s.label} variants={fadeUp}>
          <GlassCard className="flex flex-col items-start gap-1 p-6">
            <CountUp to={s.value} className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl" />
            <span className="text-sm text-foreground-muted">{s.label}</span>
          </GlassCard>
        </motion.li>
      ))}
    </motion.ul>
  );
}

interface CountUpProps {
  to: number;
  className?: string;
}

/**
 * Counts from 0 to `to` the first time it enters the viewport. Uses rAF and a
 * ref guard so it never re-runs on scroll-back; reduced motion jumps straight
 * to the final value.
 */
function CountUp({ to, className }: CountUpProps): ReactElement {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  /* With reduced motion the final value is the initial value, so no animation
     effect and no extra render are needed. */
  const [value, setValue] = useState(() => (reduced ? to : 0));

  useEffect(() => {
    if (!inView || reduced) return;
    let frame = 0;
    let start: number | null = null;
    const duration = 900;
    const tick = (ts: number): void => {
      if (start === null) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, reduced]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {value}
    </span>
  );
}