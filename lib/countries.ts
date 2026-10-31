import fs from "node:fs";
import path from "node:path";
import type { CountryData } from "./types";

const DIR = path.join(process.cwd(), "data", "countries");

export function listCountries(): { code: string; name: string }[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const j = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as CountryData;
      return { code: j.code, name: j.name };
    })
    .sort((a, b) => a.code.localeCompare(b.code));
}

export function getCountry(code: string): CountryData {
  const file = path.join(DIR, `${code.toUpperCase()}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as CountryData;
}
