"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader, Stat, Table, Empty, Select } from "@/components/ui";
import { SOURCES, STAGES, WON_STAGES } from "@/lib/constants";
import { useData } from "@/lib/data";
import { fmtMinutes, isOverdue, minutesBetween, money, fmtDateTime } from "@/lib/utils";

const RANGES = [
  { value: "today", label: "Today" }, { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" }, { value: "month", label: "This month" }, { value: "all", label: "All time" },
];
function startOf(range: string): number {
  const d = new Date();
  if (range === "today") { d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (range === "month") { d.setDate(1); d.setHours(0, 0, 0, 0); return d.getTime(); }
  if (range === "all") return 0;
  return Date.now() - Number(range) * 86400000;
}

export default function Dashboard() {
  const { scoped, data } = useData();
  const [range, setRange] = useState("30");

  const k = useMemo(() => {
    const from = startOf(range);
    const inR = (s?: string | null) => !!s && new Date(s).getTime() >= from;
    const leads = scoped.leads.filter((l) => inR(l.created_at));
    const responded = leads.filter((l) => l.first_contact_at);
    const times = responded.map((l) => minutesBetween(l.created_at, l.first_contact_at!));
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
    const within10 = times.length ? Math.round((times.filter((t) => t <= 10).length / times.length) * 100) : null;
    const won = leads.filter((l) => WON_STAGES.includes(l.stage)).length;
    const viewings = scoped.viewings.filter((v) => v.status !== "cancelled" && inR(v.scheduled_at)).length;
    const offers = scoped.offers.filter((o) => o.kind === "offer" && inR(o.created_at)).length;
    const wonDeals = scoped.deals.filter((d) => d.status === "won" && inR(d.closed_at));
    const commission = wonDeals.reduce((a, d) => a + d.commission_amount, 0);
    const volume = wonDeals.reduce((a, d) => a + d.agreed_price, 0);

    const agents = data.profiles.filter((p) => p.role === "agent");
    const perf = agents.map((a) => {
      const ls = data.leads.filter((l) => l.assigned_to === a.id && inR(l.created_at));
      const ts = ls.filter((l) => l.first_contact_at).map((l) => minutesBetween(l.created_at, l.first_contact_at!));
      const ds = data.deals.filter((d) => d.agent_id === a.id && d.status === "won" && inR(d.closed_at));
      return {
        a, leads: ls.length,
        resp: ts.length ? ts.reduce((x, y) => x + y, 0) / ts.length : null,
        viewings: data.viewings.filter((v) => v.agent_id === a.id && v.status !== "cancelled" && inR(v.scheduled_at)).length,
        deals: ds.length, commission: ds.reduce((x, d) => x + d.commission_amount, 0),
        conv: ls.length ? Math.round((ls.filter((l) => WON_STAGES.includes(l.stage)).length / ls.length) * 100) : 0,
      };
    }).sort((x, y) => y.commission - x.commission || y.leads - x.leads);

    const funnel = STAGES.map((s) => ({ ...s, n: scoped.leads.filter((l) => l.stage === s.key).length }));
    const bySource = SOURCES.map((s) => ({ s, n: leads.filter((l) => l.source === s).length })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    const waiting = scoped.leads.filter((l) => l.stage === "new" && !l.first_contact_at);
    const overdue = scoped.tasks.filter((t) => !t.done && isOverdue(t.due_at));
    const overdueLeads = scoped.leads.filter((l) => l.follow_up_at && isOverdue(l.follow_up_at) && !["closed_won", "closed_lost", "post_sale"].includes(l.stage));
    return { leads: leads.length, avg, within10, conv: leads.length ? Math.round((won / leads.length) * 100) : 0, won, viewings, offers, deals: wonDeals.length, commission, volume, perf, funnel, bySource, waiting, overdue, overdueLeads };
  }, [scoped, data, range]);

  const maxF = Math.max(1, ...k.funnel.map((f) => f.n));
  const maxS = Math.max(1, ...k.bySource.map((f) => f.n));
  const name = (id: string | null) => data.profiles.find((p) => p.id === id)?.full_name ?? "Unassigned";

  return (
    <>
      <PageHeader title="Dashboard" sub="Daily KPIs for Royal Journey" actions={<Select className="w-44" value={range} onChange={setRange} options={RANGES} />} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="New Leads" value={k.leads} sub={`${scoped.leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length} today`} />
        <Stat label="First Response Time" value={fmtMinutes(k.avg)} sub={k.within10 !== null ? `${k.within10}% within 10 min` : "no data"} accent={k.avg !== null && k.avg > 10 ? "#dc2626" : "#16a34a"} />
        <Stat label="Lead Conversion" value={`${k.conv}%`} sub={`${k.won} won of ${k.leads} leads`} accent="#6366f1" />
        <Stat label="Viewings" value={k.viewings} accent="#d946ef" />
        <Stat label="Offers Received" value={k.offers} accent="#f59e0b" />
        <Stat label="Deals Closed" value={k.deals} sub={k.volume ? `Volume ${money(k.volume)}` : undefined} accent="#16a34a" />
        <div className="col-span-2"><Stat label="Revenue / Commission" value={money(k.commission)} sub="From deals closed in period" accent="#e8a317" /></div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <div className="card p-4 lg:col-span-2">
          <h2 className="font-bold mb-3">Pipeline</h2>
          <div className="space-y-2">
            {k.funnel.map((f) => (
              <Link href={`/leads?stage=${f.key}`} key={f.key} className="flex items-center gap-3 group">
                <div className="w-36 text-xs text-ink-600 truncate group-hover:text-ink-900">{f.label}</div>
                <div className="flex-1 bg-ink-50 rounded h-5"><div className="h-5 rounded" style={{ width: `${(f.n / maxF) * 100}%`, background: f.color, minWidth: f.n ? 6 : 0 }} /></div>
                <div className="w-6 text-right text-sm font-bold">{f.n}</div>
              </Link>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <h2 className="font-bold mb-3">Lead sources</h2>
          {k.bySource.length === 0 ? <Empty>No leads in this period</Empty> : (
            <div className="space-y-2">
              {k.bySource.map((x) => (
                <div key={x.s} className="flex items-center gap-2">
                  <div className="w-28 text-xs text-ink-600 truncate">{x.s}</div>
                  <div className="flex-1 bg-ink-50 rounded h-4"><div className="h-4 rounded bg-brand-500" style={{ width: `${(x.n / maxS) * 100}%` }} /></div>
                  <div className="w-5 text-right text-xs font-bold">{x.n}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <div className="card p-4">
          <h2 className="font-bold mb-3">⚡ Needs attention</h2>
          {k.waiting.length + k.overdue.length + k.overdueLeads.length === 0 ? <Empty>All clear 🎉</Empty> : (
            <ul className="divide-y divide-ink-100 text-sm">
              {k.waiting.map((l) => (
                <li key={l.id} className="py-2 flex justify-between gap-2">
                  <Link href={`/leads/${l.id}`} className="font-semibold hover:underline">{l.name}</Link>
                  <span className="text-red-600 text-xs font-semibold">Not contacted · {fmtMinutes(minutesBetween(l.created_at, new Date().toISOString()))} waiting</span>
                </li>
              ))}
              {k.overdueLeads.map((l) => (
                <li key={l.id} className="py-2 flex justify-between gap-2">
                  <Link href={`/leads/${l.id}`} className="font-semibold hover:underline">{l.name}</Link>
                  <span className="text-amber-600 text-xs font-semibold">Follow-up overdue · {fmtDateTime(l.follow_up_at)}</span>
                </li>
              ))}
              {k.overdue.slice(0, 5).map((t) => (
                <li key={t.id} className="py-2 flex justify-between gap-2">
                  <Link href={t.lead_id ? `/leads/${t.lead_id}` : "/followups"} className="hover:underline">{t.title}</Link>
                  <span className="text-amber-600 text-xs font-semibold whitespace-nowrap">Task overdue</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h2 className="font-bold mb-2">Agent performance</h2>
          <Table head={["Agent", "Leads", "Avg response", "Viewings", "Deals", "Commission"]}>
            {k.perf.length === 0 && <tr><td className="td" colSpan={6}><Empty>No agents yet</Empty></td></tr>}
            {k.perf.map((p) => (
              <tr key={p.a.id}>
                <td className="td font-semibold">{p.a.full_name}</td><td className="td">{p.leads}</td>
                <td className="td">{fmtMinutes(p.resp)}</td><td className="td">{p.viewings}</td>
                <td className="td">{p.deals}</td><td className="td font-semibold">{money(p.commission)}</td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </>
  );
}
