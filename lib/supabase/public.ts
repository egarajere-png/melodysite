import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "./config";
import type { Database } from "./database.types";

/**
 * Read-only client for public catalogue data (products, categories, collections,
 * deals — everything RLS already grants to anonymous reads). Unlike the cookie-based
 * server client, this needs no request context, so it's safe in generateStaticParams,
 * route handlers, and anywhere else that isn't tied to a specific user's session.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false },
    // Next.js caches fetch() in Server Components by default (force-cache). Stock,
    // prices and deal windows all change from outside a request (orders, admin edits,
    // a deal's end date passing), so catalogue reads must never be served stale.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
}
