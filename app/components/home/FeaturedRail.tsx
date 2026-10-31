"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { ButtonLink } from "@/app/components/ui/Button";
import { OpportunityCard } from "@/app/components/explore/OpportunityCard";
import { featuredOpportunities } from "@/lib/opportunities";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

/**
 * Horizontally scrollable rail of featured opportunities.
 *
 * Uses CSS scroll-snap with native overflow, so touch, trackpad and the arrow
 * keys all work without a carousel library. Cards come from the catalogue; a
 * skeleton row holds the layout while the section scrolls into view.
 */
export function FeaturedRail(): ReactElement {
  const items = useMemo(() => featuredOpportunities(6), []);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  /** Brief skeleton so the row never pops in mid-scroll. */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), reduced ? 0 : 320);
    return () => window.clearTimeout(id);
  }, [reduced]);

  const scrollBy = (direction: 1 | -1): void => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.min(el.clientWidth * 0.8, 420), behavior: "smooth" });
  };

  return (
    <section aria-labelledby="featured">
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div>
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest text-gold-400 uppercase">
            Featured
          </motion.p>
          <motion.h2 id="featured" variants={fadeUp} className="mt-3 text-3xl sm:text-4xl">
            A spread across the region
          </motion.h2>
        </div>
        <motion.div variants={fadeUp}>
          <ButtonLink href="/match" variant="secondary" size="md">
            See your matches
          </ButtonLink>
        </motion.div>
      </motion.div>

      <div className="relative mt-8">
        {/* Arrow controls (pointer only — keyboard users tab through cards). */}
        <div className="absolute -top-14 right-0 hidden items-center gap-2 sm:flex">
          <ScrollButton label="Previous" onClick={() => scrollBy(-1)} flip>
            <path d="M10 3.5 5 8l5 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </ScrollButton>
          <ScrollButton label="Next" onClick={() => scrollBy(1)}>
            <path d="M6 3.5 11 8l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
          </ScrollButton>
        </div>

        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          role="region"
          aria-label="Featured opportunities"
          tabIndex={0}
        >
          {!ready
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : items.map((o) => (
                <div
                  key={o.id}
                  className="w-[19rem] shrink-0 snap-start sm:w-[21rem]"
                >
                  <OpportunityCard opportunity={o} className="h-full" />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function ScrollButton({
  children,
  label,
  onClick,
  flip = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  flip?: boolean;
}): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="glass-thin grid size-9 place-items-center rounded-full text-foreground-muted transition-colors duration-200 hover:text-gold-400"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
        {children}
      </svg>
    </button>
  );
}

function SkeletonCard(): ReactElement {
  return (
    <div
      className="glass shrink-0 snap-start w-[19rem] rounded-3xl p-6 sm:w-[21rem]"
      aria-hidden="true"
    >
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 rounded-full bg-white/10" />
        <div className="h-5 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="h-8 w-28 rounded-full bg-white/5" />
      </div>
    </div>
  );
}