import { getCountry } from "@/lib/countries";
import RegulationCard from "@/app/components/RegulationCard";

export function generateStaticParams() {
  return ["BN","KH","ID","LA","MY","MM","PH","SG","TH","VN","TL"].map((code) => ({ code }));
}

export default async function CountryPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ industry?: string }>;
}) {
  const { code } = await params;
  const { industry: industryParam } = await searchParams;
  let country;
  try {
    country = getCountry(code);
  } catch {
    return (
      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">{code} · Coming soon</h1>
        <p className="text-sm">Country data for {code} is not yet available.</p>
      </main>
    );
  }
  const industry = industryParam ?? "saas";
  const tpl = country.industryTemplates[industry] ?? country.industryTemplates["_default"];
  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">{country.name} · {industry}</h1>
      <section>
        <h2 className="font-semibold">Regulation</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-2">
          {country.regulation
            .filter((r) => tpl.regulationFocus.length === 0 || tpl.regulationFocus.some((f) => r.topic.includes(f.split(" ")[0]) || true))
            .map((r) => <RegulationCard key={r.topic} item={r} />)}
        </div>
      </section>
      <section><h2 className="font-semibold">Market</h2><p className="text-sm">Live metrics wired in Task 4.</p></section>
      <section><h2 className="font-semibold">Competitors</h2><p className="text-sm">News + BYOK wired in Task 4-5.</p></section>
    </main>
  );
}
