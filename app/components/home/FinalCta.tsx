"use client";
import { motion } from "framer-motion";
import type { ReactElement } from "react";
import { Button, ButtonLink } from "@/app/components/ui/Button";
import { GlassCard } from "@/app/components/ui/GlassCard";
import { fadeUp, staggerList, VIEWPORT } from "@/lib/motion";

/**
 * Closing call to action: primary route into /match, secondary back to the map.
 *
 * The secondary uses a plain anchor so the browser handles the smooth scroll to
 * the hero's map anchor.
 */
export function FinalCta(): ReactElement {
  return (
    <section aria-labelledby="final-cta">
      <motion.div
        variants={staggerList}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
      >
        <GlassCard className="relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
          {/* Soft gold bloom behind the copy. */}
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(ellipse 60% 70% at 50% 0%, rgb(255 183 0 / 0.14), transparent 65%)",
            }}
          />
          <motion.p
            variants={fadeUp}
            className="relative text-xs font-semibold tracking-widest text-gold-400 uppercase"
          >
            Ready when you are
          </motion.p>
          <motion.h2
            variants={fadeUp}
            id="final-cta"
            className="relative mx-auto mt-4 max-w-2xl text-3xl sm:text-5xl"
          >
            Describe your startup once.
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="relative mx-auto mt-4 max-w-xl text-lg text-foreground-muted"
          >
            Review regulation, market signals and competitor evidence, with
            gaps and next checks — grouped by your selected countries.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <ButtonLink href="/match" size="lg">
              Find my matches
            </ButtonLink>
            <ScrollToMapButton />
          </motion.div>
        </GlassCard>
      </motion.div>
    </section>
  );
}

/** Secondary action: scroll back up to the hero map without a page change. */
function ScrollToMapButton(): ReactElement {
  const onClick = (): void => {
    const target = document.getElementById("hero-map");
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <Button variant="ghost" size="lg" onClick={onClick}>
      Back to the map ↑
    </Button>
  );
}
