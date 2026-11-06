"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { LeadForm, LostModal, OfferForm, ViewingForm } from "@/components/forms";
import { Badge, Empty, Select, TempBadge, useAsync } from "@/components/ui";
import { matchProperties, suggestAgent, useActions } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { STAGES, stageColor, stageLabel } from "@/lib/constants";
import { useData } from "@/lib/data";
import { fmtDateTime, fmtMinutes, fmtDate, minutesBetween, money, waLink, cx, isOverdue, fromLocalInput, toLocalInput } from "@/lib/utils";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const { scoped, data, update, insert } = useData();
  const { user } = useAuth();
  const act = useActions();
  const run = useAsync();
  const [edit, setEdit] = useState(false);
  const [lost, setLost] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [offer, setOffer] = useState(false);
  const [note, setNote] = useState("");

  const lead = scoped.leads.find((l) => l.id === id);
  if (!lead) return <Empty>Lead not found, or you don&apos;t have access. <Link href="/leads" className="underline">Back to leads</Link></Empty>;

  const agent = data.profiles.find((p) => p.id === lead.assigned_to);
  const matches = matchProperties(lead, data.properties).slice(0, 6);
  const viewings = scoped.viewings.filter((v) => v.lead_id === lead.id).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  const offers = scoped.offers.filter((o) => o.lead_id === lead.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const deal = scoped.deals.find((d) => d.lead_id === lead.id);
  const tasks = scoped.tasks.filter((t) => t.lead_id === lead.id).sort((a, b) => a.due_at.localeCompare(b.due_at));
  const acts = scoped.activities.filter((a) => a.lead_id === lead.id).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const prop = (pid: string | null) => data.properties.find((p) => p.id === pid);
  const staff = user?.role !== "agent";
  const respMin = lead.first_contact_at ? minutesBetween(lead.created_at, lead.first_contact_at) : null;

  function shareText(p: ReturnType<typeof prop>) {
    if (!p) return "";
    return `Hello ${lead!.name.split(" ")[0]}, this property may suit you:\n*${p.title}*\n${p.area}${p.building ? ` – ${p.building}` : ""}\n${p.bedrooms === 0 ? "Studio" : p.bedrooms + " BR"} · ${p.size_sqft} sqft\nPrice: ${money(p.price)}${p.permit_no ? `\nPermit No: ${p.permit_no}` : ""}${p.photos_url ? `\nPhotos: ${p.photos_url}` : ""}${p.video_url ? `\nVideo: ${p.video_url}` : ""}\n\nWould you like to arrange a viewing? – Royal Journey`;
  }

  return (
    <>
      <div className="mb-3"><Link href="/leads" className="text-sm text-ink-500 hover:underline">← All leads</Link></div>

      <div className="card p-4 sm:p-5 mb-4">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold">{lead.name}</h1>
              <TempBadge t={lead.temperature} /><Badge color={stageColor(lead.stage)}>{stageLabel(lead.stage)}</Badge>
              <Badge color="#6a5753" className="capitalize">{lead.client_type}</Badge>
            </div>
            <div className="text-sm text-ink-500 mt-1">{lead.phone} {lead.email && `· ${lead.email}`} · via {lead.source} · created {fmtDateTime(lead.created_at)}</div>
          </div>
          <div className="flex flex-wrap gap-2 items-start">
            <a className="btn-dark" href={`tel:${lead.phone}`} onClick={() => run(() => act.recordContact(lead, "phone call"))}>📞 Call</a>
            <a className="btn-primary" target="_blank" rel="noreferrer" href={waLink(lead.phone, `Hello ${lead.name.split(" ")[0]}, this is ${user?.full_name} from Royal Journey. Thank you for your enquiry – how can I help?`)} onClick={() => run(() => act.recordContact(lead, "WhatsApp"))}>WhatsApp</a>
            {lead.email && <a className="btn-ghost" href={`mailto:${lead.email}`} onClick={() => run(() => act.recordContact(lead, "email"))}>✉ Email</a>}
            <button className="btn-ghost" onClick={() => setEdit(true)}>Edit</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-sm">
          <Info k="Budget" v={lead.budget ? money(lead.budget) : "—"} />
          <Info k="Area / Type" v={`${lead.preferred_area || "—"} · ${lead.property_type}`} />
          <Info k="Purpose / Timeline" v={`${lead.purpose}${lead.timeline ? " · " + lead.timeline : ""}`} />
          <Info k="First response" v={respMin === null ? <span className="text-red-600 font-semibold">Not contacted yet</span> : <span className={respMin > 10 ? "text-amber-600 font-semibold" : "text-green-700 font-semibold"}>{fmtMinutes(respMin)}</span>} />
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-ink-100">
          <div>
            <label className="label">Pipeline stage</label>
            <Select value={lead.stage} onChange={(v) => v === "closed_lost" ? setLost(true) : run(() => act.changeStage(lead, v))} options={STAGES.map((s) => ({ value: s.key, label: s.label }))} />
          </div>
          <div>
            <label className="label">Assigned agent</label>
            {staff ? (
              <div className="flex gap-1">
                <Select className="flex-1" value={lead.assigned_to || ""} placeholder="Unassigned" onChange={(v) => run(() => act.assignLead(lead, v || null))}
                  options={data.profiles.filter((p) => p.active && p.role !== "admin").map((p) => ({ value: p.id, label: p.full_name }))} />
                <button className="btn-ghost btn-sm" title="Auto-assign by area & specialisation" onClick={() => { const s = suggestAgent(lead, data.profiles, data.leads); if (s) run(() => act.assignLead(lead, s.id)); }}>Auto</button>
              </div>
            ) : <div className="py-2 text-sm">{agent?.full_name || "—"}</div>}
          </div>
          <div>
            <label className="label">Follow-up deadline</label>
            <input type="datetime-local" className={cx("input", isOverdue(lead.follow_up_at) && "border-red-400")} value={toLocalInput(lead.follow_up_at)}
              onChange={(e) => run(() => update("leads", lead.id, { follow_up_at: fromLocalInput(e.target.value) }))} />
          </div>
        </div>
        {lead.stage === "closed_lost" && (
          <div className="mt-4 rounded-lg bg-red-50 text-red-800 text-sm p-3">
            <b>Lost:</b> {lead.lost_reason} · re-engage on {fmtDate(lead.lost_followup_at)} · marketing consent: {lead.consent_marketing ? "yes" : "no"}
          </div>
        )}
        {lead.notes && <p className="mt-4 text-sm bg-ink-50 rounded-lg p-3 whitespace-pre-wrap">{lead.notes}</p>}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {!["seller", "landlord"].includes(lead.client_type) && (
            <Section title="Matching properties" sub="Based on area, type and budget">
              {matches.length === 0 ? <Empty>No available properties match this brief yet.</Empty> : (
                <ul className="divide-y divide-ink-100">
                  {matches.map((p) => (
                    <li key={p.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{p.title}</div>
                        <div className="text-xs text-ink-400">{p.ref} · {p.area} · {p.bedrooms === 0 ? "Studio" : `${p.bedrooms} BR`} · {money(p.price)}{p.listing_type === "rent" ? "/yr" : ""}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <a className="btn-primary btn-sm" target="_blank" rel="noreferrer" href={waLink(lead.phone, shareText(p))}
                          onClick={() => run(async () => { await act.log(lead.id, "match", `Shared ${p.ref} – ${p.title}`); await act.advanceTo(lead, "property_matched"); })}>Share via WhatsApp</a>
                        <button className="btn-ghost btn-sm" onClick={() => setViewing(true)}>Book viewing</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}

          <Section title="Viewings" action={<button className="btn-ghost btn-sm" onClick={() => setViewing(true)}>+ Schedule</button>}>
            {viewings.length === 0 ? <Empty>No viewings yet.</Empty> : viewings.map((v) => (
              <div key={v.id} className="py-2 border-b border-ink-100 last:border-0 text-sm flex flex-wrap justify-between gap-2">
                <div><div className="font-semibold">{prop(v.property_id)?.title ?? "Property"}</div><div className="text-xs text-ink-400">{fmtDateTime(v.scheduled_at)}{v.feedback && ` · “${v.feedback}”`}{v.next_action && ` → ${v.next_action}`}</div></div>
                <Badge color={v.status === "completed" ? "#16a34a" : v.status === "cancelled" ? "#dc2626" : "#d946ef"} className="capitalize self-start">{v.status}</Badge>
              </div>
            ))}
          </Section>

          <Section title="Offers & negotiation" action={<button className="btn-ghost btn-sm" onClick={() => setOffer(true)}>+ Record offer</button>}>
            {offers.length === 0 ? <Empty>No offers recorded.</Empty> : offers.map((o) => (
              <div key={o.id} className="py-2 border-b border-ink-100 last:border-0 text-sm flex flex-wrap justify-between gap-2 items-center">
                <div><div className="font-semibold">{money(o.amount)} <span className="font-normal text-ink-400">· {o.from_party} {o.kind}</span></div><div className="text-xs text-ink-400">{prop(o.property_id)?.title} · {fmtDateTime(o.created_at)}{o.notes && ` · ${o.notes}`}</div></div>
                <div className="flex items-center gap-1.5">
                  {o.status === "pending" ? (<>
                    <button className="btn-ghost btn-sm" onClick={() => run(async () => { await update("offers", o.id, { status: "accepted" }); await act.log(lead.id, "offer", `Offer of ${money(o.amount)} accepted – agreed terms`); })}>✓ Accept</button>
                    <button className="btn-ghost btn-sm" onClick={() => run(async () => { await update("offers", o.id, { status: "rejected" }); await act.log(lead.id, "offer", `Offer of ${money(o.amount)} rejected`); })}>✕ Reject</button>
                  </>) : <Badge color={o.status === "accepted" ? "#16a34a" : "#dc2626"} className="capitalize">{o.status}</Badge>}
                </div>
              </div>
            ))}
            {offers.some((o) => o.status === "accepted") && !deal && (
              <button className="btn-primary btn-sm mt-3" onClick={() => run(() => act.changeStage(lead, "documentation"))}>Terms agreed → start documentation</button>
            )}
          </Section>

          {deal && (
            <Section title="Deal" action={<Link href="/deals" className="btn-ghost btn-sm">Open deals</Link>}>
              <div className="text-sm flex flex-wrap gap-x-8 gap-y-1">
                <span>Property: <b>{prop(deal.property_id)?.title ?? "—"}</b></span>
                <span>Price: <b>{money(deal.agreed_price)}</b></span>
                <span>Commission: <b>{money(deal.commission_amount)}</b></span>
                <span>Checklist: <b>{Object.values(deal.checklist).filter(Boolean).length}/8</b></span>
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-4">
          <Section title="Tasks & follow-ups" action={<button className="btn-ghost btn-sm" onClick={() => {
            const title = prompt("Task description"); if (!title) return;
            run(() => insert("tasks", { lead_id: lead.id, assigned_to: lead.assigned_to, title, kind: "follow_up", due_at: new Date(Date.now() + 86400000).toISOString() }));
          }}>+ Add</button>}>
            {tasks.length === 0 ? <Empty>No tasks.</Empty> : tasks.map((t) => (
              <label key={t.id} className="flex items-start gap-2 py-1.5 text-sm">
                <input type="checkbox" className="mt-1" checked={t.done} onChange={() => run(() => update("tasks", t.id, { done: !t.done }))} />
                <span className={t.done ? "line-through text-ink-300" : ""}>{t.title}<span className={cx("block text-xs", !t.done && isOverdue(t.due_at) ? "text-red-600 font-semibold" : "text-ink-400")}>{fmtDate(t.due_at)}</span></span>
              </label>
            ))}
          </Section>

          <Section title="Activity">
            <div className="flex gap-2 mb-3">
              <input className="input" placeholder="Add a note…" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && note.trim()) { run(() => act.log(lead.id, "note", note.trim())); setNote(""); } }} />
              <button className="btn-dark" disabled={!note.trim()} onClick={() => { run(() => act.log(lead.id, "note", note.trim())); setNote(""); }}>Add</button>
            </div>
            <ul className="space-y-2.5 max-h-96 overflow-y-auto">
              {acts.length === 0 && <Empty>No activity yet.</Empty>}
              {acts.map((a) => (
                <li key={a.id} className="text-sm border-l-2 border-brand-300 pl-3">
                  <div>{a.text}</div>
                  <div className="text-xs text-ink-400">{fmtDateTime(a.created_at)} · {data.profiles.find((p) => p.id === a.user_id)?.full_name ?? "System"}</div>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>

      {edit && <LeadForm lead={lead} onClose={() => setEdit(false)} />}
      {lost && <LostModal lead={lead} onClose={() => setLost(false)} onConfirm={async (x) => { await act.changeStage(lead, "closed_lost", x); setLost(false); }} />}
      {viewing && <ViewingForm leadId={lead.id} onClose={() => setViewing(false)} />}
      {offer && <OfferForm lead={lead} onClose={() => setOffer(false)} />}
    </>
  );
}

function Info({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><div className="label">{k}</div><div>{v}</div></div>;
}
function Section({ title, sub, action, children }: { title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2"><div><h2 className="font-bold">{title}</h2>{sub && <p className="text-xs text-ink-400">{sub}</p>}</div>{action}</div>
      {children}
    </div>
  );
}
