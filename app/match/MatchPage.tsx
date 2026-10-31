"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AiInput } from "@/app/components/matchmaker/AiInput";
import type { AiInputSubmit } from "@/app/components/matchmaker/AiInput";
import { MatchResults, marketLabel } from "@/app/components/matchmaker/MatchResults";
import { InsightSections } from "@/app/components/matchmaker/InsightSections";
import { ProfileCard } from "@/app/components/matchmaker/ProfileCard";
import {
  MatchEmpty,
  MatchErrorState,
  MatchLoading,
  ResultsAnnouncer,
} from "@/app/components/matchmaker/MatchStates";
import { matchRequest, MatchError, FOCUS_OPTIONS } from "@/lib/api";
import type { FocusKey, MatchResponse } from "@/lib/api";

/** Validates the ?focus= list, always keeping `opportunities`. */
function parseFocus(raw: string | null): FocusKey[] {
  const valid = new Set(FOCUS_OPTIONS.map((f) => f.id));
  const picked = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is FocusKey => valid.has(s as FocusKey));
  const withOpps = picked.includes("opportunities")
    ? picked
    : (["opportunities", ...picked] as FocusKey[]);
  return withOpps;
}

function parseMarkets(raw: string | null): string[] {
  return (raw ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{2}$/.test(s))
    .slice(0, 10);
}

/**
 * /match — the matchmaker.
 *
 * Reads its brief from the URL (`?q=`, `?markets=`, `?focus=`), runs the typed
 * client, and renders the loading, error, profile, results and insight states.
 * A `?q=` link auto-runs once on mount; subsequent searches are explicit.
 */
export function MatchPage(): ReactElement {
  const router = useRouter();
  const params = useSearchParams();

  const initialQuery = params.get("q") ?? "";
  const initialMarkets = useMemo(() => parseMarkets(params.get("markets")), [params]);
  const initialFocus = useMemo(
    () => parseFocus(params.get("focus")),
    [params],
  );

  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    initialQuery ? "loading" : "idle",
  );
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [error, setError] = useState("");
  const [lastRequest, setLastRequest] = useState<AiInputSubmit | null>(null);
  const autoRanRef = useRef(false);

  const run = useCallback(
    async (value: AiInputSubmit): Promise<void> => {
      setLastRequest(value);
      setState("loading");
      setError("");
      try {
        const res = await matchRequest({
          text: value.text,
          markets: value.markets,
          focus: value.focus,
        });
        setResult(res);
        setState("ready");
      } catch (err) {
        setError(
          err instanceof MatchError
            ? err.message
            : "We could not complete that search. Please try again.",
        );
        setState("error");
      }
    },
    [],
  );

  /*
   * Auto-run a shared ?q= link exactly once. The state changes happen inside
   * the async request, and the initial `loading` state is already set by the
   * useState initialiser above, so the effect itself triggers no render.
   */
  useEffect(() => {
    if (autoRanRef.current || !initialQuery) return;
    autoRanRef.current = true;
    void run({ text: initialQuery, markets: initialMarkets, focus: initialFocus });
  }, [initialQuery, initialMarkets, initialFocus, run]);

  const onSubmit = (value: AiInputSubmit): void => {
    /* Keep the URL shareable without adding history entries per keystroke. */
    const sp = new URLSearchParams();
    sp.set("q", value.text);
    if (value.markets.length > 0) sp.set("markets", value.markets.join(","));
    sp.set("focus", value.focus.join(","));
    router.replace(`/match?${sp.toString()}`, { scroll: false });
    void run(value);
  };

  const retry = (): void => {
    if (lastRequest) void run(lastRequest);
  };

  const reduced = useReducedMotion();

  const totalMatches = useMemo(
    () => result?.matches.reduce((n, m) => n + m.opportunities.length, 0) ?? 0,
    [result],
  );

  return (
    <main className="container-page pt-8 pb-24">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
          /match
        </p>
        <h1 className="mt-3 text-4xl sm:text-5xl">AI Matchmaker</h1>
        <p className="mt-4 text-lg leading-relaxed text-foreground-muted">
          Describe your startup and get ranked opportunities, regulation, market
          and competitor context — grouped by country.
        </p>
      </header>

      {/* Input */}
      <section className="mt-8">
        <AiInput
          defaultValue={initialQuery}
          defaultMarkets={initialMarkets}
          defaultFocus={initialFocus}
          onSubmit={onSubmit}
          label="Your startup"
          busy={state === "loading"}
          autoFocus={!initialQuery}
        />
      </section>

      <div className="mt-10 space-y-8">
        {state === "loading" && <MatchLoading />}
        {state === "error" && <MatchErrorState message={error} onRetry={retry} />}
        {state === "idle" && <MatchEmpty />}
        {state === "ready" && result && (
          <ResultsAnnouncer count={totalMatches}>
            <div className="space-y-8">
              <ProfileCard
                profile={result.profile}
                onSave={(next) => setResult({ ...result, profile: next })}
              />
              <MatchResults matches={result.matches} />
              <InsightSections insights={result.insights} />
            </div>
          </ResultsAnnouncer>
        )}
      </div>

      {/* Sticky mobile search bar once results exist, so the user can refine
          without scrolling back to the top. */}
      {state === "ready" && (
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+var(--tabbar-height)+var(--safe-bottom))] md:hidden"
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("match-input-anchor")
                ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
            }}
            className="glass-thick flex w-full items-center justify-between gap-3 rounded-full px-5 py-3 text-left text-sm"
          >
            <span className="truncate text-foreground-muted">
              {lastRequest?.text ?? "Refine your search"}
            </span>
            <span className="shrink-0 font-semibold text-gold-400">Refine</span>
          </button>
        </motion.div>
      )}
    </main>
  );
}

export { marketLabel };