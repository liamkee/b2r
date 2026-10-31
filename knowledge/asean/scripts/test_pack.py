"""Executable offline pack/retriever tests. Live model/application testing is separate."""
import importlib.util, pathlib, unittest, json
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('retrieve',ROOT/'scripts/retrieve_evidence.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class PackTests(unittest.TestCase):
    def test_all_eleven_countries_have_three_categories(self):
        rows=m.load_records()
        for c in ['BN','KH','ID','LA','MY','MM','PH','SG','TH','TL','VN']:
            topics={r['topic'] for r in rows if c in r['country_codes']}
            self.assertTrue({'regulation','market_demand','competition'}<=topics)
    def test_selected_country_set_preserved(self):
        r=m.retrieve(['MY','TH','VN'],'software_saas','restaurant inventory POS integration')
        self.assertEqual([x['country_code'] for x in r['results']],['MY','TH','VN'])
    def test_no_cross_country_evidence_leak(self):
        rows={r['id']:r for r in m.load_records()}
        r=m.retrieve(['TL'],'fintech_payments','merchant payment wallet')
        for x in r['results'][0]['records']:self.assertIn('TL',rows[x['id']]['country_codes'])
        self.assertNotIn('ASEAN-COMP-LAZADA',[x['id'] for x in r['results'][0]['records']])
    def test_unknown_industry_does_not_get_fake_competitors(self):
        r=m.retrieve(['VN'],'other','specialized satellite propulsion cryogenic hardware')
        self.assertFalse(any(x['topic']=='competition' for x in r['results'][0]['records']))
    def test_invalid_country_rejected(self):
        with self.assertRaises(ValueError):m.retrieve(['ZZ'],'general','')
    def test_pre_revenue_example_schema_allows_zero(self):
        import jsonschema
        p=json.loads((ROOT/'evals/example_business_profile.json').read_text());p['revenue'].update(status='pre_revenue',amount=0)
        jsonschema.validate(p,json.loads((ROOT/'schemas/business_profile.schema.json').read_text()))
    def test_all_retrieved_sources_resolve(self):
        r=m.retrieve(['BN','KH','ID','LA','MY','MM','PH','SG','TH','TL','VN'],'ecommerce_retail','merchant digital sales payments')
        for result in r['results']:
            sources={s['source_id'] for s in result['sources']}
            for row in result['records']:self.assertTrue(set(row['source_ids'])<=sources)
    def test_no_sourced_market_share_or_pricing_in_starter(self):
        for r in m.load_records():
            if r['topic']=='competition':self.assertIsNone(r['market_share']);self.assertIsNone(r['pricing'])
    def test_gap_records_are_not_facts(self):
        for r in m.load_records():
            if r['record_type']=='research_gap':self.assertEqual(r['facts'],[]);self.assertEqual(r['source_ids'],[])
    def test_retriever_has_no_ai_or_success_score(self):
        r=m.retrieve(['MY'],'software_saas','POS inventory')
        self.assertEqual(r['mode'],'retrieval_demo_only')
        self.assertTrue(all(x['no_country_attractiveness_score'] for x in r['results']))
if __name__=='__main__':unittest.main(verbosity=2)
