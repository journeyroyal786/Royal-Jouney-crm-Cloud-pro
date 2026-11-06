"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { useAuth } from "./auth";
import { dbInsert, dbRemove, dbUpdate, loadAll, resetDemo } from "./backend";
import { TABLES, TableName, Tables } from "./types";
import { nowISO, uid } from "./utils";

type Rows = { [K in TableName]: Tables[K][] };
const empty = (): Rows => ({ profiles: [], leads: [], properties: [], viewings: [], offers: [], deals: [], tasks: [], activities: [] });

const DEFAULTS: { [K in TableName]: Omit<Tables[K], "id" | "created_at"> } = {
  profiles: { full_name: "", email: "", role: "agent", phone: "", specialization_areas: "", specialization_types: "", active: true },
  leads: {
    name: "", phone: "", email: "", source: "Website", client_type: "buyer", budget: 0, preferred_area: "", property_type: "Apartment",
    purpose: "End-use", timeline: "", temperature: "warm", stage: "new", assigned_to: null, follow_up_at: null, first_contact_at: null,
    lost_reason: "", lost_followup_at: null, consent_marketing: false, notes: "", closed_at: null,
  },
  properties: {
    ref: "", title: "", type: "Apartment", listing_type: "sale", area: "", building: "", bedrooms: 1, size_sqft: 0, price: 0, status: "available",
    owner_name: "", owner_phone: "", permit_no: "", photos_url: "", video_url: "", agent_id: null,
  },
  viewings: { lead_id: "", property_id: null, agent_id: null, scheduled_at: nowISO(), status: "scheduled", feedback: "", next_action: "", reminder_sent: false },
  offers: { lead_id: "", property_id: null, amount: 0, kind: "offer", from_party: "Buyer", status: "pending", notes: "" },
  deals: {
    lead_id: "", property_id: null, agent_id: null, agreed_price: 0, commission_pct: 2, commission_amount: 0, status: "open",
    checklist: {}, notes: "", closed_at: null,
  },
  tasks: { lead_id: null, assigned_to: null, title: "", kind: "follow_up", due_at: nowISO(), done: false },
  activities: { lead_id: "", user_id: null, type: "note", text: "" },
};

interface Store {
  data: Rows;           // everything
  scoped: Rows;         // what the signed-in user is allowed to see
  loading: boolean; error: string;
  insert: <T extends TableName>(t: T, row: Partial<Tables[T]>) => Promise<Tables[T]>;
  update: <T extends TableName>(t: T, id: string, patch: Partial<Tables[T]>) => Promise<Tables[T]>;
  remove: (t: TableName, id: string) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}
const Ctx = createContext<Store | null>(null);
export const useData = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("DataProvider missing");
  return c;
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<Rows>(empty);
  const ref = useRef<Rows>(data);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const put = (d: Rows) => { ref.current = d; setData(d); };

  const refresh = useCallback(async () => {
    try { setError(""); put(await loadAll()); }
    catch (e: any) { setError(e.message || "Failed to load data"); }
    setLoading(false);
  }, []);
  useEffect(() => { if (user) refresh(); }, [user, refresh]);

  const insert: Store["insert"] = async (t, partial) => {
    const row = { ...DEFAULTS[t], ...partial, id: uid(), created_at: nowISO() } as Tables[typeof t];
    const saved = await dbInsert(t, row, ref.current[t] as any);
    put({ ...ref.current, [t]: [saved, ...ref.current[t]] });
    return saved as any;
  };
  const update: Store["update"] = async (t, id, patch) => {
    const saved = await dbUpdate(t, id, patch as any, ref.current[t] as any);
    put({ ...ref.current, [t]: ref.current[t].map((r: any) => (r.id === id ? { ...r, ...saved } : r)) });
    return saved as any;
  };
  const remove: Store["remove"] = async (t, id) => {
    await dbRemove(t, id, ref.current[t] as any);
    put({ ...ref.current, [t]: ref.current[t].filter((r: any) => r.id !== id) });
  };
  const reset = async () => { resetDemo(); window.location.href = "/login"; };

  // Agents only see their own leads and everything attached to them.
  const scoped = useMemo<Rows>(() => {
    if (!user || user.role !== "agent") return data;
    const leads = data.leads.filter((l) => l.assigned_to === user.id);
    const ids = new Set(leads.map((l) => l.id));
    return {
      ...data, leads,
      viewings: data.viewings.filter((v) => ids.has(v.lead_id)),
      offers: data.offers.filter((o) => ids.has(o.lead_id)),
      deals: data.deals.filter((d) => ids.has(d.lead_id)),
      tasks: data.tasks.filter((t) => t.assigned_to === user.id || (t.lead_id && ids.has(t.lead_id))),
      activities: data.activities.filter((a) => ids.has(a.lead_id)),
    };
  }, [data, user]);

  return <Ctx.Provider value={{ data, scoped, loading, error, insert, update, remove, refresh, reset }}>{children}</Ctx.Provider>;
}
export { TABLES };
