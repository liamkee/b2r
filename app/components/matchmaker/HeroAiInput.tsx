"use client";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AiInput } from "@/app/components/matchmaker/AiInput";
import type { AiInputSubmit } from "@/app/components/matchmaker/AiInput";

/**
 * The hero's AI prompt. Submits by navigating to /match with the brief and
 * choices in the URL, so the result page can run the request itself.
 */
export function HeroAiInput(): ReactElement {
  const router = useRouter();

  const onSubmit = (value: AiInputSubmit): void => {
    const sp = new URLSearchParams();
    sp.set("q", value.text);
    if (value.markets.length > 0) sp.set("markets", value.markets.join(","));
    sp.set("focus", value.focus.join(","));
    router.push(`/match?${sp.toString()}`);
  };

  return (
    <div id="hero-ai">
      <AiInput
        onSubmit={onSubmit}
        label="Describe your startup"
        className="max-w-2xl"
      />
    </div>
  );
}