"use client";
import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { DEMO_MODE, supabase } from "./supabase";
import { loadAll } from "./backend";
import type { Profile } from "./types";

interface AuthCtx {
  user: Profile | null; loading: boolean; demo: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  demoLogin: (id: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx | null>(null);
export const useAuth = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("AuthProvider missing");
  return c;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (id: string) => {
    const { data } = await supabase().from("profiles").select("*").eq("id", id).maybeSingle();
    if (data && (data as Profile).active === false) { await supabase().auth.signOut(); setUser(null); return; }
    setUser((data as Profile) || null);
  }, []);

  useEffect(() => {
    let sub: { unsubscribe: () => void } | null = null;
    (async () => {
      try {
        if (DEMO_MODE) {
          const id = localStorage.getItem("rj_crm_v1_user");
          if (id) {
            const { profiles } = await loadAll();
            setUser(profiles.find((p) => p.id === id) || null);
          }
        } else {
          const { data } = await supabase().auth.getSession();
          if (data.session) await fetchProfile(data.session.user.id);
          const res = supabase().auth.onAuthStateChange((_e, session) => {
            if (session) fetchProfile(session.user.id); else setUser(null);
          });
          sub = res.data.subscription;
        }
      } catch { /* ignore */ }
      setLoading(false);
    })();
    return () => sub?.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  };
  const demoLogin = async (id: string) => {
    const { profiles } = await loadAll();
    localStorage.setItem("rj_crm_v1_user", id);
    setUser(profiles.find((p) => p.id === id) || null);
  };
  const signOut = async () => {
    if (DEMO_MODE) localStorage.removeItem("rj_crm_v1_user");
    else await supabase().auth.signOut();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, demo: DEMO_MODE, signIn, demoLogin, signOut }}>{children}</Ctx.Provider>;
}
