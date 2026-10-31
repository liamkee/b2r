"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactElement, ReactNode } from "react";

const STORAGE_KEY = "asean-one:saved";

/** Reads the saved set from localStorage. Safe on the server. */
function readStored(): ReadonlySet<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    /* Corrupt or unavailable storage is not fatal — start empty. */
    return new Set();
  }
}

interface SavedContextValue {
  /** Opportunity ids the user has saved. */
  saved: ReadonlySet<string>;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  clear: () => void;
}

const SavedContext = createContext<SavedContextValue | null>(null);

/**
 * Saved-opportunities store.
 *
 * Persists to localStorage so the dashboard and match results agree on what has
 * been saved. The initial read happens in a lazy state initialiser (guarded for
 * SSR) rather than an effect, so there is no cascading render on mount.
 */
export function SavedProvider({ children }: { children: ReactNode }): ReactElement {
  /* Lazily read on the client; on the server this starts empty. */
  const [saved, setSaved] = useState<ReadonlySet<string>>(readStored);
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  /* Write-through, but only after hydration so we never clobber stored data
     with the empty server-render set. */
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]));
    } catch {
      /* Storage full or blocked; saving is a convenience, not critical. */
    }
  }, [saved]);

  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSaved(new Set()), []);

  const value = useMemo<SavedContextValue>(
    () => ({ saved, isSaved: (id) => saved.has(id), toggle, clear }),
    [saved, toggle, clear],
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

/** Reads the saved store. Must be used inside `SavedProvider`. */
export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}