import { describe, it, expect } from "vitest";
import { listCountries, getCountry } from "@/lib/countries";

describe("all 11", () => {
  it("has 11 countries with sourced regulation", () => {
    expect(listCountries()).toHaveLength(11);
    for (const { code } of listCountries()) {
      const c = getCountry(code);
      expect(c.regulation.length).toBeGreaterThanOrEqual(1);
      for (const r of c.regulation) expect(r.sourceUrl.startsWith("https://")).toBe(true);
    }
  });
});
