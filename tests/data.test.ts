import { describe, it, expect } from "vitest";
import { getCountry, listCountries } from "@/lib/countries";

describe("countries data", () => {
  it("lists TH and SG", () => {
    const codes = listCountries().map((c) => c.code);
    expect(codes).toContain("TH");
    expect(codes).toContain("SG");
  });
  it("TH regulation entries all have sources", () => {
    const th = getCountry("TH");
    expect(th.name).toBe("Thailand");
    for (const r of th.regulation) {
      expect(r.sourceUrl.startsWith("https://")).toBe(true);
      expect(r.sourceName.length).toBeGreaterThan(1);
      expect(/^\d{4}-\d{2}-\d{2}$/.test(r.lastVerified)).toBe(true);
    }
  });
});
