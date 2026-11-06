import type { Tables, TableName } from "./types";

const H = 3600_000, D = 24 * H;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

export function buildSeed(): { [K in TableName]: Tables[K][] } {
  const profiles: Tables["profiles"][] = [
    { id: "u-admin", created_at: ago(90 * D), full_name: "Amer (Admin)", email: "admin@royaljourney.ae", role: "admin", phone: "+971500000001", specialization_areas: "", specialization_types: "", active: true },
    { id: "u-mgr", created_at: ago(90 * D), full_name: "Layla Hassan", email: "layla@royaljourney.ae", role: "manager", phone: "+971500000002", specialization_areas: "", specialization_types: "", active: true },
    { id: "u-a1", created_at: ago(80 * D), full_name: "Omar Khalid", email: "omar@royaljourney.ae", role: "agent", phone: "+971500000003", specialization_areas: "Downtown Dubai, Business Bay, Dubai Marina", specialization_types: "Apartment, Penthouse, Studio", active: true },
    { id: "u-a2", created_at: ago(70 * D), full_name: "Sara Petrova", email: "sara@royaljourney.ae", role: "agent", phone: "+971500000004", specialization_areas: "Palm Jumeirah, Dubai Hills Estate, Arabian Ranches", specialization_types: "Villa, Townhouse", active: true },
    { id: "u-a3", created_at: ago(60 * D), full_name: "Rahul Mehta", email: "rahul@royaljourney.ae", role: "agent", phone: "+971500000005", specialization_areas: "JVC, JLT, Dubai South, Al Barsha", specialization_types: "Apartment, Studio, Office", active: true },
  ];

  const P = (n: number, o: Partial<Tables["properties"]>): Tables["properties"] => ({
    id: `pr-${n}`, created_at: ago((30 - n) * D), ref: `RJ-${1000 + n}`, title: "", type: "Apartment", listing_type: "sale",
    area: "", building: "", bedrooms: 1, size_sqft: 800, price: 0, status: "available", owner_name: "", owner_phone: "",
    permit_no: `7120${3000 + n}`, photos_url: "", video_url: "", agent_id: null, ...o,
  });
  const properties = [
    P(1, { title: "2BR high floor, Burj Khalifa view", area: "Downtown Dubai", building: "Boulevard Point", bedrooms: 2, size_sqft: 1350, price: 3200000, agent_id: "u-a1", owner_name: "Mr. Ibrahim", owner_phone: "+971501110001" }),
    P(2, { title: "1BR marina view, furnished", area: "Dubai Marina", building: "Marina Gate 1", bedrooms: 1, size_sqft: 820, price: 1650000, agent_id: "u-a1" }),
    P(3, { title: "Luxury 5BR signature villa", type: "Villa", area: "Palm Jumeirah", building: "Frond N", bedrooms: 5, size_sqft: 7200, price: 28500000, agent_id: "u-a2" }),
    P(4, { title: "4BR townhouse, single row", type: "Townhouse", area: "Dubai Hills Estate", building: "Maple 2", bedrooms: 4, size_sqft: 3100, price: 4300000, agent_id: "u-a2" }),
    P(5, { title: "Studio, canal view", type: "Studio", area: "Business Bay", building: "Executive Towers", bedrooms: 0, size_sqft: 480, price: 780000, agent_id: "u-a1" }),
    P(6, { title: "2BR brand-new, pool view", area: "JVC", building: "Binghatti Orchid", bedrooms: 2, size_sqft: 1150, price: 1350000, agent_id: "u-a3" }),
    P(7, { title: "1BR for rent, chiller free", listing_type: "rent", area: "JLT", building: "Lake View", bedrooms: 1, size_sqft: 760, price: 85000, agent_id: "u-a3" }),
    P(8, { title: "3BR villa, upgraded", type: "Villa", area: "Arabian Ranches", building: "Palma", bedrooms: 3, size_sqft: 3400, price: 5100000, status: "reserved", agent_id: "u-a2" }),
    P(9, { title: "Penthouse with private pool", type: "Penthouse", area: "Dubai Marina", building: "Princess Tower", bedrooms: 4, size_sqft: 4800, price: 9800000, status: "sold", agent_id: "u-a1" }),
  ];

  const L = (n: number, o: Partial<Tables["leads"]>): Tables["leads"] => ({
    id: `l-${n}`, created_at: ago(n * D * 0.6), name: "", phone: "+9715000000" + (10 + n), email: "", source: "Property Finder",
    client_type: "buyer", budget: 0, preferred_area: "", property_type: "Apartment", purpose: "End-use", timeline: "1-3 months",
    temperature: "warm", stage: "new", assigned_to: null, follow_up_at: null, first_contact_at: null, lost_reason: "",
    lost_followup_at: null, consent_marketing: true, notes: "", closed_at: null, ...o,
  });
  const lc = (n: number, mins: number) => new Date(Date.now() - n * D * 0.6 + mins * 60000).toISOString();

  const leads = [
    L(0, { name: "Khalid Al Mansoori", source: "Bayut", budget: 3500000, preferred_area: "Downtown Dubai", temperature: "hot", created_at: ago(0.5 * H) }),
    L(1, { name: "Natalia Ivanova", source: "Instagram", budget: 1700000, preferred_area: "Dubai Marina", temperature: "hot", stage: "contacted", assigned_to: "u-a1", first_contact_at: lc(1, 6), follow_up_at: ahead(3 * H) }),
    L(2, { name: "James Whitfield", source: "Website", budget: 30000000, preferred_area: "Palm Jumeirah", property_type: "Villa", purpose: "Investment", temperature: "hot", stage: "qualified", assigned_to: "u-a2", first_contact_at: lc(2, 4), follow_up_at: ahead(20 * H), notes: "UK investor, cash buyer." }),
    L(3, { name: "Priya Nair", source: "Property Finder", client_type: "tenant", budget: 90000, preferred_area: "JLT", temperature: "warm", stage: "property_matched", assigned_to: "u-a3", first_contact_at: lc(3, 12), follow_up_at: ahead(6 * H) }),
    L(4, { name: "Ahmed Sultan", source: "Referral", budget: 4500000, preferred_area: "Dubai Hills Estate", property_type: "Townhouse", temperature: "hot", stage: "viewing_scheduled", assigned_to: "u-a2", first_contact_at: lc(4, 3), follow_up_at: ahead(1 * D) }),
    L(5, { name: "Chen Wei", source: "Dubizzle", budget: 1400000, preferred_area: "JVC", purpose: "Investment", temperature: "warm", stage: "negotiation", assigned_to: "u-a3", first_contact_at: lc(5, 25), follow_up_at: ahead(5 * H) }),
    L(6, { name: "Fatima Zahra", source: "Facebook", budget: 5200000, preferred_area: "Arabian Ranches", property_type: "Villa", temperature: "hot", stage: "documentation", assigned_to: "u-a2", first_contact_at: lc(6, 8) }),
    L(7, { name: "Dmitri Volkov", source: "Referral", budget: 9800000, preferred_area: "Dubai Marina", property_type: "Penthouse", temperature: "hot", stage: "closed_won", assigned_to: "u-a1", first_contact_at: lc(7, 5), closed_at: ago(2 * D) }),
    L(8, { name: "Sophie Laurent", source: "Bayut", budget: 800000, preferred_area: "Business Bay", property_type: "Studio", purpose: "Investment", temperature: "cold", stage: "closed_lost", assigned_to: "u-a1", first_contact_at: lc(8, 45), lost_reason: "Bought elsewhere", lost_followup_at: ahead(30 * D), closed_at: ago(4 * D), notes: "Bought off-plan with another agency." }),
    L(9, { name: "Yusuf Demir", source: "TikTok", budget: 1200000, preferred_area: "JVC", temperature: "cold", stage: "new", created_at: ago(2 * H) }),
    L(10, { name: "Anna Kowalski", source: "Website", budget: 2200000, preferred_area: "Business Bay", temperature: "warm", stage: "contacted", assigned_to: "u-a1", first_contact_at: lc(10, 90), follow_up_at: ago(2 * H) }),
    L(11, { name: "Mohammed Rashid", source: "WhatsApp", client_type: "seller", budget: 3100000, preferred_area: "Downtown Dubai", temperature: "warm", stage: "qualified", assigned_to: "u-a1", first_contact_at: lc(11, 15), follow_up_at: ahead(2 * D), notes: "Wants to list 2BR in Boulevard Point." }),
    L(12, { name: "Elena Rossi", source: "Dubizzle", budget: 1000000, preferred_area: "Al Barsha", temperature: "cold", stage: "closed_lost", assigned_to: "u-a3", first_contact_at: lc(12, 60), lost_reason: "Budget too low", lost_followup_at: ago(1 * D), closed_at: ago(6 * D), consent_marketing: true }),
  ];

  const viewings: Tables["viewings"][] = [
    { id: "v-1", created_at: ago(3 * D), lead_id: "l-4", property_id: "pr-4", agent_id: "u-a2", scheduled_at: ahead(1 * D + 3 * H), status: "scheduled", feedback: "", next_action: "", reminder_sent: false },
    { id: "v-2", created_at: ago(5 * D), lead_id: "l-5", property_id: "pr-6", agent_id: "u-a3", scheduled_at: ago(3 * D), status: "completed", feedback: "Liked layout, wants a lower price.", next_action: "Submit offer at AED 1.3M", reminder_sent: true },
    { id: "v-3", created_at: ago(8 * D), lead_id: "l-7", property_id: "pr-9", agent_id: "u-a1", scheduled_at: ago(6 * D), status: "completed", feedback: "Loved it.", next_action: "Negotiate", reminder_sent: true },
    { id: "v-4", created_at: ago(2 * D), lead_id: "l-6", property_id: "pr-8", agent_id: "u-a2", scheduled_at: ago(1 * D), status: "completed", feedback: "Ready to proceed.", next_action: "Prepare Form F", reminder_sent: true },
    { id: "v-5", created_at: ago(1 * D), lead_id: "l-3", property_id: "pr-7", agent_id: "u-a3", scheduled_at: ahead(5 * H), status: "scheduled", feedback: "", next_action: "", reminder_sent: false },
  ];
  const offers: Tables["offers"][] = [
    { id: "o-1", created_at: ago(2.5 * D), lead_id: "l-5", property_id: "pr-6", amount: 1300000, kind: "offer", from_party: "Buyer", status: "rejected", notes: "" },
    { id: "o-2", created_at: ago(2 * D), lead_id: "l-5", property_id: "pr-6", amount: 1340000, kind: "counter", from_party: "Seller", status: "pending", notes: "Seller firm at 1.34M" },
    { id: "o-3", created_at: ago(5 * D), lead_id: "l-7", property_id: "pr-9", amount: 9800000, kind: "offer", from_party: "Buyer", status: "accepted", notes: "" },
    { id: "o-4", created_at: ago(0.8 * D), lead_id: "l-6", property_id: "pr-8", amount: 5100000, kind: "offer", from_party: "Buyer", status: "accepted", notes: "" },
  ];
  const deals: Tables["deals"][] = [
    { id: "d-1", created_at: ago(4 * D), lead_id: "l-7", property_id: "pr-9", agent_id: "u-a1", agreed_price: 9800000, commission_pct: 2, commission_amount: 196000, status: "won", checklist: { docs_verified: true, form_a: true, form_b: true, form_f: true, deposit: true, noc: true, mortgage: true, transfer: true }, notes: "", closed_at: ago(2 * D) },
    { id: "d-2", created_at: ago(0.6 * D), lead_id: "l-6", property_id: "pr-8", agent_id: "u-a2", agreed_price: 5100000, commission_pct: 2, commission_amount: 102000, status: "open", checklist: { docs_verified: true, form_a: true, form_b: true, form_f: false, deposit: false, noc: false, mortgage: false, transfer: false }, notes: "Buyer paying cash. NOC pending.", closed_at: null },
  ];
  const tasks: Tables["tasks"][] = [
    { id: "t-1", created_at: ago(2 * D), lead_id: "l-7", assigned_to: "u-a1", title: "30-day follow-up: ask for feedback & review", kind: "post_sale_30", due_at: ahead(28 * D), done: false },
    { id: "t-2", created_at: ago(2 * D), lead_id: "l-7", assigned_to: "u-a1", title: "90-day follow-up: request referral", kind: "post_sale_90", due_at: ahead(88 * D), done: false },
    { id: "t-3", created_at: ago(2 * D), lead_id: "l-7", assigned_to: "u-a1", title: "180-day follow-up: market update / new opportunities", kind: "post_sale_180", due_at: ahead(178 * D), done: false },
    { id: "t-4", created_at: ago(6 * D), lead_id: "l-12", assigned_to: "u-a3", title: "Re-engage lost lead (Budget too low)", kind: "lost_followup", due_at: ago(1 * D), done: false },
    { id: "t-5", created_at: ago(4 * D), lead_id: "l-8", assigned_to: "u-a1", title: "Re-engage lost lead (Bought elsewhere)", kind: "lost_followup", due_at: ahead(30 * D), done: false },
    { id: "t-6", created_at: ago(1 * D), lead_id: "l-2", assigned_to: "u-a2", title: "Send Palm Jumeirah villa shortlist with videos", kind: "follow_up", due_at: ahead(4 * H), done: false },
  ];
  const activities: Tables["activities"][] = [
    { id: "a-1", created_at: ago(3 * D), lead_id: "l-5", user_id: "u-a3", type: "viewing", text: "Viewing completed at Binghatti Orchid" },
    { id: "a-2", created_at: ago(2 * D), lead_id: "l-5", user_id: "u-a3", type: "offer", text: "Buyer offered AED 1,300,000 – rejected" },
  ];
  return { profiles, leads, properties, viewings, offers, deals, tasks, activities };
}
