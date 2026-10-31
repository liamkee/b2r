import { describe, it, expect } from "vitest";
import { fetchFx, fetchGdelt } from "@/lib/sources";

describe("sources fallback", () => {
  it("fx returns ok flag even offline", async () => {
    const r = await fetchFx();
    expect(typeof r.ok).toBe("boolean");
    if (r.ok) expect(r.data["THB"]).toBeGreaterThan(0);
  }, 15000);
  it("gdelt returns list shape", async () => {
    const r = await fetchGdelt("Thailand fintech");
    expect(Array.isArray(r.data)).toBe(true);
  }, 15000);
});
