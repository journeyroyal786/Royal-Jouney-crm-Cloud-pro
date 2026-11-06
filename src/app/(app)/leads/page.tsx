"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LeadForm } from "@/components/forms";
import { Badge, Empty, PageHeader, Select, Table, TempBadge } from "@/components/ui";
import { SOURCES, STAGES, stageColor, stageLabel } from "@/lib/constants";
import { useData } from "@/lib/data";
import { downloadCSV, fmtDateTime, fmtMinutes, isOverdue, minutesBetween, money, waLink } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

function LeadsInner() {
  const { scoped, data } = useData();
  const { user } = useAuth();
  const sp = useSearchParams();
  const [q, setQ] = useState("");
  const [stage, setStage] = useState(sp.get("stage") || "");
  const [temp, setTemp] = useState("");
  const [source, setSource] = useState("");
  const [agent, setAgent] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => scoped.leads.filter((l) =>
    (!q || [l.name, l.phone, l.email, l.preferred_area].join(" ").toLowerCase().includes(q.toLowerCase())) &&
    (!stage || l.stage === stage) && (!temp || l.temperature === temp) && (!source || l.source === source) &&
    (!agent || (agent === "none" ? !l.assigned_to : l.assigned_to === agent))
  ).sort((a, b) => b.created_at.localeCompare(a.created_at)), [scoped.leads, q, stage, temp, source, agent]);

  const who = (id: string | null) => data.profiles.find((p) => p.id === id)?.full_name ?? "—";

  return (
    <>
      <PageHeader title="Leads" sub={`${rows.length} of ${scoped.leads.length} leads`} actions={<>
        <button className="btn-ghost" onClick={() => downloadCSV("leads.csv", rows.map((l) => ({
          Name: l.name, Phone: l.phone, Email: l.email, Source: l.source, Type: l.client_type, Budget: l.budget, Area: l.preferred_area,
          Stage: stageLabel(l.stage), Temperature: l.temperature, Agent: who(l.assigned_to), Created: l.created_at })))}>Export CSV</button>
        <button className="btn-primary" onClick={() => setAdding(true)}>+ New lead</button>
      </>} />

      <div className="card p-3 mb-4 grid grid-cols-2 lg:grid-cols-5 gap-2">
        <input className="input col-span-2 lg:col-span-1" placeholder="Search name, phone, area…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={stage} onChange={setStage} placeholder="All stages" options={STAGES.map((s) => ({ value: s.key, label: s.label }))} />
        <Select value={temp} onChange={setTemp} placeholder="Any temperature" options={[{ value: "hot", label: "🔥 Hot" }, { value: "warm", label: "Warm" }, { value: "cold", label: "❄ Cold" }]} />
        <Select value={source} onChange={setSource} placeholder="All sources" options={SOURCES} />
        {user?.role !== "agent" && <Select value={agent} onChange={setAgent} placeholder="All agents" options={[{ value: "none", label: "Unassigned" }, ...data.profiles.filter((p) => p.role === "agent").map((p) => ({ value: p.id, label: p.full_name }))]} />}
      </div>

      <Table head={["Lead", "Source", "Budget / Area", "Temp", "Stage", "Agent", "Response", "Follow-up", ""]}>
        {rows.length === 0 && <tr><td colSpan={9}><Empty>No leads match your filters.</Empty></td></tr>}
        {rows.map((l) => (
          <tr key={l.id} className="hover:bg-brand-50/40">
            <td className="td"><Link href={`/leads/${l.id}`} className="font-semibold text-ink-900 hover:underline">{l.name}</Link><div className="text-xs text-ink-400">{l.phone}</div></td>
            <td className="td text-ink-600">{l.source}</td>
            <td className="td"><div>{l.budget ? money(l.budget) : "—"}</div><div className="text-xs text-ink-400">{l.preferred_area || "—"} · {l.property_type}</div></td>
            <td className="td"><TempBadge t={l.temperature} /></td>
            <td className="td"><Badge color={stageColor(l.stage)}>{stageLabel(l.stage)}</Badge></td>
            <td className="td text-ink-600">{who(l.assigned_to)}</td>
            <td className="td whitespace-nowrap">{l.first_contact_at ? fmtMinutes(minutesBetween(l.created_at, l.first_contact_at)) : <span className="text-red-600 font-semibold">Waiting</span>}</td>
            <td className={`td whitespace-nowrap ${isOverdue(l.follow_up_at) && !["closed_won", "closed_lost", "post_sale"].includes(l.stage) ? "text-red-600 font-semibold" : "text-ink-600"}`}>{fmtDateTime(l.follow_up_at)}</td>
            <td className="td"><a className="btn-ghost btn-sm" href={waLink(l.phone)} target="_blank" rel="noreferrer">WhatsApp</a></td>
          </tr>
        ))}
      </Table>
      {adding && <LeadForm onClose={() => setAdding(false)} />}
    </>
  );
}
export default function LeadsPage() { return <Suspense fallback={null}><LeadsInner /></Suspense>; }
