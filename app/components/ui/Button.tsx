"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactElement, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { SPRING } from "@/lib/motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface BaseProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  /** Leading icon node (an inline SVG). */
  icon?: ReactNode;
  /** Stretches to the full width of its container. */
  block?: boolean;
}

interface ButtonProps extends BaseProps {
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  "aria-pressed"?: boolean;
  "aria-label"?: string;
}

interface ButtonLinkProps extends BaseProps {
  href: string;
  /** Use a plain anchor (e.g. for #anchors) instead of next/link. */
  external?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-gold-400 text-black font-semibold hover:bg-gold-300 shadow-glow",
  secondary:
    "glass-thin text-foreground font-semibold hover:text-gold-400",
  ghost:
    "text-foreground-muted font-medium hover:text-foreground hover:bg-white/5",
  danger:
    "bg-error/15 text-error font-semibold hover:bg-error/25 border border-error/30",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-7 text-base",
};

/**
 * Pill button. All variants share one radius, height scale and press physics
 * so actions feel identical wherever they appear.
 *
 * `min-h`/`min-w` guarantee a 44px touch target at `md` and above; `sm` is
 * only used in dense desktop toolbars.
 */
function classes(
  variant: Variant,
  size: Size,
  block: boolean,
  className?: string,
): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full whitespace-nowrap transition-colors duration-200 select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400",
    "disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    block && "w-full",
    className,
  );
}

/** Press physics, skipped entirely under reduced motion. */
function press(reduced: boolean | null) {
  return reduced ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 }, transition: SPRING };
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  block = false,
  onClick,
  type = "button",
  disabled,
  ...rest
}: ButtonProps): ReactElement {
  const reduced = useReducedMotion();
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes(variant, size, block, className)}
      {...press(reduced)}
      {...rest}
    >
      {icon}
      {children}
    </motion.button>
  );
}

export function ButtonLink({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  block = false,
  href,
  external = false,
  onClick,
  ...rest
}: ButtonLinkProps): ReactElement {
  const reduced = useReducedMotion();
  const cls = classes(variant, size, block, className);

  if (external || href.startsWith("#")) {
    return (
      <motion.a href={href} className={cls} onClick={onClick} {...press(reduced)} {...rest}>
        {icon}
        {children}
      </motion.a>
    );
  }

  return (
    <motion.span {...press(reduced)} className="inline-flex">
      <Link href={href} className={cls} onClick={onClick} {...rest}>
        {icon}
        {children}
      </Link>
    </motion.span>
  );
}