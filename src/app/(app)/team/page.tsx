"use client";
import { useState } from "react";
import { Badge, Empty, Field, Modal, PageHeader, Select, Table, useAsync } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { AREAS, PROPERTY_TYPES } from "@/lib/constants";
import { useData } from "@/lib/data";
import type { Profile } from "@/lib/types";
import { OPEN_STAGES } from "@/lib/constants";
import { DEMO_MODE } from "@/lib/supabase";

export default function Team() {
  const { data, update, insert } = useData();
  const { user } = useAuth();
  const run = useAsync();
  const [edit, setEdit] = useState<Partial<Profile> | null>(null);
  if (user?.role === "agent") return <Empty>Only managers and admins can view the team.</Empty>;
  const isAdmin = user?.role === "admin";

  return (
    <>
      <PageHeader title="Team" sub="Agents, roles and area specialisations used for lead auto-assignment"
        actions={DEMO_MODE && isAdmin ? <button className="btn-primary" onClick={() => setEdit({ role: "agent", active: true })}>+ Add agent</button> : undefined} />
      {!DEMO_MODE && (
        <div className="card p-3 mb-4 text-sm text-ink-600 bg-brand-50 border-brand-200">
          To add a team member: Supabase → <b>Authentication → Users → Add user</b> (email + password). They appear here automatically and you can set their role and specialisation below.
        </div>
      )}
      <Table head={["Name", "Role", "Specialisation areas", "Property types", "Open leads", "Status", ""]}>
        {data.profiles.map((p) => (
          <tr key={p.id}>
            <td className="td"><div className="font-semibold">{p.full_name}</div><div className="text-xs text-ink-400">{p.email} {p.phone && `· ${p.phone}`}</div></td>
            <td className="td capitalize">{p.role}</td>
            <td className="td text-xs text-ink-600 max-w-[220px]">{p.specialization_areas || "—"}</td>
            <td className="td text-xs text-ink-600">{p.specialization_types || "—"}</td>
            <td className="td">{data.leads.filter((l) => l.assigned_to === p.id && OPEN_STAGES.includes(l.stage)).length}</td>
            <td className="td">{p.active ? <Badge color="#16a34a">Active</Badge> : <Badge color="#64748b">Disabled</Badge>}</td>
            <td className="td">{isAdmin && <button className="btn-ghost btn-sm" onClick={() => setEdit(p)}>Edit</button>}</td>
          </tr>
        ))}
      </Table>
      {edit && <TeamForm p={edit} onClose={() => setEdit(null)} onSave={(f) => run(async () => {
        if (f.id) await update("profiles", f.id, f); else await insert("profiles", { ...f, email: f.email || "" });
        setEdit(null);
      })} />}
    </>
  );
}

function TeamForm({ p, onClose, onSave }: { p: Partial<Profile>; onClose: () => void; onSave: (p: Partial<Profile>) => void }) {
  const [f, setF] = useState(p);
  const set = (k: keyof Profile, v: any) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Modal title={f.id ? "Edit team member" : "Add agent"} onClose={onClose}>
      <div className="space-y-3">
        <Field label="Full name"><input className="input" value={f.full_name || ""} onChange={(e) => set("full_name", e.target.value)} /></Field>
        {!f.id && <Field label="Email"><input className="input" value={f.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>}
        <Field label="Phone"><input className="input" value={f.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="Role"><Select value={f.role || "agent"} onChange={(v) => set("role", v)} options={[{ value: "agent", label: "Agent" }, { value: "manager", label: "Manager" }, { value: "admin", label: "Admin" }]} /></Field>
        <Field label="Specialisation areas (comma separated)"><input className="input" list="ar3" value={f.specialization_areas || ""} onChange={(e) => set("specialization_areas", e.target.value)} placeholder="Downtown Dubai, Business Bay" /><datalist id="ar3">{AREAS.map((a) => <option key={a} value={a} />)}</datalist></Field>
        <Field label="Property types (comma separated)"><input className="input" value={f.specialization_types || ""} onChange={(e) => set("specialization_types", e.target.value)} placeholder={PROPERTY_TYPES.slice(0, 3).join(", ")} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active !== false} onChange={(e) => set("active", e.target.checked)} /> Active (can sign in and receive leads)</label>
      </div>
      <div className="flex justify-end gap-2 mt-5"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => f.full_name?.trim() ? onSave(f) : alert("Name required")}>Save</button></div>
    </Modal>
  );
}
