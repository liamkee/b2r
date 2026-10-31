import CompareWorkspace from "@/app/components/research/CompareWorkspace";
import { COUNTRY_META } from "@/lib/country-meta";

export default async function Compare({ searchParams }: { searchParams: Promise<{ codes?: string }> }) {
  const { codes } = await searchParams;
  const selected = [...new Set((codes ?? "TH,SG").split(",").map(code => code.trim().toUpperCase()).filter(code => code in COUNTRY_META))].slice(0, 11);
  return <CompareWorkspace initialCodes={selected.length ? selected : ["TH", "SG"]} />;
}
