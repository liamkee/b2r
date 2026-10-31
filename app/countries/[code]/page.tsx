import { getCountry } from "@/lib/countries";
import { fetchFx, fetchGdelt, fetchWorldBank } from "@/lib/sources";
import RegulationCard from "@/app/components/RegulationCard";
import MarketTable from "@/app/components/MarketTable";
import NewsList from "@/app/components/NewsList";
import EnhanceBox from "@/app/components/EnhanceBox";

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
  const country = getCountry(code);
  const industry = industryParam ?? "saas";
  const tpl = country.industryTemplates[industry] ?? country.industryTemplates["_default"];
  const [wb, fx, news] = await Promise.all([
    fetchWorldBank(code.toUpperCase(), country.market.worldBankCodes),
    fetchFx(),
    fetchGdelt(country.competitors.sampleQueries[0] ?? `${country.name} business`),
  ]);
  const rows = country.market.worldBankCodes.slice(0, 5).map((id) => ({
    label: id,
    value: wb.data[id] != null ? String(wb.data[id]) : "n/a",
  }));
  const fxRate = fx.data[country.basics.currency];
  if (fxRate != null) {
    rows.push({ label: `${country.basics.currency} per USD`, value: String(fxRate) });
  }
  const marketFallback = !wb.ok || !fx.ok;
  const marketUpdated = wb.ok ? wb.updatedAt : fx.ok ? fx.updatedAt : "";
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
      <section>
        <h2 className="font-semibold">Market</h2>
        <MarketTable rows={rows} fallback={marketFallback} />
        <p className="text-xs text-gray-500 mt-1">Last updated: {marketUpdated || "static snapshot"} · {country.market.notes}</p>
      </section>
      <section>
        <h2 className="font-semibold">Competitors</h2>
        <p className="text-sm text-gray-600 mb-2">{country.competitors.howTo}</p>
        <NewsList items={news.data} />
      </section>
      <section>
        <EnhanceBox code={country.code} industry={industry} />
      </section>
    </main>
  );
}
