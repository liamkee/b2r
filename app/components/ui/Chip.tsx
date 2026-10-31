"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";

interface ChipProps {
  children: ReactNode;
  /** Selected/active state. Drives the gold treatment and aria-pressed. */
  active?: boolean;
  onClick?: () => void;
  /** Optional leading marker (e.g. a colour dot). */
  leading?: ReactNode;
  /** Shows a checkmark when active. Defaults to true. */
  showCheck?: boolean;
  className?: string;
  /** Accessible label, when the visible text needs more context. */
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Toggle chip. Used for category filters, AI focus toggles and market
 * selection — one component keeps the pressed physics and gold active state
 * consistent everywhere.
 *
 * Exposes `aria-pressed` so screen readers announce the toggle state.
 */
export function Chip({
  children,
  active = false,
  onClick,
  leading,
  showCheck = true,
  className,
  ariaLabel,
  disabled = false,
}: ChipProps): ReactElement {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={ariaLabel}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      transition={SPRING}
      className={cn(
        "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
        active
          ? "border-gold-400/60 bg-gold-400/15 text-gold-300"
          : "border-hairline bg-white/[0.03] text-foreground-muted hover:border-white/20 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      {leading}
      {children}
      {showCheck && active && (
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M3.5 8.5l3 3 6-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.button>
  );
}

interface ChipRowProps {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

/** Horizontally scrollable chip group that wraps on wide screens. */
export function ChipRow({ children, className, ariaLabel }: ChipRowProps): ReactElement {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex flex-wrap gap-2", className)}
    >
      {children}
    </div>
  );
}