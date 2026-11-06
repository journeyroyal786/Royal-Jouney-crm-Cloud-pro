"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { cx, isOverdue } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/leads", label: "Leads", icon: "☎" },
  { href: "/pipeline", label: "Pipeline", icon: "⇄" },
  { href: "/properties", label: "Properties", icon: "⌂" },
  { href: "/viewings", label: "Viewings", icon: "◷" },
  { href: "/deals", label: "Deals", icon: "✎" },
  { href: "/followups", label: "Follow-ups", icon: "✓" },
  { href: "/lost", label: "Lost Leads", icon: "✕" },
  { href: "/team", label: "Team", icon: "☺", staff: true },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, loading, signOut, demo } = useAuth();
  const { scoped, loading: dl, error, reset } = useData();
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login"); }, [loading, user, router]);
  useEffect(() => setOpen(false), [path]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-ink-400">Loading…</div>;

  const overdue = scoped.tasks.filter((t) => !t.done && isOverdue(t.due_at)).length;
  const nav = NAV.filter((n) => !n.staff || user.role !== "agent");

  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 bg-ink-950/50 z-30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cx("fixed lg:sticky top-0 z-40 h-screen w-64 bg-ink-900 text-ink-100 flex flex-col transition-transform", open ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <Image src="/logo.png" alt="Royal Journey" width={311} height={128} priority className="w-44 h-auto" />
          <div className="mt-2 text-[11px] tracking-[0.2em] text-brand-400 font-semibold uppercase">Real Estate CRM</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {nav.map((n) => {
            const active = path === n.href || path.startsWith(n.href + "/");
            return (
              <Link key={n.href} href={n.href}
                className={cx("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-500 text-ink-900" : "text-ink-200 hover:bg-white/10")}>
                <span className="w-5 text-center text-base">{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {n.href === "/followups" && overdue > 0 && <span className="bg-red-600 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{overdue}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 text-sm">
          <div className="font-semibold text-white truncate">{user.full_name}</div>
          <div className="text-xs text-brand-300 capitalize">{user.role}</div>
          <button onClick={signOut} className="mt-2 text-xs text-ink-300 hover:text-white underline">Sign out</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-20 bg-ink-900 text-white flex items-center gap-3 px-4 py-2.5">
          <button onClick={() => setOpen(true)} aria-label="Menu" className="text-2xl leading-none">☰</button>
          <Image src="/logo.png" alt="Royal Journey" width={311} height={128} className="h-8 w-auto" />
        </header>
        {demo && (
          <div className="bg-brand-100 text-brand-900 text-xs px-4 py-2 flex flex-wrap items-center gap-x-3">
            <b>DEMO MODE</b> — sample data stored in this browser only. Connect Supabase to go live (see README).
            <button onClick={reset} className="underline font-semibold">Reset demo data</button>
          </div>
        )}
        <main className="p-4 sm:p-6 max-w-[1400px] mx-auto">
          {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">⚠ {error}</div>}
          {dl ? <div className="text-ink-400 py-20 text-center">Loading data…</div> : children}
        </main>
      </div>
    </div>
  );
}
