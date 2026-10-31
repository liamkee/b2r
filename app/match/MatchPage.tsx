"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ResearchReport from "@/app/components/research/ResearchReport";
import { ALL_COUNTRIES } from "@/lib/country-meta";
import taxonomy from "@/knowledge/asean/data/taxonomy.json";
import type { BusinessProfile } from "@/lib/engine/profile";
import { requestResearch, loadResearchDraft, saveResearchDraft, loadResearchResult, saveResearchResult, clearResearch, type ResearchResponse } from "@/lib/research-client";

const field = "mt-2 min-h-11 w-full rounded-xl border border-white/15 bg-night-850 px-3 py-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400";
const button = "min-h-11 rounded-full px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-400 disabled:opacity-50";
const section = "glass-thin rounded-3xl p-5 sm:p-7";
function Label({ children, title }: { children: ReactNode; title: string }) { return <label className="block">{title}{children}</label>; }
function Input({name,title,value,required=false,limit=400,numeric=false}: {name:string;title:string;value?:string|number|null;required?:boolean;limit?:number;numeric?:boolean}) {
  return <Label title={title}><input className={field} name={name} defaultValue={value ?? ""} required={required} maxLength={limit} autoComplete="off" inputMode={numeric ? "decimal" : "text"} pattern={numeric ? "[0-9]+([.][0-9]+)?" : undefined} /></Label>;
}
function Select({name,title,value,options,required=false}: {name:string;title:string;value?:string;options:readonly string[];required?:boolean}) {
  return <Label title={title}><select className={field} name={name} defaultValue={value ?? ""} required={required}>{required && <option value="">Choose an option</option>}{options.map(option => <option key={option} value={option}>{option.replace(/_/g," ")}</option>)}</select></Label>;
}
export function selectedCountries(raw: string): string[] { return [...new Set(raw.split(",").map(code => code.trim().toUpperCase()).filter(code => ALL_COUNTRIES.some(country => country.code === code)))]; }

/** Build the API's five-answer contract without browser-bundling the server validator. */
export function profileFromForm(data: FormData): BusinessProfile {
  const text = (key:string) => String(data.get(key) ?? "").trim();
  const number = (key:string) => text(key) === "" ? null : Number(text(key));
  const generating = text("revenue_status") === "revenue_generating";
  const range = text("revenue_kind") === "range";
  return {
    industry: {sector:text("sector"),subsector:text("subsector"),description:""},
    target_countries:data.getAll("target_countries").map(String),
    product: {description:text("description"),buyer_type:text("buyer_type") as BusinessProfile["product"]["buyer_type"],customer_segment:text("customer_segment"),business_model:text("business_model"),price_description:"",regulated_features:text("regulated_features").split(",").map(value=>value.trim()).filter(Boolean),current_base_country:text("base")||null,entry_mode_preference:text("entry_mode") as BusinessProfile["product"]["entry_mode_preference"]},
    revenue: {status:text("revenue_status") as BusinessProfile["revenue"]["status"],amount:generating&&!range?number("amount"):text("revenue_status")==="pre_revenue"?0:null,range_min:generating&&range?number("range_min"):null,range_max:generating&&range?number("range_max"):null,currency:generating?text("currency").toUpperCase():null,period:generating?text("period") as BusinessProfile["revenue"]["period"]:"not_disclosed",metric:generating?text("revenue_metric") as BusinessProfile["revenue"]["metric"]:"not_disclosed",period_end:null,notes:""},
    scalability_targets: {description:text("scaling"),metric:text("target_metric") as BusinessProfile["scalability_targets"]["metric"],target_value:number("target_value"),unit:text("unit")||null,baseline_value:number("baseline"),horizon_months:number("horizon"),target_date:null,expansion_budget:{amount:number("budget"),currency:text("budget_currency").toUpperCase()||null},constraints:text("constraints")?[text("constraints")]:[]},
  };
}

export function MatchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const controller = useRef<AbortController|null>(null);
  const [draft,setDraft] = useState<BusinessProfile|null>(null);
  const [result,setResult] = useState<ResearchResponse|null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [status,setStatus] = useState("");
  const [kind,setKind] = useState("amount");
  const [version,setVersion] = useState(0);
  const [seed,setSeed] = useState<{text:string;markets:string[]}|null>(null);
  const countries = selectedCountries(params.get("markets") ?? params.get("countries") ?? params.get("country") ?? "");
  useEffect(()=>{
    let active = true;
    queueMicrotask(()=>{ if(!active)return; const saved=loadResearchDraft();setDraft(saved);setStatus(saved?.revenue.status??"");setKind(saved?.revenue.range_min!=null?"range":"amount");setResult(loadResearchResult());if(saved)setNotice("Saved answers restored from this browser. Review them before submitting.");try { const value=JSON.parse(sessionStorage.getItem("asean:research-seed:v1")??"null");if(typeof value?.text==="string"&&Array.isArray(value.markets))setSeed({text:value.text.slice(0,2000),markets:selectedCountries(value.markets.join(","))});sessionStorage.removeItem("asean:research-seed:v1"); } catch {}setVersion(value=>value+1); });
    return()=>{active=false;controller.current?.abort();};
  },[]);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();if(busy)return;
    const form=event.currentTarget;const data=new FormData(form);const profile=profileFromForm(data);
    if(!profile.target_countries.length){setError("Select at least one country to research.");form.querySelector<HTMLInputElement>('[name="target_countries"]')?.focus();return;}
    if(profile.revenue.range_min!==null&&profile.revenue.range_max!==null&&profile.revenue.range_min>profile.revenue.range_max){setError("Revenue range minimum must not exceed its maximum.");return;}
    setBusy(true);setError("");setResult(null);controller.current?.abort();const activeController=new AbortController();controller.current=activeController;
    try{
      const response=await requestResearch(profile,activeController.signal);if(activeController.signal.aborted)return;setResult(response);
      const saved=saveResearchResult(response);const persist=data.get("save_draft")==="on";let draftSaved=true;if(persist)draftSaved=saveResearchDraft(profile);else try{localStorage.removeItem("asean:research-draft:v1");}catch{draftSaved=false;}
      setNotice(!saved||!draftSaved?"Browser storage is unavailable or full. The report remains available here; export it before leaving.":persist?"Answers saved on this browser. The report is available in Compare for this session.":"The report is available in Compare for this session. Answers were not saved across sessions.");
      router.replace("/match",{scroll:false});
      window.setTimeout(()=>document.getElementById("research-results")?.scrollIntoView({behavior:"auto",block:"start"}),0);
    }catch(cause){if(!(cause instanceof Error&&cause.name==="AbortError"))setError(cause instanceof Error?cause.message:"Research could not be completed. Your answers are still here; try again.");}
    finally{if(controller.current===activeController)setBusy(false);}
  }
  function reset(){controller.current?.abort();const cleared=clearResearch();setSeed(null);setDraft(null);setResult(null);setError("");setStatus("");setKind("amount");setBusy(false);setVersion(value=>value+1);setNotice(cleared?"Saved research and answers cleared from this browser.":"Browser storage could not be cleared. Check this browser’s storage settings.");router.replace("/match",{scroll:false});}

  return <main className="container-page pt-8 pb-24">
    <header className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-widest text-gold-400">/match</p><h1 className="mt-3 text-4xl sm:text-5xl">Find your next market</h1><p className="mt-4 text-lg text-foreground-muted">Compare government regulation, market demand and competitor evidence for your business. Five answers shape the research; evidence gaps stay visible.</p></header>
    <form key={version} onSubmit={submit} aria-busy={busy} className="mt-8 space-y-6">
      <fieldset disabled={busy} className={section}><legend className="px-2 text-lg font-semibold">1. Industry</legend><div className="grid gap-4 sm:grid-cols-2"><Select name="sector" title="Industry (required)" required value={draft?.industry.sector} options={taxonomy.sectors.filter(sector=>sector!=="general")} /><Input name="subsector" title="Subsector (optional)" limit={160} value={draft?.industry.subsector} /></div></fieldset>
      <fieldset disabled={busy} className={section}><legend className="px-2 text-lg font-semibold">2. Countries to consider</legend><p className="mb-3 text-sm text-foreground-muted">Choose at least one. All 11 ASEAN countries are available.</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">{ALL_COUNTRIES.map(country=><label key={country.code} className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 py-2"><input className="size-4 accent-gold-400 focus-visible:outline-2 focus-visible:outline-gold-400" type="checkbox" name="target_countries" value={country.code} defaultChecked={(countries.length?countries:seed?.markets.length?seed.markets:draft?.target_countries??[]).includes(country.code)} />{country.name}</label>)}</div></fieldset>
      <fieldset disabled={busy} className={section}><legend className="px-2 text-lg font-semibold">3. Product and customer</legend><Label title="What do you offer, and what problem does it solve? (required)"><textarea className={field} rows={3} name="description" required minLength={10} maxLength={2000} defaultValue={params.get("q")?.slice(0,2000)??seed?.text??draft?.product.description??""} /></Label><div className="mt-4 grid gap-4 sm:grid-cols-2"><Select name="buyer_type" title="Buyer type" value={draft?.product.buyer_type??"unknown"} options={["unknown","B2B","B2C","B2G","mixed"]}/><Input name="customer_segment" title="Customer segment" value={draft?.product.customer_segment}/><Input name="business_model" title="Business model" value={draft?.product.business_model}/><Input name="base" title="Current operating base (optional)" limit={100} value={draft?.product.current_base_country}/><Select name="entry_mode" title="Entry approach" value={draft?.product.entry_mode_preference??"undecided"} options={["undecided","cross_border_sales","distributor_partner","local_entity","franchise"]}/><Input name="regulated_features" title="Regulated features, separated by commas" limit={1000} value={draft?.product.regulated_features.join(", ")}/></div></fieldset>
      <fieldset disabled={busy} className={section}><legend className="px-2 text-lg font-semibold">4. Current revenue</legend><p className="mb-4 text-sm text-foreground-muted">Revenue is a traction input; it does not establish cash, profit or expansion budget.</p><Label title="Revenue status (required)"><select className={field} name="revenue_status" value={status} required onChange={event=>setStatus(event.target.value)}><option value="">Choose a status</option><option value="pre_revenue">Pre-revenue</option><option value="revenue_generating">Revenue generating</option><option value="not_disclosed">Prefer not to disclose</option></select></Label>{status==="revenue_generating"&&<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Label title="Amount or range"><select className={field} name="revenue_kind" value={kind} onChange={event=>setKind(event.target.value)}><option value="amount">Amount</option><option value="range">Range</option></select></Label>{kind==="amount"?<Input name="amount" title="Revenue amount" numeric required value={draft?.revenue.amount}/>:<><Input name="range_min" title="Revenue range minimum" numeric required value={draft?.revenue.range_min}/><Input name="range_max" title="Revenue range maximum" numeric required value={draft?.revenue.range_max}/></>}<Input name="currency" title="Revenue currency (ISO code)" required limit={3} value={draft?.revenue.currency}/><Select name="period" title="Reporting period" required value={draft?.revenue.period==="not_disclosed"?"":draft?.revenue.period} options={["monthly","annual","trailing_12_months"]}/><Select name="revenue_metric" title="Revenue metric" required value={draft?.revenue.metric==="not_disclosed"?"":draft?.revenue.metric} options={["recognized_revenue","gross_sales","gmv","arr","mrr"]}/></div>}</fieldset>
      <fieldset disabled={busy} className={section}><legend className="px-2 text-lg font-semibold">5. Scaling targets</legend><Label title="What do you want to achieve, and by when? (required)"><textarea className={field} name="scaling" rows={2} required maxLength={1500} defaultValue={draft?.scalability_targets.description??""}/></Label><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Select name="target_metric" title="Target metric" value={draft?.scalability_targets.metric??"not_specified"} options={["not_specified","revenue","customers","users","stores","transactions","production_capacity","countries","other"]}/><Input name="baseline" title="Current baseline (optional)" numeric value={draft?.scalability_targets.baseline_value}/><Input name="target_value" title="Target value (optional)" numeric value={draft?.scalability_targets.target_value}/><Input name="unit" title="Target unit (optional)" limit={100} value={draft?.scalability_targets.unit}/><Input name="horizon" title="Time horizon in months (optional)" numeric value={draft?.scalability_targets.horizon_months}/><Input name="budget" title="Expansion budget (optional)" numeric value={draft?.scalability_targets.expansion_budget.amount}/><Input name="budget_currency" title="Budget currency (if budget supplied)" limit={3} value={draft?.scalability_targets.expansion_budget.currency}/></div><div className="mt-4"><Input name="constraints" title="Constraints (optional)" limit={300} value={draft?.scalability_targets.constraints.join("; ")}/></div></fieldset>
      <div className={`${section} space-y-4`}><p className="text-sm text-foreground-muted">Submitting sends these answers to the server. If model analysis is enabled, relevant answers are also sent to the configured model provider. Reports use a dated research snapshot and require current legal verification.</p><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" name="save_draft" className="size-4 accent-gold-400"/>Save these answers on this browser. Anyone using this browser can access them.</label>{error&&<p role="alert" className="rounded-xl border border-error/40 bg-error/10 p-3 text-sm text-foreground">{error} Review your answers and submit again.</p>}<div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className={`${button} bg-gold-400 text-night-950`}>{busy?"Researching selected countries…":"Research selected countries"}</button><button type="button" onClick={reset} className={`${button} border border-white/20 text-foreground`}>Clear answers and research</button></div>{notice&&<p role="status" className="text-sm text-foreground-muted">{notice}</p>}</div>
    </form>
    {busy&&<section className="mt-8" role="status"><p>Retrieving regulation, demand and competitor evidence…</p><div className="mt-4 grid gap-4 md:grid-cols-3">{[0,1,2].map(index=><div key={index} className="glass-thin h-56 rounded-3xl motion-safe:animate-pulse" aria-hidden="true"/>)}</div></section>}
    {result&&<section id="research-results" className="mt-10 scroll-mt-24"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">Your market research</h2><Link className={`${button} border border-white/20`} href={`/compare?codes=${result.report.countries.map(country=>country.country_code).join(",")}`}>Open in Compare</Link></div><ResearchReport result={result}/></section>}
    {!result&&!busy&&<p className="mt-8 text-sm text-foreground-muted">Complete the five answers to see sourced country comparisons and the evidence still needed before a pilot.</p>}
  </main>;
}
