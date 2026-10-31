"use client";
import { useRouter } from "next/navigation";
import { ErrorBoundary } from "./layout/ErrorBoundary";
import { LazyAseanMap } from "./map/LazyAseanMap";
export function HomeHeroMap() {
  const router = useRouter();
  return (
    <ErrorBoundary>
      <LazyAseanMap className="mx-auto w-full max-w-[34rem]" onSelect={(code) => router.push(`/countries/${code}`)} />
    </ErrorBoundary>
  );
}
