import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true when Supabase env vars are missing -> the app runs in browser-only DEMO mode */
export const DEMO_MODE = !url || !key;

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!client) client = createClient(url as string, key as string);
  return client;
}
