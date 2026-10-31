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
import { DURATION, SPRING, fadeUp, staggerList } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "@/lib/nav";
describe("motion helpers", () => {
  it("exports spring presets", () => {
    expect(SPRING.stiffness).toBe(350);
    expect(DURATION.base).toBe(0.3);
    expect(fadeUp.visible).toBeDefined();
    expect(staggerList.visible).toBeDefined();
  });
  it("cn joins", () => { expect(cn("a", false, "b")).toBe("a b"); });
  it("nav has Next routes", () => {
    expect(NAV_ITEMS.map(n => n.path)).toContain("/");
    expect(NAV_ITEMS.length).toBe(4);
  });
});
