export default function MarketTable({ rows, fallback }: { rows: { label: string; value: string }[]; fallback: boolean }) {
  return (
    <div>
      {fallback && <p className="text-xs text-amber-600">Live data unavailable — showing static snapshot.</p>}
      <table className="text-sm w-full mt-2">
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t"><td className="py-1 pr-4">{r.label}</td><td className="py-1 text-right">{r.value}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
