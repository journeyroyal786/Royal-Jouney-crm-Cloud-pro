"use client";
import { useState } from "react";
import { Field, Modal, Select, useAsync } from "./ui";
import { useActions, suggestAgent } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { AREAS, CLIENT_TYPES, LOST_REASONS, OFFER_PARTIES, PROPERTY_TYPES, PURPOSES, SOURCES } from "@/lib/constants";
import { useData } from "@/lib/data";
import type { Lead, Viewing } from "@/lib/types";
import { addDays, fromDateInput, fromLocalInput, money, toDateInput, toLocalInput } from "@/lib/utils";

export function LeadForm({ lead, onClose, onSaved }: { lead?: Lead; onClose: () => void; onSaved?: (l: Lead) => void }) {
  const { data, update } = useData();
  const { user } = useAuth();
  const act = useActions();
  const run = useAsync();
  const [f, setF] = useState<Partial<Lead>>(lead ?? { source: "Property Finder", client_type: "buyer", property_type: "Apartment", purpose: "End-use", temperature: "warm", budget: 0 });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof Lead, v: any) => setF((p) => ({ ...p, [k]: v }));
  const suggestion = suggestAgent({ preferred_area: f.preferred_area || "", property_type: f.property_type || "" }, data.profiles, data.leads);
  const canAssign = user?.role !== "agent";

  async function save() {
    if (!f.name?.trim()) return alert("Name is required");
    if (!f.phone?.trim() && !f.email?.trim()) return alert("Enter a phone number or email");
    setBusy(true);
    await run(async () => {
      let saved: Lead;
      if (lead) { saved = await update("leads", lead.id, f); }
      else saved = await act.createLead(f, true);
      onSaved?.(saved); onClose();
    });
    setBusy(false);
  }

  return (
    <Modal title={lead ? "Edit lead" : "New lead"} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Full name *"><input className="input" value={f.name || ""} onChange={(e) => set("name", e.target.value)} autoFocus /></Field>
        <Field label="Phone / WhatsApp *"><input className="input" placeholder="+9715XXXXXXXX" value={f.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input className="input" type="email" value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="Source"><Select value={f.source || ""} onChange={(v) => set("source", v)} options={SOURCES} /></Field>
        <Field label="Client type"><Select value={f.client_type || "buyer"} onChange={(v) => set("client_type", v)} options={CLIENT_TYPES} /></Field>
        <Field label="Lead temperature">
          <Select value={f.temperature || "warm"} onChange={(v) => set("temperature", v)} options={[{ value: "hot", label: "🔥 Hot" }, { value: "warm", label: "Warm" }, { value: "cold", label: "❄ Cold" }]} />
        </Field>
        <Field label="Budget (AED)"><input className="input" type="number" min={0} value={f.budget ?? 0} onChange={(e) => set("budget", Number(e.target.value))} /></Field>
        <Field label="Preferred area"><input className="input" list="areas" value={f.preferred_area || ""} onChange={(e) => set("preferred_area", e.target.value)} /><datalist id="areas">{AREAS.map((a) => <option key={a} value={a} />)}</datalist></Field>
        <Field label="Property type"><Select value={f.property_type || ""} onChange={(v) => set("property_type", v)} options={PROPERTY_TYPES} /></Field>
        <Field label="Purpose"><Select value={f.purpose || ""} onChange={(v) => set("purpose", v)} options={PURPOSES} /></Field>
        <Field label="Timeline"><input className="input" placeholder="e.g. within 1 month" value={f.timeline || ""} onChange={(e) => set("timeline", e.target.value)} /></Field>
        <Field label="Next follow-up deadline"><input className="input" type="datetime-local" value={toLocalInput(f.follow_up_at)} onChange={(e) => set("follow_up_at", fromLocalInput(e.target.value))} /></Field>
        {canAssign && (
          <Field label="Assigned agent" className="sm:col-span-2">
            <div className="flex gap-2">
              <Select className="flex-1" value={f.assigned_to || ""} onChange={(v) => set("assigned_to", v || null)} placeholder={lead ? "Unassigned" : `Auto-assign${suggestion ? ` (→ ${suggestion.full_name})` : ""}`}
                options={data.profiles.filter((p) => p.active && p.role !== "admin").map((p) => ({ value: p.id, label: `${p.full_name} (${p.role})` }))} />
              {suggestion && <button type="button" className="btn-ghost btn-sm" onClick={() => set("assigned_to", suggestion.id)}>Use best match</button>}
            </div>
            <p className="text-xs text-ink-400 mt-1">Best match is based on area + property specialisation and current workload.</p>
          </Field>
        )}
        <Field label="Notes" className="sm:col-span-2"><textarea className="input" rows={3} value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
        <label className="sm:col-span-2 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={!!f.consent_marketing} onChange={(e) => set("consent_marketing", e.target.checked)} />
          <span>Client has given consent to receive marketing by WhatsApp / email <span className="text-ink-400">(required before adding to campaigns)</span></span>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save lead"}</button>
      </div>
    </Modal>
  );
}

export function LostModal({ lead, onClose, onConfirm }: {
  lead: Lead; onClose: () => void; onConfirm: (x: { lost_reason: string; lost_followup_at: string | null; consent_marketing: boolean }) => Promise<void>;
}) {
  const [reason, setReason] = useState(LOST_REASONS[0]);
  const [other, setOther] = useState("");
  const [fu, setFu] = useState(toDateInput(addDays(new Date(), 90)));
  const [consent, setConsent] = useState(lead.consent_marketing);
  const [busy, setBusy] = useState(false);
  const run = useAsync();
  return (
    <Modal title={`Mark ${lead.name} as lost`} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Reason for loss *"><Select value={reason} onChange={setReason} options={LOST_REASONS} /></Field>
        {reason === "Other" && <Field label="Describe"><input className="input" value={other} onChange={(e) => setOther(e.target.value)} /></Field>}
        <Field label="Future follow-up date"><input className="input" type="date" value={fu} onChange={(e) => setFu(e.target.value)} /></Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Client consents to email / WhatsApp campaigns</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-danger" disabled={busy} onClick={async () => {
          setBusy(true);
          await run(() => onConfirm({ lost_reason: reason === "Other" && other ? other : reason, lost_followup_at: fromDateInput(fu), consent_marketing: consent }));
          setBusy(false);
        }}>Mark as lost</button>
      </div>
    </Modal>
  );
}

export function ViewingForm({ leadId, viewing, onClose }: { leadId?: string; viewing?: Viewing; onClose: () => void }) {
  const { scoped, data, insert, update } = useData();
  const { user } = useAuth();
  const act = useActions();
  const run = useAsync();
  const [f, setF] = useState<Partial<Viewing>>(viewing ?? { lead_id: leadId || "", property_id: null, scheduled_at: new Date(Date.now() + 86400000).toISOString(), status: "scheduled" });
  const set = (k: keyof Viewing, v: any) => setF((p) => ({ ...p, [k]: v }));
  const lead = scoped.leads.find((l) => l.id === f.lead_id);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!f.lead_id) return alert("Choose a lead");
    if (!f.scheduled_at) return alert("Choose date & time");
    setBusy(true);
    await run(async () => {
      if (viewing) {
        await update("viewings", viewing.id, f);
        await act.log(viewing.lead_id, "viewing", `Viewing ${f.status}${f.feedback ? `: ${f.feedback}` : ""}`);
      } else {
        await insert("viewings", { ...f, agent_id: lead?.assigned_to ?? user?.id ?? null });
        await act.log(f.lead_id!, "viewing", "Viewing scheduled");
        if (lead) await act.advanceTo(lead, "viewing_scheduled");
      }
      onClose();
    });
    setBusy(false);
  }

  return (
    <Modal title={viewing ? "Update viewing" : "Schedule viewing"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Lead"><Select value={f.lead_id || ""} onChange={(v) => set("lead_id", v)} placeholder="Select lead…" options={scoped.leads.map((l) => ({ value: l.id, label: l.name }))} /></Field>
        <Field label="Property"><Select value={f.property_id || ""} onChange={(v) => set("property_id", v || null)} placeholder="Select property…" options={data.properties.map((p) => ({ value: p.id, label: `${p.ref} · ${p.title} (${p.area})` }))} /></Field>
        <Field label="Date & time"><input className="input" type="datetime-local" value={toLocalInput(f.scheduled_at)} onChange={(e) => set("scheduled_at", fromLocalInput(e.target.value))} /></Field>
        {viewing && (
          <>
            <Field label="Status"><Select value={f.status || "scheduled"} onChange={(v) => set("status", v)} options={[{ value: "scheduled", label: "Scheduled" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} /></Field>
            <Field label="Client feedback"><textarea className="input" rows={2} value={f.feedback || ""} onChange={(e) => set("feedback", e.target.value)} /></Field>
            <Field label="Next action"><input className="input" value={f.next_action || ""} onChange={(e) => set("next_action", e.target.value)} placeholder="e.g. Submit offer, show alternatives" /></Field>
          </>
        )}
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save} disabled={busy}>Save</button>
      </div>
    </Modal>
  );
}

export function OfferForm({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data } = useData();
  const act = useActions();
  const run = useAsync();
  const [f, setF] = useState({ property_id: "", amount: 0, kind: "offer" as "offer" | "counter", from_party: lead.client_type === "tenant" ? "Tenant" : "Buyer", notes: "" });
  const [busy, setBusy] = useState(false);
  const prop = data.properties.find((p) => p.id === f.property_id);
  return (
    <Modal title="Record offer / counter-offer" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Property"><Select value={f.property_id} onChange={(v) => setF({ ...f, property_id: v, amount: f.amount || data.properties.find((p) => p.id === v)?.price || 0 })} placeholder="Select property…" options={data.properties.map((p) => ({ value: p.id, label: `${p.ref} · ${p.title}` }))} /></Field>
        {prop && <p className="text-xs text-ink-400">Asking price: {money(prop.price)}</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type"><Select value={f.kind} onChange={(v) => setF({ ...f, kind: v as any })} options={[{ value: "offer", label: "Offer" }, { value: "counter", label: "Counter-offer" }]} /></Field>
          <Field label="From"><Select value={f.from_party} onChange={(v) => setF({ ...f, from_party: v })} options={OFFER_PARTIES} /></Field>
        </div>
        <Field label="Amount (AED)"><input className="input" type="number" min={0} value={f.amount} onChange={(e) => setF({ ...f, amount: Number(e.target.value) })} /></Field>
        <Field label="Notes"><textarea className="input" rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <button className="btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn-primary" disabled={busy || !f.amount} onClick={async () => {
          setBusy(true);
          await run(async () => { await act.addOffer(lead, { ...f, property_id: f.property_id || null }); onClose(); });
          setBusy(false);
        }}>Save offer</button>
      </div>
    </Modal>
  );
}
