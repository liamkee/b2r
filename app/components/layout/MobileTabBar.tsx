"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { layoutIndicator } from "@/lib/motion";
import { cn } from "@/lib/cn";

function isActive(pathname: string, itemPath: string, label: string): boolean {
  if (label === "Explore" && pathname.startsWith("/countries")) return true;
  return pathname === itemPath;
}

export function MobileTabBar(): ReactElement {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Primary"
    >
      <div className="glass-thin mx-auto flex max-w-md items-center justify-around gap-1 rounded-full p-1.5 shadow-xl">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.path, item.label);
          return (
            <Link
              key={item.label}
              href={item.path}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2"
            >
              {active && (
                <motion.span
                  layoutId="tab-active-pill"
                  className="absolute inset-0 rounded-full bg-gold-400/14"
                  transition={layoutIndicator}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex flex-col items-center gap-0.5 transition-colors duration-200",
                  active ? "text-gold-400" : "text-foreground-subtle",
                )}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  {item.label === "Home" && (
                    <path
                      d="M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-3v-4H7v4H4a1 1 0 0 1-1-1V9.5Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                  {item.label === "Explore" && (
                    <>
                      <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                      <path d="M14.5 14.5 18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </>
                  )}
                  {item.label === "Compare" && (
                    <path
                      d="M10 3.5l1.9 4.1 4.1.6-3 3 .7 4.3L10 13.5 6.3 15.5l.7-4.3-3-3 4.1-.6L10 3.5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  )}
                  {item.label === "Dashboard" && (
                    <>
                      <rect x="3.5" y="3.5" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                      <rect x="10.5" y="3.5" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                      <rect x="3.5" y="10.5" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                      <rect x="10.5" y="10.5" width="6" height="6" rx="1.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
                    </>
                  )}
                </svg>
                <span className="text-[0.65rem] font-medium tracking-tight">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
