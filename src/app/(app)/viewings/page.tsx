"use client";
import Link from "next/link";
import { useState } from "react";
import { ViewingForm } from "@/components/forms";
import { Badge, Empty, PageHeader, Table, useAsync } from "@/components/ui";
import { useData } from "@/lib/data";
import type { Viewing } from "@/lib/types";
import { cx, fmtDateTime, isToday, waLink } from "@/lib/utils";

const TABS = [["upcoming", "Upcoming"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["all", "All"]];
const COL: Record<string, string> = { scheduled: "#d946ef", completed: "#16a34a", cancelled: "#dc2626" };

export default function Viewings() {
  const { scoped, data, update } = useData();
  const run = useAsync();
  const [tab, setTab] = useState("upcoming");
  const [form, setForm] = useState<Viewing | "new" | null>(null);
  const rows = scoped.viewings.filter((v) => tab === "all" || (tab === "upcoming" ? v.status === "scheduled" : v.status === tab))
    .sort((a, b) => (tab === "upcoming" ? a.scheduled_at.localeCompare(b.scheduled_at) : b.scheduled_at.localeCompare(a.scheduled_at)));

  return (
    <>
      <PageHeader title="Viewings" sub="Schedule, confirm and record feedback" actions={<button className="btn-primary" onClick={() => setForm("new")}>+ Schedule viewing</button>} />
      <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 w-fit border border-ink-100">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx("px-3.5 py-1.5 text-sm rounded-md font-semibold", tab === k ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50")}>{l}</button>)}
      </div>
      <Table head={["When", "Lead", "Property", "Agent", "Status", "Feedback / next action", ""]}>
        {rows.length === 0 && <tr><td colSpan={7}><Empty>Nothing here.</Empty></td></tr>}
        {rows.map((v) => {
          const lead = scoped.leads.find((l) => l.id === v.lead_id);
          const prop = data.properties.find((p) => p.id === v.property_id);
          const msg = lead ? `Hello ${lead.name.split(" ")[0]}, a friendly reminder of your viewing${prop ? ` of ${prop.title} (${prop.area})` : ""} on ${fmtDateTime(v.scheduled_at)}. Please reply to confirm. – Royal Journey` : "";
          return (
            <tr key={v.id}>
              <td className={cx("td whitespace-nowrap font-semibold", isToday(v.scheduled_at) && v.status === "scheduled" && "text-brand-700")}>{fmtDateTime(v.scheduled_at)}{isToday(v.scheduled_at) && v.status === "scheduled" && <span className="ml-1 text-[10px] bg-brand-100 rounded px-1">TODAY</span>}</td>
              <td className="td">{lead ? <Link className="font-semibold hover:underline" href={`/leads/${lead.id}`}>{lead.name}</Link> : "—"}</td>
              <td className="td text-ink-600">{prop?.title ?? "—"}<div className="text-xs text-ink-400">{prop?.area}</div></td>
              <td className="td text-ink-600">{data.profiles.find((p) => p.id === v.agent_id)?.full_name ?? "—"}</td>
              <td className="td"><Badge color={COL[v.status]} className="capitalize">{v.status}</Badge></td>
              <td className="td text-xs text-ink-500 max-w-[260px]">{v.feedback || "—"}{v.next_action && <div className="font-semibold text-ink-700">→ {v.next_action}</div>}</td>
              <td className="td whitespace-nowrap space-x-1">
                {v.status === "scheduled" && lead && <a className="btn-primary btn-sm" target="_blank" rel="noreferrer" href={waLink(lead.phone, msg)} onClick={() => run(() => update("viewings", v.id, { reminder_sent: true }))}>{v.reminder_sent ? "Resend reminder" : "WhatsApp reminder"}</a>}
                <button className="btn-ghost btn-sm" onClick={() => setForm(v)}>Update</button>
              </td>
            </tr>
          );
        })}
      </Table>
      {form && <ViewingForm viewing={form === "new" ? undefined : form} onClose={() => setForm(null)} />}
    </>
  );
}
