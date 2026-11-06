"use client";
import Link from "next/link";
import { useState } from "react";
import { LeadForm, LostModal } from "@/components/forms";
import { PageHeader, TempBadge, useAsync } from "@/components/ui";
import { useActions } from "@/lib/actions";
import { STAGES } from "@/lib/constants";
import { useData } from "@/lib/data";
import type { Lead } from "@/lib/types";
import { cx, isOverdue, moneyShort } from "@/lib/utils";

export default function Pipeline() {
  const { scoped, data } = useData();
  const act = useActions();
  const run = useAsync();
  const [drag, setDrag] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [lost, setLost] = useState<Lead | null>(null);
  const [adding, setAdding] = useState(false);

  function drop(stage: string) {
    setOver(null);
    const lead = scoped.leads.find((l) => l.id === drag);
    setDrag(null);
    if (!lead || lead.stage === stage) return;
    if (stage === "closed_lost") setLost(lead);
    else run(() => act.changeStage(lead, stage));
  }

  return (
    <>
      <PageHeader title="Pipeline" sub="Drag a lead card to move it to the next stage" actions={<button className="btn-primary" onClick={() => setAdding(true)}>+ New lead</button>} />
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {STAGES.map((s) => {
          const items = scoped.leads.filter((l) => l.stage === s.key).sort((a, b) => b.created_at.localeCompare(a.created_at));
          const total = items.reduce((a, l) => a + (l.budget || 0), 0);
          return (
            <div key={s.key} className={cx("w-72 shrink-0 rounded-xl bg-ink-100/70 flex flex-col max-h-[calc(100vh-190px)]", over === s.key && "ring-2 ring-brand-400")}
              onDragOver={(e) => { e.preventDefault(); setOver(s.key); }} onDragLeave={() => setOver(null)} onDrop={() => drop(s.key)}>
              <div className="px-3 pt-3 pb-2" style={{ borderTop: `3px solid ${s.color}`, borderRadius: "12px 12px 0 0" }}>
                <div className="flex justify-between items-center"><span className="font-bold text-sm">{s.label}</span><span className="text-xs font-bold bg-white rounded-full px-2 py-0.5">{items.length}</span></div>
                <div className="text-xs text-ink-400">{total ? moneyShort(total) : "—"}</div>
              </div>
              <div className="px-2 pb-2 space-y-2 overflow-y-auto">
                {items.map((l) => (
                  <div key={l.id} draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => { setDrag(null); setOver(null); }}
                    className={cx("bg-white rounded-lg p-3 shadow-sm border border-ink-100 cursor-grab active:cursor-grabbing", drag === l.id && "opacity-40")}>
                    <div className="flex justify-between gap-2"><Link href={`/leads/${l.id}`} className="font-semibold text-sm hover:underline">{l.name}</Link><TempBadge t={l.temperature} /></div>
                    <div className="text-xs text-ink-500 mt-1">{l.budget ? moneyShort(l.budget) : "No budget"} · {l.preferred_area || "Any area"}</div>
                    <div className="flex justify-between items-center mt-2 text-[11px]">
                      <span className="text-ink-400">{data.profiles.find((p) => p.id === l.assigned_to)?.full_name.split(" ")[0] ?? "Unassigned"}</span>
                      {l.follow_up_at && s.key !== "closed_won" && s.key !== "closed_lost" && <span className={isOverdue(l.follow_up_at) ? "text-red-600 font-bold" : "text-ink-400"}>{isOverdue(l.follow_up_at) ? "Overdue" : "Follow-up set"}</span>}
                    </div>
                    {/* tap-friendly stage move for touch devices where drag & drop is unavailable */}
                    <select aria-label="Move to stage" className="mt-2 w-full text-xs border border-ink-200 rounded px-1 py-1 lg:hidden" value={l.stage}
                      onChange={(e) => e.target.value === "closed_lost" ? setLost(l) : run(() => act.changeStage(l, e.target.value))}>
                      {STAGES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {lost && <LostModal lead={lost} onClose={() => setLost(null)} onConfirm={async (x) => { await act.changeStage(lost, "closed_lost", x); setLost(null); }} />}
      {adding && <LeadForm onClose={() => setAdding(false)} />}
    </>
  );
}
