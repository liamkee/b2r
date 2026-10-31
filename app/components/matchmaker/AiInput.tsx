"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactElement } from "react";
import { Chip, ChipRow } from "@/app/components/ui/Chip";
import { COUNTRY_META, ALL_COUNTRIES } from "@/lib/country-meta";
import { FOCUS_OPTIONS } from "@/lib/api";
import type { FocusKey } from "@/lib/api";
import { DURATION, EASE, SPRING } from "@/lib/motion";

/** Example prompts cycled through the placeholder. */
const EXAMPLES = [
  "I'm a pre-seed fintech in Malaysia expanding to Indonesia...",
  "We build climate-tech hardware and need grants in Singapore...",
  "Looking for an accelerator for a health startup in Vietnam...",
  "A B2B SaaS in the Philippines seeking its first institutional round...",
  "Agri-tech in Thailand, looking for distribution partners in Laos...",
] as const;

const ROTATE_MS = 3800;

export interface AiInputSubmit {
  text: string;
  markets: string[];
  focus: FocusKey[];
}

interface AiInputProps {
  /** Pre-fills the textarea (e.g. from ?q=). */
  defaultValue?: string;
  /** Pre-selects target markets (e.g. from ?markets=). */
  defaultMarkets?: string[];
  /** Pre-selects focus areas. Defaults to ["opportunities"]. */
  defaultFocus?: FocusKey[];
  onSubmit: (value: AiInputSubmit) => void;
  /** Label above the field. */
  label?: string;
  /** Hides the focus/market rows for the compact hero variant. */
  compact?: boolean;
  /** Disables the send button while a request is in flight. */
  busy?: boolean;
  className?: string;
  /** Autofocuses the textarea on mount. */
  autoFocus?: boolean;
}

/**
 * The shared AI input: an auto-growing glass textarea with a rotating example
 * placeholder, a round gold send button, and optional focus + target-market
 * chip rows. Used by both the landing hero and `/match`.
 */
export function AiInput({
  defaultValue = "",
  defaultMarkets = [],
  defaultFocus = ["opportunities"],
  onSubmit,
  label = "Describe your startup",
  compact = false,
  busy = false,
  className,
  autoFocus = false,
}: AiInputProps): ReactElement {
  const [text, setText] = useState(defaultValue);
  const [markets, setMarkets] = useState<string[]>(defaultMarkets);
  const [focus, setFocus] = useState<FocusKey[]>(defaultFocus);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const reduced = useReducedMotion();
  const rawId = useId();
  /* React ids contain colons, which break htmlFor and CSS selectors. */
  const textId = `ai-input-${rawId.replace(/:/g, "")}`;

  /* Rotate the placeholder only while empty and unfocused, so it never fights
     the user's typing or a screen reader. */
  useEffect(() => {
    if (text.length > 0 || isFocused || reduced) return;
    const timer = window.setInterval(
      () => setExampleIndex((i) => (i + 1) % EXAMPLES.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(timer);
  }, [text, isFocused, reduced]);

  const currentExample = EXAMPLES[exampleIndex] ?? EXAMPLES[0];

  /* Auto-grow: match the textarea height to its content, capped by CSS. */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [text]);

  const toggleMarket = (code: string): void =>
    setMarkets((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  const toggleFocus = (key: FocusKey): void =>
    setFocus((prev) => {
      if (prev.includes(key)) {
        /* Opportunities is the anchor; keep at least it selected. */
        if (key === "opportunities") return prev;
        return prev.filter((f) => f !== key);
      }
      return [...prev, key];
    });

  const handleSubmit = (event?: FormEvent<HTMLFormElement>): void => {
    event?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || busy) {
      textareaRef.current?.focus();
      return;
    }
    onSubmit({
      text: trimmed,
      markets,
      focus: focus.length > 0 ? focus : ["opportunities"],
    });
  };

  const showPlaceholder = text.length === 0 && !isFocused;

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <label
        htmlFor={textId}
        className="mb-2 block text-xs font-semibold tracking-widest text-gold-400 uppercase"
      >
        {label}
      </label>

      <div className="glass-thin flex items-end gap-2 rounded-[1.6rem] p-2 shadow-lg transition-shadow duration-200 focus-within:shadow-glow focus-within:ring-2 focus-within:ring-gold-400/60">
        <div className="relative min-w-0 flex-1">
          <textarea
            id={textId}
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => {
              /* Enter submits; Shift+Enter adds a newline. */
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            rows={1}
            autoFocus={autoFocus}
            aria-label={label}
            className="block max-h-[220px] w-full resize-none bg-transparent px-3.5 py-3 text-base leading-relaxed text-foreground outline-none"
            placeholder=""
            aria-describedby={`${textId}-hint`}
          />

          {showPlaceholder && (
            <div
              className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-3.5"
              aria-hidden="true"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={exampleIndex}
                  className="block truncate text-base text-foreground-subtle"
                  initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, y: -10 }}
                  transition={
                    reduced
                      ? { duration: DURATION.instant }
                      : { duration: DURATION.base, ease: EASE.out }
                  }
                >
                  {currentExample}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>

        <motion.button
          type="submit"
          disabled={busy}
          whileTap={reduced ? undefined : { scale: 0.94 }}
          whileHover={reduced ? undefined : { scale: 1.04 }}
          transition={SPRING}
          className="mb-0.5 grid size-11 shrink-0 place-items-center rounded-full bg-gold-400 text-black transition-colors duration-200 hover:bg-gold-300 disabled:opacity-60"
          aria-label={busy ? "Finding matches" : "Find matches"}
        >
          {busy ? (
            <span className="size-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4 10h11M11 5.5 15.5 10 11 14.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </motion.button>
      </div>

      <p id={`${textId}-hint`} className="mt-2 text-xs text-foreground-subtle">
        Example: {currentExample}
      </p>

      {!compact && (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-foreground-subtle uppercase">
              Focus
            </p>
            <ChipRow ariaLabel="What the AI should cover">
              {FOCUS_OPTIONS.map((f) => (
                <Chip
                  key={f.id}
                  active={focus.includes(f.id)}
                  onClick={() => toggleFocus(f.id)}
                  disabled={f.id === "opportunities"}
                >
                  {f.label}
                </Chip>
              ))}
            </ChipRow>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-widest text-foreground-subtle uppercase">
              Target markets <span className="normal-case">(optional)</span>
            </p>
            <ChipRow ariaLabel="Target markets">
              {ALL_COUNTRIES.filter((c) => c.onMap).map((c) => (
                <Chip
                  key={c.code}
                  active={markets.includes(c.code)}
                  onClick={() => toggleMarket(c.code)}
                  showCheck={false}
                  leading={
                    <span
                      className="size-1.5 rounded-full bg-gold-400"
                      aria-hidden="true"
                    />
                  }
                  ariaLabel={COUNTRY_META[c.code]?.name ?? c.code}
                >
                  {c.name}
                </Chip>
              ))}
            </ChipRow>
          </div>
        </div>
      )}
    </form>
  );
}