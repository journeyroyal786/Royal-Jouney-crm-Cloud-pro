import { CURRENCY } from "./constants";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);

export const nowISO = () => new Date().toISOString();
export const addDays = (d: Date | string, n: number) => {
  const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString();
};
export const addMinutes = (d: Date | string, n: number) => new Date(new Date(d).getTime() + n * 60000).toISOString();

export const money = (n: number | null | undefined) =>
  `${CURRENCY} ${Math.round(n || 0).toLocaleString("en-AE")}`;
export const moneyShort = (n: number) => {
  if (n >= 1_000_000) return `${CURRENCY} ${(n / 1_000_000).toFixed(n % 1_000_000 ? 2 : 0)}M`;
  if (n >= 1_000) return `${CURRENCY} ${(n / 1_000).toFixed(0)}K`;
  return `${CURRENCY} ${n}`;
};

export const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Dubai" }) : "—";
export const fmtDateTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dubai" }) : "—";

/** value for <input type="datetime-local"> in the user's local zone */
export const toLocalInput = (s?: string | null) => {
  if (!s) return "";
  const d = new Date(s); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (s: string) => (s ? new Date(s).toISOString() : null);
export const toDateInput = (s?: string | null) => (s ? toLocalInput(s).slice(0, 10) : "");
export const fromDateInput = (s: string) => (s ? new Date(s + "T09:00").toISOString() : null);

export const isOverdue = (s?: string | null) => !!s && new Date(s).getTime() < Date.now();
export const isToday = (s?: string | null) => !!s && new Date(s).toDateString() === new Date().toDateString();

export const minutesBetween = (a: string, b: string) => Math.max(0, (new Date(b).getTime() - new Date(a).getTime()) / 60000);
export const fmtMinutes = (m: number | null) => {
  if (m === null || isNaN(m)) return "—";
  if (m < 60) return `${Math.round(m)} min`;
  if (m < 1440) return `${(m / 60).toFixed(1)} h`;
  return `${(m / 1440).toFixed(1)} d`;
};

export const cleanPhone = (p: string) => (p || "").replace(/[^\d]/g, "");
export const waLink = (phone: string, text = "") =>
  `https://wa.me/${cleanPhone(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  URL.revokeObjectURL(a.href);
}
