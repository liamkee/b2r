import { describe, expect, it } from "vitest";
import { profileFromForm, selectedCountries } from "@/app/match/MatchPage";
import { normalizeProfile } from "@/lib/engine/profile";

function form() {
  const data = new FormData();
  for (const [key,value] of Object.entries({sector:"software_saas",description:"Inventory tools for restaurant operators",buyer_type:"B2B",customer_segment:"Restaurant groups",business_model:"Subscription",entry_mode:"undecided",revenue_status:"pre_revenue",scaling:"Validate one new country with paying outlets",target_metric:"customers",baseline:"20",target_value:"100",unit:"outlets",horizon:"12"}))data.set(key,value);
  data.append("target_countries","MY"); data.append("target_countries","TL");
  return data;
}
describe("five-answer Match intake",()=>{
  it("builds a schema-valid profile without inferred operating base or budget",()=>{
    const profile=normalizeProfile(profileFromForm(form()));
    expect(Object.keys(profile)).toHaveLength(5);
    expect(profile.target_countries).toEqual(["MY","TL"]);
    expect(profile.product.current_base_country).toBeNull();
    expect(profile.revenue.amount).toBe(0);
    expect(profile.scalability_targets.expansion_budget.amount).toBeNull();
  });
  it("captures a revenue range with explicit currency, period and metric",()=>{
    const data=form();for(const[key,value]of Object.entries({revenue_status:"revenue_generating",revenue_kind:"range",range_min:"0",range_max:"50000",currency:"myr",period:"monthly",revenue_metric:"gmv"}))data.set(key,value);
    const profile=normalizeProfile(profileFromForm(data));
    expect(profile.revenue).toMatchObject({amount:null,range_min:0,range_max:50000,currency:"MYR",period:"monthly",metric:"gmv"});
    expect(profile.scalability_targets.expansion_budget.amount).toBeNull();
  });
  it("supports nondisclosure without inventing a currency or amount",()=>{
    const data=form();data.set("revenue_status","not_disclosed");
    expect(normalizeProfile(profileFromForm(data)).revenue).toMatchObject({status:"not_disclosed",amount:null,currency:null});
  });
  it("keeps all eleven explicit country selections and removes unsupported URL codes",()=>{
    expect(selectedCountries("MY,TL,US,MY,VN")).toEqual(["MY","TL","VN"]);
    expect(selectedCountries("BN,KH,ID,LA,MY,MM,PH,SG,TH,TL,VN")).toHaveLength(11);
  });
});
