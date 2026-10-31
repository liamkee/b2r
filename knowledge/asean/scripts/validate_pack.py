#!/usr/bin/env python3
"""Validate research-pack integrity offline. Does NOT verify external legal accuracy or link uptime.
Usage: python scripts/validate_pack.py
Optional: python scripts/validate_pack.py --jsonschema (requires jsonschema installed).
"""
import json, sys, pathlib, datetime, collections, hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
def load(p): return json.loads((ROOT/p).read_text(encoding='utf-8'))
def require(condition,message):
    if not condition: raise ValueError(message)
def main():
    manifest=load('data/dataset_manifest.json'); taxonomy=load('data/taxonomy.json')
    countries={c['code'] for c in taxonomy['countries']}; sectors=set(taxonomy['sectors'])
    sources=load('data/sources.json'); src={s['source_id']:s for s in sources}
    require(len(src)==len(sources),'Duplicate source IDs')
    for s in sources:
        require(s['url'].startswith('https://'),'Non-HTTPS source: '+s['source_id'])
        datetime.date.fromisoformat(s['retrieved_on'])
        if s['publication_date']:
            require(datetime.date.fromisoformat(s['publication_date'])<=datetime.date.fromisoformat(manifest['created_on']),'Future-dated source')
    records=[]
    for n,line in enumerate((ROOT/'data/asean_market_intelligence.jsonl').read_text(encoding='utf-8').splitlines(),1):
        if line.strip():
            try:records.append(json.loads(line))
            except json.JSONDecodeError as e:raise ValueError(f'JSONL line {n}: {e}') from e
    ids={r['id'] for r in records}; require(len(ids)==len(records),'Duplicate record IDs')
    for r in records:
        require(set(r['country_codes'])<=countries and r['country_codes'],'Bad country codes: '+r['id'])
        require(set(r['sector_tags'])<=sectors and r['sector_tags'],'Bad sectors: '+r['id'])
        require(set(r['source_ids'])<=set(src),'Unresolved source: '+r['id'])
        require(set(r['supersedes_record_ids'])<=ids,'Unresolved supersedes ID: '+r['id'])
        require(datetime.date.fromisoformat(r['review_due'])>=datetime.date.fromisoformat(r['reviewed_on']),'Invalid review dates')
        if r['record_type']=='evidence':require(r['facts'] and r['source_ids'],'Evidence without supported facts: '+r['id'])
        if r['record_type']=='research_gap':require(not r['facts'] and not r['source_ids'],'Gap masquerades as fact: '+r['id'])
        if r['topic']=='competition':
            require(r.get('market_share') is None and r.get('pricing') is None,'Unexpected unsourced commercial metric')
            require(r['entity'] and r['entity']['customer_job'],'Missing competitor relevance')
        require((ROOT/f"rag_documents/{r['id']}.md").exists(),'Missing derived document')
    for c in countries:
        topics={r['topic'] for r in records if c in r['country_codes']}
        require({'regulation','market_demand','competition','research_gap'}<=topics,'Incomplete country category coverage: '+c)
    for p in load('data/country_profiles.json'):
        require(p['country_code'] in countries,'Invalid country profile')
        for key,val in p.items():
            if key.endswith('_record_ids'):require(set(val)<=ids,'Unknown record in profile')
        require(set(p['initial_test_hypothesis']['supporting_record_ids'])<=ids,'Unknown hypothesis source record')
    require(len(countries)==manifest['country_count']==11,'Membership count mismatch')
    require(len(records)==manifest['record_count'],'Record count mismatch')
    require(len(sources)==manifest['source_count'],'Source count mismatch')
    ingestion=load('data/ingestion_manifest.json')
    require({i['record_id'] for i in ingestion}==ids,'Ingestion manifest mismatch')
    for i in ingestion:
        require((ROOT/i['path']).exists(),'Missing ingestion file')
        require(i['attributes']['record_id']==i['record_id'],'Wrong retrieval metadata')
    schema_checked=False
    if '--jsonschema' in sys.argv:
        try: import jsonschema
        except ImportError as e:raise RuntimeError('Install jsonschema or run without --jsonschema') from e
        for f in (ROOT/'schemas').glob('*.json'):
            schema=json.loads(f.read_text());jsonschema.Draft202012Validator.check_schema(schema)
        validator=jsonschema.Draft202012Validator(load('schemas/evidence_record.schema.json'))
        for r in records:validator.validate(r)
        jsonschema.validate(load('evals/example_business_profile.json'),load('schemas/business_profile.schema.json'))
        schema_checked=True
    summary={'status':'passed','checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'records':len(records),'sources':len(sources),'countries':len(countries),'topics':dict(collections.Counter(r['topic'] for r in records)),'json_schema_validation':schema_checked,'checks':['JSON parsing','unique IDs','country/sector allowlists','source references','date ordering','country category coverage','gap/fact separation','competitor unknown metrics','country profile references','ingestion document alignment'],'not_checked':['live source URLs','complete current legal accuracy','market-share verification','live model behavior','application integration','deployment'],'dataset_sha256':hashlib.sha256((ROOT/'data/asean_market_intelligence.jsonl').read_bytes()).hexdigest()}
    (ROOT/'docs/validation_report.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('VALIDATION FAILED:',e,file=sys.stderr);sys.exit(1)
