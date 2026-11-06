import { DEMO_MODE, supabase } from "./supabase";
import { buildSeed } from "./seed";
import { TABLES, TableName, Tables } from "./types";

type Rows = { [K in TableName]: Tables[K][] };
const LS = (t: string) => `rj_crm_v1_${t}`;

function readLocal(): Rows {
  const out: any = {};
  let seeded = false;
  try { seeded = !!localStorage.getItem("rj_crm_v1_seeded"); } catch {}
  if (!seeded) {
    const seed = buildSeed();
    try {
      TABLES.forEach((t) => localStorage.setItem(LS(t), JSON.stringify(seed[t])));
      localStorage.setItem("rj_crm_v1_seeded", "1");
    } catch {}
    return seed;
  }
  TABLES.forEach((t) => {
    try { out[t] = JSON.parse(localStorage.getItem(LS(t)) || "[]"); } catch { out[t] = []; }
  });
  return out;
}
const writeLocal = (t: TableName, rows: unknown[]) => {
  try { localStorage.setItem(LS(t), JSON.stringify(rows)); } catch {}
};

export async function loadAll(): Promise<Rows> {
  if (DEMO_MODE) return readLocal();
  const out: any = {};
  await Promise.all(
    TABLES.map(async (t) => {
      const rows: any[] = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase().from(t).select("*").order("created_at", { ascending: false }).range(from, from + 999);
        if (error) throw new Error(`${t}: ${error.message}`);
        rows.push(...(data || []));
        if (!data || data.length < 1000) break;
      }
      out[t] = rows;
    })
  );
  return out;
}

export async function dbInsert<T extends TableName>(t: T, row: Tables[T], all: Tables[T][]): Promise<Tables[T]> {
  if (DEMO_MODE) { writeLocal(t, [row, ...all]); return row; }
  const { data, error } = await supabase().from(t).insert(row as any).select().single();
  if (error) throw new Error(error.message);
  return data as Tables[T];
}
export async function dbUpdate<T extends TableName>(t: T, id: string, patch: Partial<Tables[T]>, all: Tables[T][]): Promise<Tables[T]> {
  if (DEMO_MODE) {
    const next = all.map((r) => (r.id === id ? { ...r, ...patch } : r));
    writeLocal(t, next); return next.find((r) => r.id === id)!;
  }
  const { data, error } = await supabase().from(t).update(patch as any).eq("id", id).select().single();
  if (error) throw new Error(error.message);
  return data as Tables[T];
}
export async function dbRemove<T extends TableName>(t: T, id: string, all: Tables[T][]): Promise<void> {
  if (DEMO_MODE) { writeLocal(t, all.filter((r) => r.id !== id)); return; }
  const { error } = await supabase().from(t).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
export function resetDemo() {
  try { TABLES.forEach((t) => localStorage.removeItem(LS(t))); localStorage.removeItem("rj_crm_v1_seeded"); localStorage.removeItem("rj_crm_v1_user"); } catch {}
}
