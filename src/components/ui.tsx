"use client";
import { ReactNode, useEffect } from "react";
import { cx } from "@/lib/utils";

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-950/60 p-0 sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("bg-white w-full rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col", wide ? "sm:max-w-3xl" : "sm:max-w-xl")}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-100">
          <h2 className="font-bold text-ink-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-ink-400 hover:text-ink-900 text-2xl leading-none px-1">×</button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (<div className={className}><label className="label">{label}</label>{children}</div>);
}

export function Badge({ children, color = "#64748b", className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", className)}
      style={{ background: color + "1f", color }}>{children}</span>
  );
}

export const TEMP_COLOR = { hot: "#dc2626", warm: "#f59e0b", cold: "#0ea5e9" } as const;
export function TempBadge({ t }: { t: "hot" | "warm" | "cold" }) {
  return <Badge color={TEMP_COLOR[t]}>{t === "hot" ? "🔥 Hot" : t === "warm" ? "Warm" : "❄ Cold"}</Badge>;
}

export function PageHeader({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">{title}</h1>
        {sub && <p className="text-sm text-ink-500 mt-0.5">{sub}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

export function Stat({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: string }) {
  return (
    <div className="card p-4 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent || "#e8a317" }} />
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="text-2xl font-extrabold mt-1 text-ink-900">{value}</div>
      {sub && <div className="text-xs text-ink-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="text-center text-sm text-ink-400 py-10">{children}</div>;
}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead><tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
        <tbody className="divide-y divide-ink-100">{children}</tbody>
      </table>
    </div>
  );
}

export function Select({ value, onChange, options, placeholder, className }: {
  value: string; onChange: (v: string) => void; options: (string | { value: string; label: string })[]; placeholder?: string; className?: string;
}) {
  return (
    <select className={cx("input", className)} value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function useAsync() {
  // tiny helper to wrap async handlers with error alerts
  return async (fn: () => Promise<unknown>) => {
    try { await fn(); } catch (e: any) { alert(e?.message || "Something went wrong"); }
  };
}
