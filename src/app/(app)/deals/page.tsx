"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge, Empty, PageHeader, Stat, useAsync } from "@/components/ui";
import { useActions } from "@/lib/actions";
import { DEAL_CHECKLIST } from "@/lib/constants";
import { useData } from "@/lib/data";
import type { Deal } from "@/lib/types";
import { cx, fmtDate, money } from "@/lib/utils";

export default function Deals() {
  const { scoped, data, update } = useData();
  const act = useActions();
  const run = useAsync();
  const [tab, setTab] = useState<"open" | "won" | "lost">("open");
  const deals = scoped.deals.filter((d) => d.status === tab).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const open = scoped.deals.filter((d) => d.status === "open");
  const pipelineValue = open.reduce((a, d) => a + d.commission_amount, 0);
  const wonValue = scoped.deals.filter((d) => d.status === "won").reduce((a, d) => a + d.commission_amount, 0);

  return (
    <>
      <PageHeader title="Deals & documentation" sub="Form A / B / F, deposit, NOC, mortgage and transfer tracking" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Open deals" value={open.length} />
        <Stat label="Expected commission" value={money(pipelineValue)} accent="#f59e0b" />
        <Stat label="Won deals" value={scoped.deals.filter((d) => d.status === "won").length} accent="#16a34a" />
        <Stat label="Commission earned" value={money(wonValue)} accent="#16a34a" />
      </div>
      <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 w-fit border border-ink-100">
        {(["open", "won", "lost"] as const).map((k) => <button key={k} onClick={() => setTab(k)} className={cx("px-3.5 py-1.5 text-sm rounded-md font-semibold capitalize", tab === k ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50")}>{k}</button>)}
      </div>
      {deals.length === 0 ? <div className="card"><Empty>No {tab} deals. Deals are created automatically when a lead reaches “Documentation”.</Empty></div> : (
        <div className="grid xl:grid-cols-2 gap-4">
          {deals.map((d) => <DealCard key={d.id} d={d} />)}
        </div>
      )}
    </>
  );

  function DealCard({ d }: { d: Deal }) {
    const lead = data.leads.find((l) => l.id === d.lead_id);
    const prop = data.properties.find((p) => p.id === d.property_id);
    const done = DEAL_CHECKLIST.filter((c) => d.checklist[c.key]).length;
    const locked = d.status !== "open";
    return (
      <div className="card p-4">
        <div className="flex justify-between gap-2 items-start">
          <div>
            {lead ? <Link href={`/leads/${lead.id}`} className="font-bold text-lg hover:underline">{lead.name}</Link> : <b>Deal</b>}
            <div className="text-sm text-ink-500">{prop ? `${prop.ref} · ${prop.title}` : "No property linked"}</div>
          </div>
          <Badge color={d.status === "won" ? "#16a34a" : d.status === "lost" ? "#dc2626" : "#e8a317"} className="capitalize">{d.status}{d.closed_at && ` · ${fmtDate(d.closed_at)}`}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div><label className="label">Agreed price</label><input disabled={locked} className="input" type="number" defaultValue={d.agreed_price} onBlur={(e) => Number(e.target.value) !== d.agreed_price && run(() => act.saveDeal(d, { agreed_price: Number(e.target.value) }))} /></div>
          <div><label className="label">Commission %</label><input disabled={locked} className="input" type="number" step="0.1" defaultValue={d.commission_pct} onBlur={(e) => Number(e.target.value) !== d.commission_pct && run(() => act.saveDeal(d, { commission_pct: Number(e.target.value) }))} /></div>
          <div><label className="label">Commission</label><div className="py-2 text-sm font-bold text-green-700">{money(d.commission_amount)}</div></div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-ink-500 mb-1"><span>Checklist</span><span>{done}/{DEAL_CHECKLIST.length}</span></div>
          <div className="h-1.5 bg-ink-100 rounded mb-2"><div className="h-1.5 bg-brand-500 rounded" style={{ width: `${(done / DEAL_CHECKLIST.length) * 100}%` }} /></div>
          <ul className="grid sm:grid-cols-2 gap-x-4">
            {DEAL_CHECKLIST.map((c) => (
              <li key={c.key}>
                <label className="flex items-start gap-2 py-1.5 text-sm cursor-pointer" title={c.hint}>
                  <input type="checkbox" className="mt-1" disabled={locked} checked={!!d.checklist[c.key]} onChange={() => run(() => act.toggleChecklist(d, c.key))} />
                  <span className={d.checklist[c.key] ? "text-ink-400 line-through" : ""}>{c.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <textarea disabled={locked} className="input mt-3" rows={2} placeholder="Deal notes (e.g. waiting for developer NOC)…" defaultValue={d.notes} onBlur={(e) => e.target.value !== d.notes && run(() => update("deals", d.id, { notes: e.target.value }))} />

        {!locked && lead && (
          <div className="flex flex-wrap gap-2 mt-3 justify-end">
            <button className="btn-danger btn-sm" onClick={() => confirm("Mark this deal as lost?") && run(() => act.changeStage(lead, "closed_lost", { lost_reason: "Price not agreed" }))}>Deal fell through</button>
            <button className="btn-primary" onClick={() => {
              if (done < DEAL_CHECKLIST.length && !confirm(`Only ${done}/${DEAL_CHECKLIST.length} checklist items are ticked. Close as won anyway?`)) return;
              run(() => act.changeStage(lead, "closed_won"));
            }}>🏆 Close as Won</button>
          </div>
        )}
        {d.status === "won" && lead && lead.stage === "closed_won" && (
          <div className="flex justify-end mt-3"><button className="btn-ghost btn-sm" onClick={() => run(() => act.changeStage(lead, "post_sale"))}>Move to Post-Sale Follow-up</button></div>
        )}
      </div>
    );
  }
}
