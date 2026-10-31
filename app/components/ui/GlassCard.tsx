"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Adds a hover lift + shadow. Use for cards that are links or clickable. */
  interactive?: boolean;
  /** Use the lighter glass recipe (thin) instead of the default. */
  tone?: "regular" | "thin" | "solid";
  /** Renders as a different element, e.g. "li" inside a list. */
  as?: "div" | "li" | "section" | "article";
}

const TONE: Record<NonNullable<GlassCardProps["tone"]>, string> = {
  regular: "glass",
  thin: "glass-thin",
  solid: "bg-night-800/80 border border-hairline",
};

/**
 * The app's standard surface. Everything that would be "a card" uses this, so
 * radius, blur, hairline and elevation stay identical across the site.
 */
export function GlassCard({
  children,
  className,
  interactive = false,
  tone = "regular",
  as = "div",
}: GlassCardProps): ReactElement {
  const reduced = useReducedMotion();
  const Component = motion[as];

  return (
    <Component
      className={cn(
        TONE[tone],
        "rounded-3xl p-6",
        interactive && "transition-shadow duration-300 hover:shadow-xl",
        className,
      )}
      {...(interactive && !reduced
        ? { whileHover: { y: -3 }, transition: SPRING }
        : {})}
    >
      {children}
    </Component>
  );
}