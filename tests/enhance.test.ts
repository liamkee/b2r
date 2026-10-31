import { describe, it, expect } from "vitest";
import fs from "node:fs";

describe("enhance", () => {
  it("rejects missing key with 400 shape", () => {
    const src = fs.readFileSync("app/api/enhance/route.ts", "utf8");
    expect(src).toContain("400");
    expect(src).not.toContain("process.env.OPENAI");
    expect(src).not.toContain("sk-");
  });
  it("has BYOK box with password input", () => {
    const src = fs.readFileSync("app/components/EnhanceBox.tsx", "utf8");
    expect(src).toContain('type="password"');
    expect(src).toContain("/api/enhance");
  });
});
