export default function NewsList({ items }: { items: { title: string; url: string; domain: string; seendate: string }[] }) {
  if (items.length === 0) return <p className="text-sm">No recent news found.</p>;
  return (
    <ul className="text-sm space-y-2">
      {items.map((n) => (
        <li key={n.url}><a className="underline" href={n.url} target="_blank" rel="noreferrer">{n.title}</a><span className="text-xs text-gray-500"> · {n.domain}</span></li>
      ))}
    </ul>
  );
}
