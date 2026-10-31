import { NextResponse } from "next/server";
import { getCountry } from "@/lib/countries";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { code?: string; industry?: string; apiKey?: string } | null;
  if (!body?.code || !body?.industry || !body?.apiKey) {
    return NextResponse.json({ error: "code, industry and apiKey are required (BYOK, never stored)." }, { status: 400 });
  }
  const country = getCountry(body.code);
  const prompt = `Country: ${country.name} (${country.code}). Industry: ${body.industry}. Regulation topics: ${country.regulation.map((r) => r.topic).join(", ")}. Summarize entry risks and next checks in 5 bullets with sources.`;
  // v1: echo prompt plan only; LLM provider call is wired by user with their key client-side or extended here.
  // Never log body.apiKey.
  return NextResponse.json({ markdown: `## ${country.name} × ${body.industry}\n\n${prompt}\n\n> Paste this into your model with your key, or extend this route to call your provider.` });
}
