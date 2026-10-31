"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ALL_COUNTRIES } from "@/lib/country-meta";
import { loadResearchResult, RESEARCH_EVENT } from "@/lib/research-client";
import type { ResearchResponse } from "@/lib/research-client";
import type { EvidenceRecord, SourceRecord } from "@/lib/engine/knowledge";
import ResearchReport, { SourceDrawer } from "./ResearchReport";

type Overview = { dataset_version: string; snapshot_date: string; countries: { code: string; name: string; records: EvidenceRecord[]; sources: SourceRecord[] }[]; limitations: string[] };
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";
const topics = [{ key: "regulation", title: "Regulation" }, { key: "market_demand", title: "Market demand" }, { key: "competition", title: "Competition" }, { key: "research_gap", title: "Research gaps" }];

export default function CompareWorkspace({ initialCodes }: { initialCodes: string[] }) {
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [view, setView] = useState<"report" | "library">("library");
  const [codes, setCodes] = useState(initialCodes);
  const [ready, setReady] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [topic, setTopic] = useState("regulation");
  const [record, setRecord] = useState<EvidenceRecord | null>(null);
  useEffect(() => {
    function sync() {
      const saved = loadResearchResult(); setResult(saved);
      if (saved) { setView("report"); setCodes(saved.report.countries.map(country => country.country_code)); }
      else setView("library");
      setReady(true);
    }
    sync(); window.addEventListener(RESEARCH_EVENT, sync); window.addEventListener("storage", sync);
    return () => { window.removeEventListener(RESEARCH_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  const codeString = codes.join(",");
  useEffect(() => {
    if (!ready || view !== "library") return;
    const controller = new AbortController(); let disposed = false;
    const timer = setTimeout(() => controller.abort(), 15_000);
    queueMicrotask(() => { if (!disposed) { setLoading(true); setError(""); } });
    fetch(`/api/knowledge/countries?codes=${encodeURIComponent(codeString)}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error();
      const value = await response.json() as Overview;
      if (!Array.isArray(value.countries)) throw new Error();
      if (!disposed) setOverview(value);
    }).catch(() => { if (!disposed) setError(controller.signal.aborted ? "The research request timed out. Try again." : "Country research is temporarily unavailable. Try again."); }).finally(() => { clearTimeout(timer); if (!disposed) setLoading(false); });
    return () => { disposed = true; clearTimeout(timer); controller.abort(); };
  }, [codeString, view, ready, retry]);
  function toggleCountry(code: string) {
    const next = codes.includes(code) ? codes.filter(item => item !== code) : [...codes, code];
    if (!next.length) return;
    setCodes(next); const url = new URL(window.location.href); url.searchParams.set("codes", next.join(",")); window.history.replaceState(null, "", url);
  }
  const available = view === "report" && result ? ALL_COUNTRIES.filter(country => result.report.countries.some(item => item.country_code === country.code)) : ALL_COUNTRIES;
  const sources = [...new Map((overview?.countries.flatMap(country => country.sources) ?? []).map(source => [source.source_id, source])).values()];
  function exportReport() {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(result, null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `asean-one-research-${result.report.generated_at.slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  }
  return <main className="container-page pb-28 pt-10 sm:pt-14">
    <header className="mb-8 max-w-3xl"><p className="text-xs font-semibold uppercase tracking-widest text-gold-300">Country intelligence</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Compare your next markets</h1><p className="mt-4 text-sm leading-relaxed text-foreground-muted sm:text-base">Review regulation, market demand and competitor evidence side by side. Match your business to compare this research against your product and scaling goals.</p></header>
    {!ready ? <p role="status" className="rounded-3xl border border-white/10 p-6 text-foreground-muted">Loading your comparison…</p> : <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {result && <button type="button" onClick={() => { setView("report"); setCodes(result.report.countries.map(country => country.country_code)); }} aria-pressed={view === "report"} className={`min-h-11 rounded-full border px-5 text-sm ${focus} ${view === "report" ? "border-gold-400/40 text-gold-300" : "border-white/15 text-foreground-muted"}`}>Your latest match</button>}
        <button type="button" onClick={() => setView("library")} aria-pressed={view === "library"} className={`min-h-11 rounded-full border px-5 text-sm ${focus} ${view === "library" ? "border-gold-400/40 text-gold-300" : "border-white/15 text-foreground-muted"}`}>Country evidence library</button>
        <Link href="/match" className={`inline-flex min-h-11 items-center rounded-full bg-gold-400 px-5 text-sm font-semibold text-black hover:bg-gold-300 ${focus}`}>{result ? "Edit business match" : "Start a business match"}</Link>
        {result && view === "report" && <button type="button" onClick={exportReport} className={`min-h-11 rounded-full border border-white/15 px-5 text-sm text-foreground-muted ${focus}`}>Export report</button>}
      </div>
      {!result && <p className="mb-6 rounded-2xl border border-white/10 bg-night-900 p-5 text-sm leading-relaxed text-foreground-muted">No business match is available in this browser yet. Browse the sourced country snapshot below, or answer the five questions in Match for a product-specific research comparison.</p>}
      <fieldset className="mb-8 rounded-3xl border border-white/10 bg-night-900/60 p-5"><legend className="px-2 text-sm font-medium">Countries to compare</legend><div className="flex flex-wrap gap-2">{available.map(country => <label key={country.code} className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm ${codes.includes(country.code) ? "border-gold-400/40 bg-gold-400/10 text-gold-300" : "border-white/10 text-foreground-muted"}`}><input type="checkbox" checked={codes.includes(country.code)} onChange={() => toggleCountry(country.code)} className={`accent-gold-400 ${focus}`} />{country.name}</label>)}</div><p className="mt-3 text-xs text-foreground-muted">Choose at least one. {view === "report" ? "Countries come from your submitted match; changing this view does not change the business profile." : "All 11 ASEAN countries are available. Evidence coverage differs by country and industry."}</p></fieldset>
      {view === "report" && result ? <ResearchReport result={result} countryCodes={codes} /> : <>
        <section className="mb-6 rounded-3xl border border-gold-400/20 bg-gold-400/5 p-5"><h2 className="font-semibold">Source evidence · country snapshot</h2><p className="mt-2 text-sm leading-relaxed text-foreground-muted">General country research, not a personalized recommendation or ranking. Policy priorities and macro growth do not prove demand for your product.</p>{overview && <p className="mt-3 text-xs text-foreground-muted">Dataset {overview.dataset_version} · researched {overview.snapshot_date}</p>}</section>
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Country evidence sections">{topics.map(item => <button type="button" key={item.key} aria-pressed={topic === item.key} onClick={() => setTopic(item.key)} className={`min-h-11 rounded-full border px-5 text-sm ${focus} ${topic === item.key ? "border-gold-400/40 bg-gold-400/10 text-gold-300" : "border-white/10 text-foreground-muted"}`}>{item.title}</button>)}</div>
        {loading ? <div role="status" aria-label="Loading country evidence" className="grid gap-5 md:grid-cols-2">{codes.map(code => <div key={code} className="h-64 rounded-3xl border border-white/10 bg-night-900 p-6"><div className="h-5 w-24 rounded bg-white/10" /><div className="mt-6 h-20 rounded bg-white/5" /><p className="mt-5 text-sm text-foreground-muted">Loading source evidence…</p></div>)}</div> : error ? <div role="alert" className="rounded-3xl border border-error/30 p-6"><p className="text-sm">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)} className={`mt-4 min-h-11 rounded-full border border-white/15 px-5 text-sm ${focus}`}>Retry research</button></div> : <div className={`grid items-start gap-5 ${codes.length === 1 ? "" : codes.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-3"}`}>{overview?.countries.filter(country => codes.includes(country.code)).map(country => <article key={country.code} data-testid={`library-country-${country.code}`} className="min-w-0 rounded-3xl border border-white/10 bg-night-900/75 p-5 sm:p-6"><p className="text-xs text-gold-300">{country.code}</p><h2 className="mb-6 mt-2 text-xl font-semibold">{country.name}</h2><div className="space-y-4">{country.records.filter(item => item.topic === topic).map(item => <section key={item.id} className="rounded-xl border border-white/10 p-4"><h3 className="text-sm font-semibold">{item.title}</h3>{item.record_type === "research_gap" ? <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-foreground-muted">{item.unknowns.map(unknown => <li key={unknown}>{unknown}</li>)}</ul> : <><ul className="mt-3 space-y-3 text-sm leading-relaxed text-foreground-muted">{item.facts.map(fact => <li key={fact}>{fact}</li>)}</ul><button type="button" onClick={() => setRecord(item)} className={`mt-3 min-h-10 rounded-lg border border-gold-400/20 px-3 text-xs font-medium text-gold-300 ${focus}`}>View source {item.id}</button></>}{item.topic === "competition" && <p className="mt-3 text-xs text-foreground-muted">Offering example; customer-job overlap and current commercial terms need verification.</p>}</section>)}{!country.records.some(item => item.topic === topic) && <p className="text-sm text-foreground-muted">This topic is not established in the current snapshot. Missing records do not establish absence of regulation, demand or competition.</p>}</div></article>)}</div>}
        {overview && <ul className="mt-7 list-disc space-y-2 pl-5 text-xs leading-relaxed text-foreground-muted">{overview.limitations.map(item => <li key={item}>{item}</li>)}</ul>}
        <SourceDrawer record={record} sources={sources} onClose={() => setRecord(null)} />
      </>}
    </>}
  </main>;
}
