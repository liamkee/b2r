"use client";
import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = ["saas", "fnb", "retail", "manufacturing"];
export default function IndustryPicker() {
  const router = useRouter();
  const params = useSearchParams();
  const cur = params.get("industry") ?? "saas";
  return (
    <label className="text-sm">
      Industry{" "}
      <select
        value={cur}
        onChange={(e) => router.push(`?industry=${e.target.value}`)}
        className="border rounded px-2 py-1"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
