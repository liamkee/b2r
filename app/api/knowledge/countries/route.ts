import { loadKnowledge } from "@/lib/engine/knowledge";

export const runtime = "nodejs";
export function GET(request: Request) {
  const index = loadKnowledge();
  const codes = [...new Set((new URL(request.url).searchParams.get("codes") ?? "MY,SG").split(",").map(code => code.trim().toUpperCase()))];
  if (!codes.length || codes.length > 11 || codes.some(code => !index.taxonomy.countries.some(country => country.code === code))) return Response.json({error:"Select valid ASEAN country codes."},{status:400});
  const countries = codes.map(code => {
    const records = index.records.filter(record => record.country_codes.includes(code));
    const sourceIds = new Set(records.flatMap(record => record.source_ids));
    return {code,name:index.taxonomy.countries.find(country => country.code === code)!.name,records:records.map(record => ({...record,text_for_embedding:""})),sources:index.sources.filter(source => sourceIds.has(source.source_id))};
  });
  return Response.json({dataset_version:index.datasetVersion,snapshot_date:index.manifest.created_on,countries,limitations:["Country research snapshot; product fit and legal applicability need verification.","Sources were not live-checked in this request.","Company offerings are examples, not verified market shares or a complete competitor census."]},{headers:{"Cache-Control":"public, max-age=300","X-Content-Type-Options":"nosniff"}});
}
