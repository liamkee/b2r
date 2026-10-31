import { getCountry } from "@/lib/countries";
import { fetchWorldBank } from "@/lib/sources";

export default async function Compare({ searchParams }: { searchParams: Promise<{ codes?: string }> }) {
  const { codes: codesParam } = await searchParams;
  const codes = (codesParam ?? "TH,SG").split(",").slice(0, 3);
  const rows = await Promise.all(codes.map(async (c) => {
    const meta = getCountry(c);
    const live = await fetchWorldBank(c, meta.market.worldBankCodes.slice(0, 3));
    return { code: c, name: meta.name, live };
  }));
  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-xl font-bold">Compare (market only v1)</h1>
      <table className="text-sm w-full mt-4">
        <thead><tr><th className="text-left">Metric</th>{rows.map((r) => <th key={r.code} className="text-right">{r.code}</th>)}</tr></thead>
        <tbody>
          {["SP.POP.TOTL", "NY.GDP.MKTP.CD", "NY.GDP.PCAP.CD"].map((m) => (
            <tr key={m} className="border-t"><td className="py-1">{m}</td>{rows.map((r) => <td key={r.code} className="text-right">{r.live.data[m] ?? "—"}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
