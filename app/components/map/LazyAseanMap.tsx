"use client";
import dynamic from "next/dynamic";
const AseanMap = dynamic(() => import("./AseanMap").then(m => m.AseanMap), { ssr: false, loading: () => <div className="glass-thin relative aspect-[8/7] w-full animate-pulse rounded-3xl" aria-hidden="true" /> });
export function LazyAseanMap({ className, onSelect, ariaLabel }: { className?: string; onSelect?: (code: string) => void; ariaLabel?: string }) {
  return <div className={className}><AseanMap onSelect={onSelect} ariaLabel={ariaLabel} /></div>;
}
