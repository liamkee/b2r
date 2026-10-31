"use client";
import { Suspense, useCallback, useMemo } from "react";
import type { ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorBoundary } from "@/app/components/layout/ErrorBoundary";
import { LazyAseanMap } from "@/app/components/map/LazyAseanMap";
import { ExploreSection } from "@/app/components/explore/ExploreSection";
import type { TypeFilter } from "@/app/components/explore/ExploreSection";
import { CATEGORIES } from "@/lib/opportunities";
import { COUNTRY_META } from "@/lib/country-meta";

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

/** Parses ?country= and ?type= into validated values. */
function parseParams(params: URLSearchParams): {
  country: string | null;
  type: TypeFilter;
} {
  const rawCountry = (params.get("country") ?? "").toUpperCase();
  const country = COUNTRY_META[rawCountry] ? rawCountry : null;
  const rawType = (params.get("type") ?? "all").toLowerCase();
  const type: TypeFilter =
    rawType !== "all" && CATEGORY_IDS.has(rawType as never)
      ? (rawType as TypeFilter)
      : "all";
  return { country, type };
}

/**
 * The map + explorer island.
 *
 * Owns the country/type state and mirrors it into the URL, so a selection is
 * shareable and back/forward work. The map is the picking surface; the panel
 * is its companion.
 */
function HomeExplorerInner(): ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const { country, type } = useMemo(() => parseParams(params), [params]);

  const update = useCallback(
    (next: { country: string | null; type: TypeFilter }) => {
      const sp = new URLSearchParams();
      if (next.country) sp.set("country", next.country);
      if (next.type !== "all") sp.set("type", next.type);
      const qs = sp.toString();
      /* `scroll: false` keeps the reader anchored on the map. */
      router.replace(qs ? `/?${qs}#explore` : "/#explore", { scroll: false });
    },
    [router],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-start">
      <div id="hero-map" className="lg:sticky lg:top-24">
        <ErrorBoundary>
          <LazyAseanMap
            className="mx-auto w-full max-w-[38rem] lg:max-w-none"
            selected={country}
            onSelect={(code) => update({ country: code, type })}
          />
        </ErrorBoundary>
      </div>
      <ExploreSection country={country} type={type} onChange={update} />
    </div>
  );
}

export function HomeExplorer(): ReactElement {
  return (
    <Suspense
      fallback={
        <div
          className="glass-thin aspect-[8/7] w-full animate-pulse rounded-3xl"
          aria-hidden="true"
        />
      }
    >
      <HomeExplorerInner />
    </Suspense>
  );
}