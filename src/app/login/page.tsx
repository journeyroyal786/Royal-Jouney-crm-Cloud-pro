"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { loadAll } from "@/lib/backend";
import type { Profile } from "@/lib/types";

export default function Login() {
  const { user, loading, demo, signIn, demoLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [demoUsers, setDemoUsers] = useState<Profile[]>([]);

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);
  useEffect(() => { if (demo) loadAll().then((d) => setDemoUsers(d.profiles)); }, [demo]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    const m = await signIn(email.trim(), pw);
    if (m) setErr(m);
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-ink-900 grid place-items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6"><Image src="/logo.png" alt="Royal Journey" width={311} height={128} priority className="w-60 h-auto" /></div>
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h1 className="text-xl font-extrabold text-ink-900">Sign in to your CRM</h1>
          {loading ? <p className="text-sm text-ink-400 mt-4">Loading…</p> : demo ? (
            <>
              <p className="text-sm text-ink-500 mt-1">Demo mode – pick a role to explore with sample data.</p>
              <div className="mt-4 space-y-2">
                {demoUsers.filter((u) => u.id !== "u-a2" && u.id !== "u-a3").map((u) => (
                  <button key={u.id} onClick={() => demoLogin(u.id)}
                    className="w-full flex items-center justify-between rounded-lg border border-ink-200 px-4 py-3 text-left hover:border-brand-400 hover:bg-brand-50">
                    <span><span className="block font-semibold text-ink-900">{u.full_name}</span><span className="block text-xs text-ink-400">{u.email}</span></span>
                    <span className="text-xs font-bold uppercase text-brand-700">{u.role}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-3">
              <div><label className="label">Email</label><input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><label className="label">Password</label><input className="input" type="password" required autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-ink-300 mt-4">© Royal Journey · Dubai, UAE</p>
      </div>
    </div>
  );
}
