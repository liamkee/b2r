// app/page.tsx (server) — hero map island (HomeHeroMap wraps LazyAseanMap) navigates to /countries/[code].
import { Suspense } from "react";
import { listCountries } from "@/lib/countries";
import CountryGrid from "./components/CountryGrid";
import IndustryPicker from "./components/IndustryPicker";
import { HomeHeroMap } from "./components/HomeHeroMap";
export default function Home() {
  const countries = listCountries();
  return (
    <main className="container-page space-y-6 pt-10 pb-16">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">B2R ASEAN Intelligence</p>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">One ASEAN. <span className="text-gradient-gold">Every Opportunity.</span></h1>
          <p className="mt-5 max-w-xl text-lg text-foreground-muted">Regulation, market demands and competitor views grouped by country. Pick an industry, pick a country.</p>
          <div className="mt-8"><Suspense><IndustryPicker /></Suspense></div>
        </div>
        <HomeHeroMap />
      </section>
      <section id="countries"><CountryGrid countries={countries} /></section>
    </main>
  );
}
