"use client";
import { useAuth } from "./auth";
import { useData } from "./data";
import { DEAL_CHECKLIST, DEFAULT_COMMISSION_PCT, OPEN_STAGES, STAGES, stageLabel } from "./constants";
import type { Deal, Lead, Profile, Property } from "./types";
import { addDays, money, nowISO } from "./utils";

const csv = (s: string) => (s || "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);
const stageIdx = (k: string) => STAGES.findIndex((s) => s.key === k);

/** Pure helper: which agent best fits this lead (area + property specialisation, then lowest workload). */
export function suggestAgent(lead: Pick<Lead, "preferred_area" | "property_type">, profiles: Profile[], leads: Lead[]): Profile | null {
  const agents = profiles.filter((p) => p.role === "agent" && p.active);
  if (!agents.length) return null;
  const load = (id: string) => leads.filter((l) => l.assigned_to === id && OPEN_STAGES.includes(l.stage)).length;
  const scored = agents.map((a) => {
    let s = 0;
    if (csv(a.specialization_areas).includes((lead.preferred_area || "").toLowerCase())) s += 10;
    if (csv(a.specialization_types).includes((lead.property_type || "").toLowerCase())) s += 5;
    return { a, s: s - load(a.id) * 0.5 };
  });
  scored.sort((x, y) => y.s - x.s);
  return scored[0].a;
}

/** Pure helper: available properties that fit the client's brief, best match first. */
export function matchProperties(lead: Lead, properties: Property[]): (Property & { score: number })[] {
  if (lead.client_type === "seller" || lead.client_type === "landlord") return [];
  const wantRent = lead.client_type === "tenant";
  return properties
    .filter((p) => p.status === "available" && (p.listing_type === "rent") === wantRent)
    .map((p) => {
      let score = 0;
      if (p.area && p.area === lead.preferred_area) score += 5;
      if (p.type === lead.property_type) score += 3;
      if (lead.budget > 0) {
        if (p.price <= lead.budget) score += 4;
        else if (p.price <= lead.budget * 1.1) score += 1;
        else score -= 10;
      }
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function useActions() {
  const store = useData();
  const { user } = useAuth();
  const { data, insert, update } = store;

  const log = (lead_id: string, type: string, text: string) =>
    insert("activities", { lead_id, user_id: user?.id ?? null, type, text });

  /** Creating a lead: optionally auto-assign, and log it. */
  async function createLead(input: Partial<Lead>, autoAssign = true) {
    let assigned = input.assigned_to ?? null;
    if (!assigned && user?.role === "agent") assigned = user.id;
    if (!assigned && autoAssign) assigned = suggestAgent({ preferred_area: input.preferred_area || "", property_type: input.property_type || "" }, data.profiles, data.leads)?.id ?? null;
    const lead = await insert("leads", { ...input, assigned_to: assigned });
    await log(lead.id, "created", `Lead created from ${lead.source}${assigned ? ` and assigned to ${data.profiles.find((p) => p.id === assigned)?.full_name}` : ""}`);
    return lead;
  }

  async function assignLead(lead: Lead, agentId: string | null) {
    await update("leads", lead.id, { assigned_to: agentId });
    const n = data.profiles.find((p) => p.id === agentId)?.full_name || "nobody";
    await log(lead.id, "assigned", `Assigned to ${n}`);
  }

  /** Record the first contact – this is what drives the "First Response Time" KPI. */
  async function recordContact(lead: Lead, how: string) {
    const patch: Partial<Lead> = {};
    if (!lead.first_contact_at) patch.first_contact_at = nowISO();
    if (lead.stage === "new") patch.stage = "contacted";
    if (Object.keys(patch).length) await update("leads", lead.id, patch);
    await log(lead.id, "contact", `Contacted via ${how}`);
  }

  async function ensureDeal(lead: Lead, propertyId?: string | null): Promise<Deal> {
    const existing = data.deals.find((d) => d.lead_id === lead.id);
    if (existing) return existing;
    const accepted = data.offers.filter((o) => o.lead_id === lead.id && o.status === "accepted").sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const pid = accepted?.property_id ?? propertyId ?? data.offers.find((o) => o.lead_id === lead.id)?.property_id ?? null;
    const prop = data.properties.find((p) => p.id === pid);
    const price = accepted?.amount ?? prop?.price ?? lead.budget ?? 0;
    return insert("deals", {
      lead_id: lead.id, property_id: pid, agent_id: lead.assigned_to,
      agreed_price: price, commission_pct: DEFAULT_COMMISSION_PCT,
      commission_amount: Math.round((price * DEFAULT_COMMISSION_PCT) / 100), checklist: {},
    });
  }

  /** Move a lead between pipeline stages, running the workflow rules from the CRM document. */
  async function changeStage(lead: Lead, stage: string, extra?: { lost_reason?: string; lost_followup_at?: string | null; consent_marketing?: boolean }) {
    if (stage === lead.stage) return;
    const patch: Partial<Lead> = { stage };
    // Anything beyond "New Lead" implies we made contact.
    if (stage !== "new" && !lead.first_contact_at) patch.first_contact_at = nowISO();

    if (stage === "documentation") await ensureDeal(lead);

    if (stage === "closed_won") {
      patch.closed_at = nowISO();
      const deal = await ensureDeal(lead);
      await update("deals", deal.id, { status: "won", closed_at: nowISO() });
      const base = new Date();
      const plan: [number, string, string][] = [
        [30, "post_sale_30", "30-day follow-up: thank-you, feedback & review request"],
        [90, "post_sale_90", "90-day follow-up: check satisfaction, ask for referrals"],
        [180, "post_sale_180", "180-day follow-up: market update & new opportunities"],
      ];
      const existing = data.tasks.filter((t) => t.lead_id === lead.id && t.kind.startsWith("post_sale"));
      for (const [days, kind, title] of plan)
        if (!existing.some((t) => t.kind === kind))
          await insert("tasks", { lead_id: lead.id, assigned_to: lead.assigned_to, title, kind, due_at: addDays(base, days) });
      patch.follow_up_at = addDays(base, 30);
    }

    if (stage === "closed_lost") {
      patch.closed_at = nowISO();
      patch.lost_reason = extra?.lost_reason || "Other";
      patch.lost_followup_at = extra?.lost_followup_at ?? addDays(new Date(), 90);
      if (extra?.consent_marketing !== undefined) patch.consent_marketing = extra.consent_marketing;
      const deal = data.deals.find((d) => d.lead_id === lead.id);
      if (deal) await update("deals", deal.id, { status: "lost", closed_at: nowISO() });
      await insert("tasks", {
        lead_id: lead.id, assigned_to: lead.assigned_to, kind: "lost_followup",
        title: `Re-engage lost lead (${patch.lost_reason})`, due_at: patch.lost_followup_at!,
      });
    }

    // Re-opening a closed lead
    if (OPEN_STAGES.includes(stage) && (lead.stage === "closed_lost" || lead.stage === "closed_won")) patch.closed_at = null;

    await update("leads", lead.id, patch);
    await log(lead.id, "stage", `Stage: ${stageLabel(lead.stage)} → ${stageLabel(stage)}${stage === "closed_lost" ? ` (${patch.lost_reason})` : ""}`);
  }

  /** Advance only if the lead is still before the target stage. */
  async function advanceTo(lead: Lead, stage: string) {
    if (stageIdx(lead.stage) < stageIdx(stage) && OPEN_STAGES.includes(lead.stage)) await changeStage(lead, stage);
  }

  async function saveDeal(deal: Deal, patch: Partial<Deal>) {
    const next = { ...deal, ...patch };
    const commission = patch.agreed_price !== undefined || patch.commission_pct !== undefined
      ? Math.round((next.agreed_price * next.commission_pct) / 100) : next.commission_amount;
    await update("deals", deal.id, { ...patch, commission_amount: commission });
  }

  async function toggleChecklist(deal: Deal, key: string) {
    const checklist = { ...deal.checklist, [key]: !deal.checklist[key] };
    await update("deals", deal.id, { checklist });
    const item = DEAL_CHECKLIST.find((c) => c.key === key)!;
    await log(deal.lead_id, "deal", `${item.label}: ${checklist[key] ? "done" : "unticked"}`);
  }

  async function addOffer(lead: Lead, o: { property_id: string | null; amount: number; kind: "offer" | "counter"; from_party: string; notes: string }) {
    await insert("offers", { lead_id: lead.id, ...o });
    await log(lead.id, "offer", `${o.from_party} ${o.kind === "offer" ? "offered" : "countered"} ${money(o.amount)}`);
    await advanceTo(lead, "negotiation");
  }

  return { log, createLead, assignLead, recordContact, changeStage, advanceTo, ensureDeal, saveDeal, toggleChecklist, addOffer };
}
