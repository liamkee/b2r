"use client";
import { useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AiInput } from "@/app/components/matchmaker/AiInput";
import type { AiInputSubmit } from "@/app/components/matchmaker/AiInput";

/**
 * Keep the brief in this browsing session rather than leaking it into URLs.
 */
export function HeroAiInput(): ReactElement {
  const router = useRouter();
  const [warning, setWarning] = useState("");

  const onSubmit = (value: AiInputSubmit): void => {
    const sp = new URLSearchParams();
    try { sessionStorage.setItem("asean:research-seed:v1", JSON.stringify({ text: value.text.slice(0,2000), markets: value.markets })); }
    catch { setWarning("Browser storage is unavailable. Open Match and enter your brief there."); return; }
    if (value.markets.length > 0) sp.set("markets", value.markets.join(","));
    router.push(`/match?${sp.toString()}`);
  };

  return (
    <div id="hero-ai">
      <AiInput
        onSubmit={onSubmit}
        label="Describe your startup"
        className="max-w-2xl"
      />
      {warning && <p role="alert" className="mt-3 text-sm text-foreground-muted">{warning}</p>}
    </div>
  );
}
