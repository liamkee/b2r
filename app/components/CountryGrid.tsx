import Link from "next/link";
import Image from "next/image";

export default function CountryGrid({ countries }: { countries: { code: string; name: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {countries.map((c) => (
        <Link key={c.code} href={`/countries/${c.code}`} className="border rounded p-4 hover:shadow">
          <Image src={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png`} alt={c.name} width={80} height={60} />
          <div className="mt-2 font-medium">{c.name}</div>
          <div className="text-xs text-gray-500">{c.code}</div>
        </Link>
      ))}
    </div>
  );
}
