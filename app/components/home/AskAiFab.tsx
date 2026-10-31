"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { SPRING } from "@/lib/motion";

/**
 * Persistent "Ask AI" shortcut.
 *
 * Appears once the reader has scrolled past the hero, then scrolls back to the
 * hero's input and focuses it. Hidden on /match, where the input is already the
 * whole page.
 */
export function AskAiFab(): ReactElement {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = (): void => setVisible(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClick = (): void => {
    const input =
      document.getElementById("ai-input") ??
      document.querySelector<HTMLTextAreaElement>("#hero-ai textarea");
    const anchor = document.getElementById("hero-ai");
    anchor?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "center",
    });
    /* Focus after the scroll settles so the mobile keyboard does not fight it. */
    window.setTimeout(() => input?.focus(), reduced ? 0 : 420);
  };

  const show = visible && pathname !== "/match";

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.9 }}
          transition={SPRING}
          whileHover={reduced ? undefined : { scale: 1.04 }}
          whileTap={reduced ? undefined : { scale: 0.96 }}
          className="glass-thick fixed right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-foreground shadow-xl transition-colors duration-200 hover:text-gold-400 md:right-6"
          style={{
            /* Clear the floating mobile tab bar and the home indicator. */
            bottom: "calc(1rem + var(--tabbar-height) + var(--safe-bottom))",
          }}
          aria-label="Ask AI — go to the startup description box"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M10 2.5l1.9 4.1 4.1.6-3 3 .7 4.3L10 12.5 6.3 14.5l.7-4.3-3-3 4.1-.6L10 2.5z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          Ask AI
        </motion.button>
      )}
    </AnimatePresence>
  );
}