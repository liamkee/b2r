import { Suspense } from "react";
import { listCountries } from "@/lib/countries";
import CountryGrid from "./components/CountryGrid";
import IndustryPicker from "./components/IndustryPicker";

export default function Home() {
  const countries = listCountries();
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">B2R ASEAN Intelligence</h1>
      <Suspense>
        <IndustryPicker />
      </Suspense>
      <CountryGrid countries={countries} />
    </main>
  );
}
