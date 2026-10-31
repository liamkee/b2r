import { describe, it, expect } from "vitest";
import fs from "node:fs";
describe("consolidation tokens", () => {
  it("has night/gold tokens and glass utilities", () => {
    const css = fs.readFileSync("app/globals.css", "utf8");
    expect(css).toContain("--color-night-950");
    expect(css).toContain("--color-gold-400: #ffb700");
    expect(css).toContain("container-page");
    expect(css).toContain("glass");
  });
  it("declares frontend deps", () => {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    expect(pkg.dependencies["framer-motion"]).toBeDefined();
    expect(pkg.dependencies["d3-geo"]).toBeDefined();
    expect(pkg.dependencies["topojson-client"]).toBeDefined();
  });
});
