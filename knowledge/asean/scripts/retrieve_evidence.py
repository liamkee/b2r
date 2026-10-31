#!/usr/bin/env python3
"""Offline lexical evidence-retrieval demo, not an AI adviser or a legal checker.
No API, model, embeddings or network access. It demonstrates country/topic isolation.
"""
import argparse, collections, json, math, pathlib, re, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
STOP={'the','and','for','with','that','this','from','into','have','has','are','was','its','not','but','can','our','your'}
def tokens(text):return [w for w in re.findall(r'[a-z0-9]+',text.lower()) if len(w)>2 and w not in STOP]
def load_records():return [json.loads(x) for x in (ROOT/'data/asean_market_intelligence.jsonl').read_text(encoding='utf-8').splitlines() if x.strip()]
def retrieve(countries,sector,query,per_topic=2):
    taxonomy=json.loads((ROOT/'data/taxonomy.json').read_text())
    codes={c['code'] for c in taxonomy['countries']}
    if not countries or set(countries)-codes:raise ValueError('Use one or more valid ASEAN country codes.')
    if sector not in taxonomy['sectors']:raise ValueError('Unknown sector tag.')
    if len(query)>3000:raise ValueError('Query too long.')
    countries=list(dict.fromkeys(countries));records=load_records();n=len(records)
    docs={r['id']:tokens(' '.join([r['title'],r['subtopic'],*r['facts'],r.get('analyst_inference') or '',json.dumps(r.get('entity') or {})])) for r in records}
    df=collections.Counter(t for ts in docs.values() for t in set(ts)); q=set(tokens(query))
    def score(r):
        tf=collections.Counter(docs[r['id']]);length=max(len(docs[r['id']]),1)
        lexical=sum((math.log(1+(n-df.get(t,0)+0.5)/(df.get(t,0)+0.5))*(tf.get(t,0)/(tf.get(t,0)+1.2)) if tf.get(t,0) else 0) for t in q)
        return lexical+(1.5 if sector in r['sector_tags'] and sector not in ['general','other'] else 0)
    all_sources={s['source_id']:s for s in json.loads((ROOT/'data/sources.json').read_text())}
    out=[]
    for c in countries:
        own=[r for r in records if c in r['country_codes']]
        selected=[];gaps=[]
        for topic in ['regulation','market_demand','competition','operational_risk']:
            candidates=[r for r in own if r['topic']==topic and ('general' in r['sector_tags'] or sector in r['sector_tags'])]
            # A general/unsupported industry does not turn every company into a direct competitor.
            if topic=='competition':
                candidates=[r for r in candidates if sector not in ['general','other'] and sector in r['sector_tags'] and (q & set(docs[r['id']]))]
            ranked=sorted(candidates,key=lambda r:(-score(r),r['id']))[:per_topic]
            if not ranked:gaps.append(f'No relevant {topic} record selected; do not interpret as absence in the market.')
            selected.extend(ranked)
        selected.extend(r for r in own if r['topic']=='research_gap')
        unique={r['id']:r for r in selected}
        out.append({'country_code':c,'retrieval_method':'bounded_lexical_demo','no_country_attractiveness_score':True,'records':[{'id':r['id'],'topic':r['topic'],'subtopic':r['subtopic'],'facts':r['facts'],'analyst_inference':r['analyst_inference'],'unknowns':r['unknowns'],'source_ids':r['source_ids'],'source_support':r['source_support'],'evidence_period':r['evidence_period'],'reviewed_on':r['reviewed_on'],'review_due':r['review_due'],'retrieval_score_not_market_score':round(score(r),4)} for r in unique.values()],'gaps':gaps,'sources':[all_sources[s] for s in sorted({s for r in unique.values() for s in r['source_ids']})]})
    return {'mode':'retrieval_demo_only','selected_countries':countries,'sector':sector,'results':out}
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--countries',nargs='+',required=True);p.add_argument('--sector',default='general');p.add_argument('--query',default='');p.add_argument('--per-topic',type=int,choices=range(1,5),default=2);a=p.parse_args()
    try:print(json.dumps(retrieve([x.upper() for x in a.countries],a.sector,a.query,a.per_topic),ensure_ascii=False,indent=2))
    except (ValueError,OSError,json.JSONDecodeError) as e:print('Retrieval error:',e,file=sys.stderr);sys.exit(1)
if __name__=='__main__':main()
