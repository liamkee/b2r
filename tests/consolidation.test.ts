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
describe("layout shell", () => {
  it("has shell files with Next Link", () => {
    const nav = fs.readFileSync("app/components/layout/Navbar.tsx", "utf8");
    expect(nav).toContain("next/link");
    expect(nav).toContain("nav-active-pill");
    expect(fs.existsSync("app/components/layout/SiteShell.tsx")).toBe(true);
  });
});
describe("map data", () => {
  it("has topology with 10 ASEAN ids", async () => {
    const topo = JSON.parse(fs.readFileSync("public/asean/asean-countries-50m.json", "utf8"));
    const ids = topo.objects.countries.geometries.map((g: {id:string}) => String(g.id));
    for (const id of ["360","458","702","764"]) expect(ids).toContain(id);
  });
  it("builds geometry", async () => {
    const { buildMapGeometry } = await import("@/lib/map-geo");
    const { geometry } = buildMapGeometry(640, 560, 30);
    expect(geometry.filter(g => g.isAsean).length).toBe(10);
  });
});
describe("map components", () => {
  it("has lazy map with dynamic import", () => {
    const lazy = fs.readFileSync("app/components/map/LazyAseanMap.tsx", "utf8");
    expect(lazy).toContain("next/dynamic");
    expect(lazy).toContain("ssr: false");
    const map = fs.readFileSync("app/components/map/AseanMap.tsx", "utf8");
    expect(map).toContain('data-country');
  });
});
describe("home hero", () => {
  it("has hero with map and grid", () => {
    const page = fs.readFileSync("app/page.tsx", "utf8");
    expect(page).toContain("LazyAseanMap");
    expect(page).toContain("CountryGrid");
    expect(page).toContain("IndustryPicker");
    expect(page).toContain("/countries/");
  });
});
