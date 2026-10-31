// Home: hero with the AI prompt and the animated ASEAN map, then the explorer
// panel and the supporting marketing sections.
import Link from "next/link";
import { Suspense } from "react";
import { listCountries } from "@/lib/countries";
import CountryGrid from "./components/CountryGrid";
import IndustryPicker from "./components/IndustryPicker";
import { HomeExplorer } from "./components/explore/HomeExplorer";
import { HeroAiInput } from "./components/matchmaker/HeroAiInput";
import { IntroSplash } from "./components/layout/IntroSplash";
import { StatsStrip } from "./components/home/StatsStrip";
import { ProblemToSolution } from "./components/home/ProblemToSolution";
import { HowItWorks } from "./components/home/HowItWorks";
import { SampleRoadmap } from "./components/home/SampleRoadmap";
import { FeaturedRail } from "./components/home/FeaturedRail";
import { AiCapabilities } from "./components/home/AiCapabilities";
import { TrustSection } from "./components/home/TrustSection";
import { FinalCta } from "./components/home/FinalCta";
import { AskAiFab } from "./components/home/AskAiFab";

export default function Home() {
  const countries = listCountries();

  return (
    <main className="pb-16">
      <IntroSplash />
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="container-page pt-10 pb-6 sm:pt-14">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
            B2R ASEAN Intelligence
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl">
            One ASEAN. <span className="text-gradient-gold">Every Opportunity.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-foreground-muted">
            Explore where your business could grow, with sourced research on
            regulation, market demand and competitors across ASEAN.
          </p>
          <div className="mt-8">
            <HeroAiInput />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link
              href="#explore"
              className="glass-thin rounded-full px-5 py-2.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:text-gold-400"
            >
              Explore the ecosystem
            </Link>
            <Link
              href="/compare"
              className="text-sm font-medium text-foreground-muted transition-colors duration-200 hover:text-gold-400"
            >
              Compare markets
            </Link>
          </div>
        </div>
      </section>

      {/* ── Map + explorer ───────────────────────────────────────────── */}
      <section id="explore" className="container-page scroll-mt-20 py-10">
        <HomeExplorer />
      </section>

      {/* ── Supporting sections ──────────────────────────────────────── */}
      <div className="container-page space-y-20 pt-6 sm:space-y-28">
        <StatsStrip />
        <ProblemToSolution />
        <HowItWorks />
        <SampleRoadmap />
        <FeaturedRail />
        <AiCapabilities />
        <TrustSection />
        <FinalCta />
      </div>

      {/* ── Country directory + industry picker ──────────────────────── */}
      <section id="countries" className="container-page scroll-mt-20 pt-20 sm:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              Country directory
            </p>
            <h2 className="mt-3 text-3xl sm:text-4xl">Every market, in detail</h2>
            <p className="mt-3 max-w-2xl text-foreground-muted">
              Regulation, market demand and competitor views for each of the 11
              ASEAN countries.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Suspense fallback={null}>
              <IndustryPicker />
            </Suspense>
          </div>
        </div>
        <div className="mt-8">
          <CountryGrid countries={countries} />
        </div>
      </section>

      <AskAiFab />
    </main>
  );
}
