"use client";
/**
 * Re-exports used by the match experience.
 *
 * Kept as a thin module so match components import one path, and so the saved
 * store's client boundary is explicit where it is consumed.
 */
export { useSaved } from "@/app/components/providers/SavedProvider";