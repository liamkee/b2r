"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { EASE } from "@/lib/motion";

/** Staged progress copy, advanced on a timer while the request runs. */
const STAGES = [
  "Understanding your startup...",
  "Searching opportunities...",
  "Writing explanations...",
] as const;

const STAGE_MS = 520;

/**
 * Loading state for the match request: skeleton cards plus a staged progress
 * line, both announced via `aria-live` so screen-reader users know work is
 * happening.
 */
export function MatchLoading(): ReactElement {
  const [stage, setStage] = useState(0);
  const reduced = useReducedMotion();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setStage((s) => Math.min(s + 1, STAGES.length - 1));
    }, reduced ? 1 : STAGE_MS);
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [reduced]);

  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      {/* Staged progress */}
      <div className="glass rounded-3xl p-6">
        <ol className="space-y-3">
          {STAGES.map((label, i) => {
            const done = i < stage;
            const current = i === stage;
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
                <span
                  className={
                    done
                      ? "text-success"
                      : current
                        ? "text-gold-400"
                        : "text-foreground-subtle"
                  }
                  aria-hidden="true"
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 16 16">
                      <path d="M3.5 8.4l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : current ? (
                    <span className="block size-3.5 animate-spin rounded-full border-2 border-gold-400/30 border-t-gold-400" />
                  ) : (
                    <span className="block size-3.5 rounded-full border border-hairline" />
                  )}
                </span>
                <span
                  className={
                    done
                      ? "text-foreground-muted"
                      : current
                        ? "font-medium text-foreground"
                        : "text-foreground-subtle"
                  }
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={i}
            className="glass-thin rounded-2xl p-5"
            initial={reduced ? { opacity: 1 } : { opacity: 0.4 }}
            animate={reduced ? { opacity: 1 } : { opacity: [0.4, 0.75, 0.4] }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 1.6, repeat: Infinity, ease: EASE.inOut, delay: i * 0.15 }
            }
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="h-4 w-20 rounded-full bg-white/10" />
                <div className="h-4 w-16 rounded-full bg-white/10" />
              </div>
              <div className="h-4 w-3/5 rounded bg-white/10" />
              <div className="h-3 w-full rounded bg-white/5" />
              <div className="h-3 w-4/5 rounded bg-white/5" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface MatchErrorProps {
  message: string;
  onRetry: () => void;
}

/** Error state with a retry action. Announced politely. */
export function MatchErrorState({ message, onRetry }: MatchErrorProps): ReactElement {
  return (
    <div
      className="glass rounded-3xl border-error/30 p-6 text-center"
      role="alert"
    >
      <p className="text-sm font-semibold tracking-widest text-error uppercase">
        Something went wrong
      </p>
      <p className="mx-auto mt-3 max-w-md text-foreground-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-full bg-gold-400 px-5 py-3 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gold-300"
      >
        Try again
      </button>
    </div>
  );
}

/** Empty state before the first search. */
export function MatchEmpty(): ReactElement {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-8 text-center"
    >
      <p className="text-base font-medium text-foreground">
        Tell us about your startup to begin
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm text-foreground-muted">
        The more specific you are — sector, stage, home market and where you
        want to expand — the sharper the matches.
      </p>
    </motion.div>
  );
}

/** Wrapper that fades results in and announces them. */
export function ResultsAnnouncer({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}): ReactElement {
  return (
    <div aria-live="polite">
      <p className="sr-only">
        {count} {count === 1 ? "opportunity" : "opportunities"} found.
      </p>
      <AnimatePresence mode="wait">
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE.out }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}