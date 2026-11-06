"use client";
import { useMemo, useState } from "react";
import { Badge, Empty, Field, Modal, PageHeader, Select, Table, useAsync } from "@/components/ui";
import { AREAS, PROPERTY_TYPES } from "@/lib/constants";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import type { Property } from "@/lib/types";
import { money } from "@/lib/utils";

const ST_COLOR: Record<string, string> = { available: "#16a34a", reserved: "#f59e0b", sold: "#dc2626", rented: "#6366f1" };

export default function Properties() {
  const { data, insert, update, remove } = useData();
  const { user } = useAuth();
  const run = useAsync();
  const [q, setQ] = useState(""); const [status, setStatus] = useState(""); const [lt, setLt] = useState("");
  const [edit, setEdit] = useState<Partial<Property> | null>(null);
  const rows = useMemo(() => data.properties.filter((p) =>
    (!q || [p.ref, p.title, p.area, p.building].join(" ").toLowerCase().includes(q.toLowerCase())) && (!status || p.status === status) && (!lt || p.listing_type === lt)
  ), [data.properties, q, status, lt]);

  return (
    <>
      <PageHeader title="Properties" sub="Listings inventory used for lead matching" actions={<button className="btn-primary" onClick={() => setEdit({ listing_type: "sale", type: "Apartment", status: "available", bedrooms: 1, ref: `RJ-${1000 + data.properties.length + 1}`, agent_id: user?.role === "agent" ? user.id : null })}>+ Add property</button>} />
      <div className="card p-3 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        <input className="input col-span-2 lg:col-span-2" placeholder="Search ref, title, area, building…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={lt} onChange={setLt} placeholder="Sale & rent" options={[{ value: "sale", label: "For sale" }, { value: "rent", label: "For rent" }]} />
        <Select value={status} onChange={setStatus} placeholder="Any status" options={["available", "reserved", "sold", "rented"]} />
      </div>
      <Table head={["Ref", "Property", "Area", "Beds / Size", "Price", "Permit No.", "Status", ""]}>
        {rows.length === 0 && <tr><td colSpan={8}><Empty>No properties found.</Empty></td></tr>}
        {rows.map((p) => (
          <tr key={p.id}>
            <td className="td font-mono text-xs">{p.ref}</td>
            <td className="td"><div className="font-semibold">{p.title}</div><div className="text-xs text-ink-400">{p.type} · {p.listing_type === "sale" ? "For sale" : "For rent"}{p.building && ` · ${p.building}`}</div></td>
            <td className="td">{p.area}</td>
            <td className="td whitespace-nowrap">{p.bedrooms === 0 ? "Studio" : `${p.bedrooms} BR`} · {p.size_sqft.toLocaleString()} sqft</td>
            <td className="td font-semibold whitespace-nowrap">{money(p.price)}{p.listing_type === "rent" && <span className="text-xs text-ink-400">/yr</span>}</td>
            <td className="td">{p.permit_no || <span className="text-red-600 text-xs font-semibold">Missing ⚠</span>}</td>
            <td className="td"><Badge color={ST_COLOR[p.status]} className="capitalize">{p.status}</Badge></td>
            <td className="td whitespace-nowrap"><button className="btn-ghost btn-sm" onClick={() => setEdit(p)}>Edit</button></td>
          </tr>
        ))}
      </Table>
      <p className="text-xs text-ink-400 mt-3">⚠ Dubai rule: every advertised listing needs a valid DLD/RERA advertising permit (Trakheesi) number.</p>
      {edit && <PropForm p={edit} onClose={() => setEdit(null)}
        onSave={(p) => run(async () => { p.id ? await update("properties", p.id, p) : await insert("properties", p); setEdit(null); })}
        onDelete={user?.role !== "agent" && edit.id ? () => confirm("Delete this property?") && run(async () => { await remove("properties", edit.id!); setEdit(null); }) : undefined} />}
    </>
  );
}

function PropForm({ p, onClose, onSave, onDelete }: { p: Partial<Property>; onClose: () => void; onSave: (p: Partial<Property>) => void; onDelete?: () => void }) {
  const { data } = useData();
  const [f, setF] = useState(p);
  const set = (k: keyof Property, v: any) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Modal title={f.id ? "Edit property" : "Add property"} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Reference"><input className="input" value={f.ref || ""} onChange={(e) => set("ref", e.target.value)} /></Field>
        <Field label="Listing"><Select value={f.listing_type || "sale"} onChange={(v) => set("listing_type", v)} options={[{ value: "sale", label: "For sale" }, { value: "rent", label: "For rent" }]} /></Field>
        <Field label="Title" className="sm:col-span-2"><input className="input" value={f.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
        <Field label="Type"><Select value={f.type || ""} onChange={(v) => set("type", v)} options={PROPERTY_TYPES} /></Field>
        <Field label="Status"><Select value={f.status || "available"} onChange={(v) => set("status", v)} options={["available", "reserved", "sold", "rented"]} /></Field>
        <Field label="Area"><input className="input" list="areas2" value={f.area || ""} onChange={(e) => set("area", e.target.value)} /><datalist id="areas2">{AREAS.map((a) => <option key={a} value={a} />)}</datalist></Field>
        <Field label="Building / community"><input className="input" value={f.building || ""} onChange={(e) => set("building", e.target.value)} /></Field>
        <Field label="Bedrooms (0 = studio)"><input className="input" type="number" min={0} value={f.bedrooms ?? 1} onChange={(e) => set("bedrooms", Number(e.target.value))} /></Field>
        <Field label="Size (sqft)"><input className="input" type="number" min={0} value={f.size_sqft ?? 0} onChange={(e) => set("size_sqft", Number(e.target.value))} /></Field>
        <Field label={`Price (AED${f.listing_type === "rent" ? " / year" : ""})`}><input className="input" type="number" min={0} value={f.price ?? 0} onChange={(e) => set("price", Number(e.target.value))} /></Field>
        <Field label="Advertising permit no. (DLD/RERA)"><input className="input" value={f.permit_no || ""} onChange={(e) => set("permit_no", e.target.value)} /></Field>
        <Field label="Photos link"><input className="input" placeholder="https://drive.google.com/…" value={f.photos_url || ""} onChange={(e) => set("photos_url", e.target.value)} /></Field>
        <Field label="Video link"><input className="input" placeholder="https://youtube.com/…" value={f.video_url || ""} onChange={(e) => set("video_url", e.target.value)} /></Field>
        <Field label="Owner / landlord"><input className="input" value={f.owner_name || ""} onChange={(e) => set("owner_name", e.target.value)} /></Field>
        <Field label="Owner phone"><input className="input" value={f.owner_phone || ""} onChange={(e) => set("owner_phone", e.target.value)} /></Field>
        <Field label="Listing agent" className="sm:col-span-2"><Select value={f.agent_id || ""} onChange={(v) => set("agent_id", v || null)} placeholder="—" options={data.profiles.filter((x) => x.role !== "admin").map((x) => ({ value: x.id, label: x.full_name }))} /></Field>
      </div>
      <div className="flex justify-between mt-5">
        <div>{onDelete && <button className="btn-danger" onClick={onDelete}>Delete</button>}</div>
        <div className="flex gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => (f.title?.trim() ? onSave(f) : alert("Title is required"))}>Save</button></div>
      </div>
    </Modal>
  );
}
