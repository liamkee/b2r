"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { Logo } from "./Logo";
import { NAV_ITEMS } from "@/lib/nav";
import { EASE, layoutIndicator } from "@/lib/motion";
import { cn } from "@/lib/cn";

function isActive(pathname: string, itemPath: string, label: string): boolean {
  if (label === "Explore" && pathname.startsWith("/countries")) return true;
  return pathname === itemPath;
}

export function Navbar(): ReactElement {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50">
      <div className="glass-thin border-x-0 border-t-0">
        <nav className="container-page flex h-14 items-center justify-between gap-4" aria-label="Main">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="ASEAN ONE home">
            <Logo size={26} />
            <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
              ASEAN<span className="text-gold-400"> ONE</span>
            </span>
          </Link>

          <ul className="hidden items-center gap-0.5 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.path, item.label);
              return (
                <li key={item.label}>
                  <Link
                    href={item.path}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative block rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
                      active ? "text-gold-400" : "text-foreground-muted hover:text-foreground",
                    )}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-full bg-gold-400/12"
                        transition={layoutIndicator}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden md:block">
            <Link
              href="/compare"
              className="rounded-full bg-gold-400 px-4 py-2 text-sm font-semibold text-black transition-colors duration-200 hover:bg-gold-300"
            >
              Find matches
            </Link>
          </div>

          <button
            type="button"
            className="glass-thin inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground transition-colors duration-200 md:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsOpen((open) => !open)}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden="true">
              {isOpen ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M3 6h14M3 10h14M3 14h14"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mobile-menu"
            className="glass-thin overflow-hidden border-x-0 border-t-0 md:hidden"
            initial={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduced ? { duration: 0.01 } : { duration: 0.3, ease: EASE.out }}
          >
            <ul className="container-page flex flex-col gap-1 py-3">
              {NAV_ITEMS.map((item) => {
                const active = isActive(pathname, item.path, item.label);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.path}
                      onClick={() => setIsOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col rounded-2xl px-4 py-3 transition-colors duration-200",
                        active
                          ? "bg-gold-400/12 text-gold-400"
                          : "text-foreground-muted hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="mt-0.5 text-xs text-foreground-subtle">
                        {item.description}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
