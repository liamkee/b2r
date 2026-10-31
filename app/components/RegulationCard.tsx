import type { RegulationItem } from "@/lib/types";

export default function RegulationCard({ item }: { item: RegulationItem }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium">{item.topic}</div>
      <p className="text-sm mt-1">{item.summary}</p>
      <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs underline mt-2 inline-block">
        {item.sourceName} · verified {item.lastVerified}
      </a>
    </div>
  );
}
