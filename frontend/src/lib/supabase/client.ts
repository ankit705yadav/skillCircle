import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

// createBrowserClient returns a shared singleton in the browser.
export function getSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
