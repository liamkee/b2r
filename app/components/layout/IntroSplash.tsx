"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ReactElement } from "react";
import { EASE } from "@/lib/motion";

const SEEN_KEY = "asean-one:intro-seen";

/* ── sessionStorage as an external store ──────────────────────────── */

/** Subscribers notified when the flag changes (only this component sets it). */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

function emit(): void {
  for (const l of listeners) l();
}

/**
 * Reads the "intro already seen" flag.
 *
 * Goes through `useSyncExternalStore` rather than an effect so SSR and the
 * client agree (the server snapshot is always `false`, and the client re-reads
 * on subscribe) and no state is set from an effect body.
 */
function useIntroSeen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.sessionStorage.getItem(SEEN_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
}

function markSeen(): void {
  try {
    window.sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* Private mode or storage disabled — the intro will simply show again. */
  }
  emit();
}

const noopSubscribe = (): (() => void) => () => {};

/**
 * False during SSR and the first client render, true afterwards.
 *
 * Using `useSyncExternalStore` avoids setting state from an effect just to
 * detect "we are on the client", which keeps hydration clean.
 */
function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

/**
 * Path to the intro video.
 *
 * Drop your file at `public/intro.mp4` (or point this at any public path /
 * remote URL) — nothing else needs changing. The overlay also works when the
 * file is missing: the video errors, and we dismiss after a short beat rather
 * than trapping the user on a blank screen.
 */
const VIDEO_SRC = "/intro.mp4";

interface IntroSplashProps {
  /** Playback length (seconds) used for the fallback timer if the video stalls. */
  maxDuration?: number;
}

/**
 * Full-screen video intro shown once per browser session.
 *
 * Fades out over ~800ms when the video ends, when "Skip intro" is pressed, or
 * when the video fails to load. The flag lives in `sessionStorage` so a reload
 * mid-session does not replay it.
 */
export function IntroSplash({ maxDuration = 12 }: IntroSplashProps): ReactElement | null {
  const seen = useIntroSeen();
  const mounted = useIsClient();
  const reduced = useReducedMotion();
  const [muted, setMuted] = useState(true);
  /** Set once the user skips/finishes, so the overlay stays closed this visit. */
  const [dismissed, setDismissed] = useState(false);
  const finishedRef = useRef(false);

  /* Reduced motion: never autoplay a full-screen video. */
  useEffect(() => {
    if (mounted && reduced && !seen) markSeen();
  }, [mounted, reduced, seen]);

  const visible = mounted && !seen && !dismissed && !reduced;

  /* Lock scroll while the overlay covers the page. */
  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  const dismiss = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setDismissed(true);
    markSeen();
  }, []);

  /* Safety net: never let the intro outstay its welcome if `ended` never fires. */
  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(dismiss, maxDuration * 1000);
    return () => window.clearTimeout(id);
  }, [visible, maxDuration, dismiss]);

  /* Escape also skips. */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 bg-black"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE.out }}
          role="dialog"
          aria-modal="true"
          aria-label="ASEAN ONE intro"
        >
          <video
            className="h-full w-full object-cover"
            src={VIDEO_SRC}
            autoPlay
            muted={muted}
            playsInline
            preload="auto"
            onEnded={dismiss}
            onError={dismiss}
          />

          {/* Bottom scrim so the controls stay legible over any frame. */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent"
            aria-hidden="true"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-5 pb-[calc(1.25rem+var(--safe-bottom))]">
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="glass-thin inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:text-gold-400"
              aria-label={muted ? "Unmute intro video" : "Mute intro video"}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
                {muted ? (
                  <>
                    <path d="M4 8v4h3l4 3.5v-11L7 8H4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M14 8l4 4M18 8l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    <path d="M4 8v4h3l4 3.5v-11L7 8H4z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M13.5 7.5a4 4 0 0 1 0 5M15.5 5.5a7 7 0 0 1 0 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </>
                )}
              </svg>
              {muted ? "Sound off" : "Sound on"}
            </button>

            <button
              type="button"
              onClick={dismiss}
              className="glass-thin inline-flex min-h-11 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:text-gold-400"
            >
              Skip intro
              <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5 4.5l7 5.5-7 5.5z" fill="currentColor" />
                <path d="M14 4.5v11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Brand mark while the video loads. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center pt-[calc(1.5rem+var(--safe-top))]">
            <span className="font-display text-sm font-semibold tracking-[0.3em] text-white/70 uppercase">
              ASEAN ONE
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}