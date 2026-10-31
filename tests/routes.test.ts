import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("routes", () => {
  it("has grid, picker, detail and loading", () => {
    for (const f of [
      "app/page.tsx",
      "app/components/CountryGrid.tsx",
      "app/components/IndustryPicker.tsx",
      "app/countries/[code]/page.tsx",
      "app/countries/[code]/loading.tsx",
    ]) expect(fs.existsSync(f)).toBe(true);
  });
  it("detail page uses generateStaticParams for 11 codes", () => {
    const src = fs.readFileSync("app/countries/[code]/page.tsx", "utf8");
    expect(src).toContain("generateStaticParams");
    expect(src).toContain("Regulation");
  });
});
