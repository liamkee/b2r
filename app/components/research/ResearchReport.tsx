"use client";

import { useEffect, useRef, useState } from "react";
import { metaName as countryName } from "@/lib/country-meta";
import type { ResearchResponse } from "@/lib/research-client";
import type { Citation, Claim, CountryRecommendation, Dimension } from "@/lib/engine/schema";
import type { EvidenceRecord, SourceRecord } from "@/lib/engine/knowledge";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";
const label = (value: string) => value.replaceAll("_", " ");
export function safeSourceUrl(value: string): string | null {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; }
  catch { return null; }
}

/** The registry is returned by the server. A model's text never supplies a link. */
export function SourceDrawer({ record, sources, onClose }: { record: EvidenceRecord | null; sources: SourceRecord[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (record && element && !element.open) element.showModal();
    else if (!record && element?.open) element.close();
  }, [record]);
  const referenced = record ? sources.filter(source => record.source_ids.includes(source.source_id)) : [];
  return (
    <dialog ref={dialog} onClose={onClose} aria-labelledby="research-source-title" className="fixed inset-y-0 left-auto right-0 m-0 h-dvh max-h-dvh w-full max-w-xl overflow-y-auto border-l border-white/10 bg-night-900 p-6 text-foreground shadow-2xl backdrop:bg-black/70 sm:p-8">
      {record && <>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><p className="mb-2 text-xs font-medium uppercase tracking-wider text-gold-300">Source evidence</p><h2 id="research-source-title" className="text-xl font-semibold">{record.title}</h2></div>
          <button type="button" onClick={() => dialog.current?.close()} className={`min-h-11 rounded-full border border-white/15 px-4 text-sm ${focus}`}>Close sources</button>
        </div>
        <p className="text-sm text-foreground-muted">{record.id} · {label(record.topic)}</p>
        <dl className="my-6 grid grid-cols-2 gap-4 rounded-2xl border border-white/10 p-4 text-sm">
          <div><dt className="text-foreground-muted">Evidence period</dt><dd className="mt-1">{record.evidence_period ?? "Not stated"}</dd></div>
          <div><dt className="text-foreground-muted">Research reviewed</dt><dd className="mt-1">{record.reviewed_on}</dd></div>
          <div><dt className="text-foreground-muted">Effective from</dt><dd className="mt-1">{record.effective_from ?? "Not stated"}</dd></div>
          <div><dt className="text-foreground-muted">Editorial refresh due</dt><dd className="mt-1">{record.review_due}</dd></div>
        </dl>
        <p className="mb-6 text-sm leading-relaxed text-foreground-muted">Research dates do not establish legal currency. This request has not checked the original instruments or later amendments live.</p>
        <div className="space-y-5">{referenced.map(source => {
          const url = safeSourceUrl(source.url);
          return <article key={source.source_id} className="rounded-2xl border border-white/10 bg-night-850 p-5">
            <p className="text-xs text-gold-300">{source.publisher}</p>
            <h3 className="mt-2 font-medium">{source.title}</h3>
            <p className="mt-2 text-xs text-foreground-muted">{label(source.access_method)} · Published {source.publication_date ?? "date not stated"}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">{source.verification_scope}</p>
            {source.notes && <p className="mt-3 text-sm text-foreground-muted">{source.notes}</p>}
            {url && <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-3 inline-flex min-h-11 items-center text-sm font-medium text-gold-300 underline underline-offset-4 ${focus}`}>Open original source <span className="sr-only">{source.title}</span></a>}
          </article>;
        })}</div>
        {record.unknowns.length > 0 && <section className="mt-7"><h3 className="font-medium">Needs verification</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground-muted">{record.unknowns.map(item => <li key={item}>{item}</li>)}</ul></section>}
      </>}
    </dialog>
  );
}

export function CitationButtons({ citations, onSource }: { citations: Citation[]; onSource: (id: string) => void }) {
  return <span className="mt-2 flex flex-wrap gap-2">{citations.map(citation => <button type="button" key={citation.record_id} onClick={() => onSource(citation.record_id)} className={`min-h-10 rounded-lg border border-gold-400/20 bg-gold-400/5 px-3 text-xs font-medium text-gold-300 hover:bg-gold-400/10 ${focus}`}>View source <span className="font-mono">{citation.record_id}</span></button>)}</span>;
}

function ClaimItem({ claim, onSource }: { claim: Claim; onSource: (id: string) => void }) {
  const kind = { source_fact: "Source evidence", analyst_inference: "Proposed test / inference", user_provided: "Your input", unknown: "Needs verification" }[claim.kind];
  return <li className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
    <p className={`mb-2 text-xs font-medium ${claim.kind === "source_fact" ? "text-ocean-300" : "text-foreground-muted"}`}>{kind}</p>
    <p className="text-sm leading-relaxed">{claim.text}</p>
    <CitationButtons citations={claim.citations} onSource={onSource} />
    {claim.assumptions.length > 0 && <p className="mt-2 text-xs leading-relaxed text-foreground-muted">Assumptions: {claim.assumptions.join(" ")}</p>}
  </li>;
}

function DimensionView({ dimension, title, onSource }: { dimension: Dimension; title: string; onSource: (id: string) => void }) {
  return <section className="space-y-4"><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs text-foreground-muted">Assessment: {label(dimension.assessment)} · {dimension.confidence} confidence</p></div>
    <ul className="space-y-3">{dimension.reasons.map((claim, index) => <ClaimItem key={`${index}-${claim.text}`} claim={claim} onSource={onSource} />)}</ul>
    {dimension.unresolved_inputs.length > 0 && <div className="text-sm text-foreground-muted"><h4 className="font-medium text-foreground">Still needed</h4><ul className="mt-2 list-disc space-y-2 pl-4">{dimension.unresolved_inputs.map(item => <li key={item}>{item}</li>)}</ul></div>}
  </section>;
}

type Section = "regulation" | "demand" | "competition" | "execution";
const sections: { key: Section; title: string }[] = [{ key: "regulation", title: "Regulation" }, { key: "demand", title: "Market demand" }, { key: "competition", title: "Competition" }, { key: "execution", title: "Execution" }];

function CountryColumn({ country, section, onSource }: { country: CountryRecommendation; section: Section; onSource: (id: string) => void }) {
  return <article className="min-w-0 rounded-3xl border border-white/10 bg-night-900/75 p-5 sm:p-6" data-testid={`research-country-${country.country_code}`}>
    <header className="mb-6 border-b border-white/10 pb-5"><p className="text-xs font-medium uppercase tracking-wider text-gold-300">{country.country_code}</p><h2 className="mt-2 text-xl font-semibold">{countryName(country.country_code)}</h2><p className="mt-3 text-xs text-foreground-muted">{label(country.status)} · {country.confidence} confidence</p><div className="mt-4 flex flex-wrap gap-2 text-xs text-foreground-muted"><span className="rounded-full border border-white/10 px-3 py-1">Regulation: {label(country.evidence_coverage.regulation)}</span><span className="rounded-full border border-white/10 px-3 py-1">Demand: {label(country.evidence_coverage.demand)}</span><span className="rounded-full border border-white/10 px-3 py-1">Competition: {label(country.evidence_coverage.competition)}</span></div></header>
    {section === "regulation" && <DimensionView dimension={country.dimensions.regulatory_feasibility} title="Regulatory feasibility" onSource={onSource} />}
    {section === "demand" && <DimensionView dimension={country.dimensions.demand_fit} title="Demand fit" onSource={onSource} />}
    {section === "competition" && <div className="space-y-6"><DimensionView dimension={country.dimensions.competitive_positioning} title="Competitive positioning" onSource={onSource} />
      <section><h3 className="font-semibold">Offerings and possible channels</h3>{country.competitors_and_channels.length ? <ul className="mt-3 space-y-3">{country.competitors_and_channels.map(entity => <li key={entity.name} className="rounded-xl border border-white/10 p-4"><h4 className="font-medium">{entity.name}</h4><p className="mt-1 text-xs text-gold-300">{entity.relationship === "unclear" ? "Relationship needs verification" : label(entity.relationship)}</p><p className="mt-3 text-sm leading-relaxed text-foreground-muted">{entity.customer_job_overlap}</p><CitationButtons citations={entity.offering_evidence} onSource={onSource} /><p className="mt-3 text-xs text-foreground-muted">Current prices and market share are not verified.</p></li>)}</ul> : <p className="mt-3 text-sm text-foreground-muted">No relevant offering was established by retrieval. This does not mean there are no competitors.</p>}</section>
    </div>}
    {section === "execution" && <div className="space-y-8"><DimensionView dimension={country.dimensions.commercial_readiness} title="Commercial readiness" onSource={onSource} /><DimensionView dimension={country.dimensions.scaling_feasibility} title="Scaling feasibility" onSource={onSource} /><section><h3 className="font-semibold">30 / 60 / 90-day validation plan</h3><p className="mt-2 text-xs text-foreground-muted">Proposed research tests, subject to capacity and legal prerequisites.</p><ol className="mt-4 space-y-4">{country.validation_plan.map((step, index) => <li key={`${step.time_window}-${index}`} className="rounded-xl border border-white/10 p-4"><p className="text-xs font-semibold text-gold-300">{label(step.time_window)}</p><p className="mt-2 text-sm leading-relaxed">{step.action}</p><p className="mt-3 text-sm text-foreground-muted"><strong className="font-medium text-foreground">Measure: </strong>{step.success_metric}</p><p className="mt-3 text-sm text-foreground-muted"><strong className="font-medium text-foreground">Go / no-go: </strong>{step.go_no_go_condition}</p></li>)}</ol></section></div>}
    <details className="mt-7 border-t border-white/10 pt-4"><summary className={`cursor-pointer py-2 text-sm font-medium ${focus}`}>Research gaps and freshness</summary><ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-foreground-muted">{[...country.critical_unknowns, ...country.evidence_coverage.freshness_flags].map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></details>
  </article>;
}

export default function ResearchReport({ result, countryCodes }: { result: ResearchResponse; countryCodes?: string[] }) {
  const [section, setSection] = useState<Section>("regulation");
  const [sourceId, setSourceId] = useState<string | null>(null);
  const countries = result.report.countries.filter(country => !countryCodes || countryCodes.includes(country.country_code));
  const record = result.retrieval.records.find(item => item.id === sourceId) ?? null;
  return <div className="space-y-6" data-testid="research-report">
    <section className="rounded-3xl border border-gold-400/20 bg-gold-400/5 p-5 sm:p-6"><div className="flex flex-wrap items-center gap-3"><span className="rounded-full border border-gold-400/30 px-3 py-1 text-xs font-semibold text-gold-300">{result.report.mode === "evidence_only" ? "Evidence-only mode" : "Model-assisted evidence"}</span><span className="text-xs text-foreground-muted">Dataset {result.report.dataset_version} · {result.report.generated_at.slice(0, 10)}</span></div><p className="mt-4 text-sm leading-relaxed">{result.report.summary.text}</p><p className="mt-3 text-xs text-foreground-muted">No success probability or national-attractiveness score is inferred from this starter research.</p></section>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Research sections">{sections.map(item => <button type="button" key={item.key} aria-pressed={section === item.key} onClick={() => setSection(item.key)} className={`min-h-11 rounded-full border px-5 text-sm font-medium ${focus} ${section === item.key ? "border-gold-400/40 bg-gold-400/10 text-gold-300" : "border-white/10 text-foreground-muted hover:text-foreground"}`}>{item.title}</button>)}</div>
    {countries.length ? <div className={`grid items-start gap-5 ${countries.length === 1 ? "" : countries.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-2 xl:grid-cols-3"}`}>{countries.map(country => <CountryColumn key={country.country_code} country={country} section={section} onSource={setSourceId} />)}</div> : <p className="rounded-2xl border border-white/10 p-6 text-sm text-foreground-muted">Choose at least one country to view its evidence.</p>}
    <p className="text-xs leading-relaxed text-foreground-muted">{result.report.disclaimer}</p>
    <SourceDrawer record={record} sources={result.retrieval.sources} onClose={() => setSourceId(null)} />
  </div>;
}
