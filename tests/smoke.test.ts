import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("scaffold", () => {
  it("has app layout and fast config", () => {
    expect(fs.existsSync("app/layout.tsx")).toBe(true);
    const cfg = fs.readFileSync("next.config.mjs", "utf8");
    expect(cfg).toContain("flagcdn");
  });
});
