import { Suspense } from "react";
import { MatchPage } from "./MatchPage";

export const metadata = {
  title: "AI Matchmaker — ASEAN ONE",
  description:
    "Describe your startup and get ranked opportunities, regulation, market and competitor context across ASEAN.",
};

/** `useSearchParams` needs a Suspense boundary in the App Router. */
export default function Match() {
  return (
    <Suspense
      fallback={
        <main className="container-page pt-8 pb-24">
          <div className="glass-thin h-64 w-full animate-pulse rounded-3xl" aria-hidden="true" />
        </main>
      }
    >
      <MatchPage />
    </Suspense>
  );
}