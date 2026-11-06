"use client";
import Link from "next/link";
import { useState } from "react";
import { Empty, PageHeader, useAsync } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { cx, fmtDate, isOverdue, isToday, waLink } from "@/lib/utils";

const TABS = [["due", "Due & overdue"], ["upcoming", "Upcoming"], ["done", "Completed"]];
const KIND: Record<string, string> = { post_sale_30: "Post-sale 30d", post_sale_90: "Post-sale 90d", post_sale_180: "Post-sale 180d", lost_followup: "Lost lead", follow_up: "Follow-up" };

export default function Followups() {
  const { scoped, data, update, insert } = useData();
  const { user } = useAuth();
  const run = useAsync();
  const [tab, setTab] = useState("due");
  const endOfToday = new Date(); endOfToday.setHours(23, 59, 59, 999);
  const rows = scoped.tasks.filter((t) => tab === "done" ? t.done : !t.done && (tab === "due" ? new Date(t.due_at) <= endOfToday : new Date(t.due_at) > endOfToday))
    .sort((a, b) => (tab === "done" ? b.due_at.localeCompare(a.due_at) : a.due_at.localeCompare(b.due_at)));

  return (
    <>
      <PageHeader title="Follow-ups" sub="Daily task list, post-sale (30 / 90 / 180 days) and lost-lead re-engagement"
        actions={<button className="btn-primary" onClick={() => {
          const title = prompt("Task description"); if (!title) return;
          const when = prompt("Due date (YYYY-MM-DD)", new Date(Date.now() + 86400000).toISOString().slice(0, 10)); if (!when) return;
          run(() => insert("tasks", { title, due_at: new Date(when + "T09:00").toISOString(), assigned_to: user?.id ?? null, kind: "follow_up" }));
        }}>+ New task</button>} />
      <div className="flex gap-1 mb-4 bg-white rounded-lg p-1 w-fit border border-ink-100">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx("px-3.5 py-1.5 text-sm rounded-md font-semibold", tab === k ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-ink-50")}>{l}</button>)}
      </div>
      <div className="card divide-y divide-ink-100">
        {rows.length === 0 && <Empty>Nothing here 🎉</Empty>}
        {rows.map((t) => {
          const lead = data.leads.find((l) => l.id === t.lead_id);
          return (
            <div key={t.id} className="flex items-start gap-3 p-3.5">
              <input type="checkbox" className="mt-1.5 h-4 w-4" checked={t.done} onChange={() => run(() => update("tasks", t.id, { done: !t.done }))} />
              <div className="flex-1 min-w-0">
                <div className={cx("text-sm font-semibold", t.done && "line-through text-ink-300")}>{t.title}</div>
                <div className="text-xs text-ink-400 flex flex-wrap gap-x-3">
                  <span className={cx(!t.done && isOverdue(t.due_at) && !isToday(t.due_at) && "text-red-600 font-bold")}>{isToday(t.due_at) ? "Today" : fmtDate(t.due_at)}</span>
                  <span className="bg-ink-100 rounded px-1.5">{KIND[t.kind] ?? t.kind}</span>
                  {lead && <Link href={`/leads/${lead.id}`} className="underline">{lead.name}</Link>}
                  <span>{data.profiles.find((p) => p.id === t.assigned_to)?.full_name}</span>
                </div>
              </div>
              {lead && !t.done && <a className="btn-ghost btn-sm" target="_blank" rel="noreferrer" href={waLink(lead.phone)}>WhatsApp</a>}
            </div>
          );
        })}
      </div>
    </>
  );
}
