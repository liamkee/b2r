"use client";
import { useState } from "react";

export default function EnhanceBox({ code, industry }: { code: string; industry: string }) {
  const [key, setKey] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, industry, apiKey: key }),
      });
      const j = await res.json();
      setOut(j.markdown ?? j.error ?? "Failed");
    } finally {
      setBusy(false);
      setKey("");
    }
  }
  return (
    <div className="border rounded p-4 space-y-2">
      <div className="font-medium text-sm">AI enhance (BYOK — key never stored)</div>
      <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste key to enable" className="border rounded px-2 py-1 w-full text-sm" />
      <button disabled={!key || busy} onClick={run} className="text-sm border rounded px-3 py-1 disabled:opacity-50">
        {busy ? "Working…" : "Generate angle"}
      </button>
      {out && <pre className="text-xs whitespace-pre-wrap">{out}</pre>}
    </div>
  );
}
