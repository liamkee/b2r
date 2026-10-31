"use client";
import { usePathname } from "next/navigation";
import type { ReactElement, ReactNode } from "react";
import { MobileTabBar } from "./MobileTabBar";
import { Navbar } from "./Navbar";
import { PageTransition } from "./PageTransition";

const CURRENT_YEAR = new Date().getFullYear();

export function SiteShell({ children }: { children: ReactNode }): ReactElement {
  const pathname = usePathname();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="glass-thin sr-only rounded-full px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60]"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main-content" className="flex-1">
        <PageTransition key={pathname}>{children}</PageTransition>
      </main>

      <footer className="border-t border-hairline/60 py-8 pb-[calc(1.5rem+var(--tabbar-height))] md:pb-8">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-foreground-subtle sm:flex-row">
          <p>
            <span className="text-foreground-muted">ASEAN ONE</span> — One ASEAN. Every Opportunity.
          </p>
          <p>Built for ASEAN · {CURRENT_YEAR}</p>
        </div>
      </footer>

      <MobileTabBar />
    </div>
  );
}
