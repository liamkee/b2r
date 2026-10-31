export interface RegulationItem {
  topic: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  lastVerified: string;
}
export interface CountryData {
  code: string;
  name: string;
  basics: { capital: string; currency: string; languages: string[] };
  regulation: RegulationItem[];
  market: { worldBankCodes: string[]; notes: string };
  competitors: { howTo: string; sampleQueries: string[] };
  industryTemplates: Record<string, { regulationFocus: string[]; marketMetrics: string[]; competitorAngles: string[] }>;
}
