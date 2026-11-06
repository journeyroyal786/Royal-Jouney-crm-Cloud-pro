"use client";
import Link from "next/link";
import { PageHeader, Table, Empty, Badge, useAsync } from "@/components/ui";
import { useActions } from "@/lib/actions";
import { useData } from "@/lib/data";
import { downloadCSV, fmtDate, isOverdue, money, waLink } from "@/lib/utils";

export default function Lost() {
  const { scoped, data } = useData();
  const act = useActions();
  const run = useAsync();
  const rows = scoped.leads.filter((l) => l.stage === "closed_lost").sort((a, b) => (a.lost_followup_at || "").localeCompare(b.lost_followup_at || ""));
  const consenting = rows.filter((l) => l.consent_marketing);
  const reasons = Object.entries(rows.reduce<Record<string, number>>((m, l) => ((m[l.lost_reason] = (m[l.lost_reason] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <PageHeader title="Lost leads" sub={`${rows.length} lost · ${consenting.length} opted-in for campaigns`} actions={
        <button className="btn-ghost" disabled={!consenting.length} onClick={() => downloadCSV("campaign-list-consented.csv", consenting.map((l) => ({ Name: l.name, Phone: l.phone, Email: l.email, Area: l.preferred_area, Budget: l.budget, "Lost reason": l.lost_reason })))}>
          Export campaign list (consent only)
        </button>} />
      {reasons.length > 0 && <div className="flex flex-wrap gap-2 mb-4">{reasons.map(([r, n]) => <Badge key={r} color="#dc2626">{r} · {n}</Badge>)}</div>}
      <Table head={["Lead", "Budget", "Reason lost", "Agent", "Re-engage on", "Consent", ""]}>
        {rows.length === 0 && <tr><td colSpan={7}><Empty>No lost leads.</Empty></td></tr>}
        {rows.map((l) => (
          <tr key={l.id}>
            <td className="td"><Link href={`/leads/${l.id}`} className="font-semibold hover:underline">{l.name}</Link><div className="text-xs text-ink-400">{l.phone}</div></td>
            <td className="td">{l.budget ? money(l.budget) : "—"}</td>
            <td className="td">{l.lost_reason}</td>
            <td className="td text-ink-600">{data.profiles.find((p) => p.id === l.assigned_to)?.full_name ?? "—"}</td>
            <td className={`td whitespace-nowrap ${isOverdue(l.lost_followup_at) ? "text-red-600 font-semibold" : ""}`}>{fmtDate(l.lost_followup_at)}</td>
            <td className="td">{l.consent_marketing ? <Badge color="#16a34a">Opted in</Badge> : <Badge color="#64748b">No consent</Badge>}</td>
            <td className="td whitespace-nowrap space-x-1">
              {l.consent_marketing && <a className="btn-ghost btn-sm" target="_blank" rel="noreferrer" href={waLink(l.phone, `Hello ${l.name.split(" ")[0]}, it's Royal Journey. Are you still looking for property in ${l.preferred_area || "Dubai"}? We have new listings that may suit you.`)}>WhatsApp</a>}
              <button className="btn-ghost btn-sm" onClick={() => run(() => act.changeStage(l, "contacted"))}>Re-open</button>
            </td>
          </tr>
        ))}
      </Table>
      <p className="text-xs text-ink-400 mt-3">Only contact people for marketing where they have given consent (UAE PDPL / TDRA rules on unsolicited messages).</p>
    </>
  );
}
