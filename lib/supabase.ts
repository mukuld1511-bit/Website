// Supabase Storage client — used for model/thumbnail uploads (v2)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/['"]/g, "").trim() ||
  "https://xmzkuyhltvoiummebxxm.supabase.co";

const supabaseKey =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/['"]/g, "").trim() ||
  "sb_publishable_JKnQ3Wj2w6CWdLPexQ0jfQ_b3nl";

// Disable Supabase Auth entirely — we use Firebase Auth, not Supabase Auth.
// This prevents "Invalid Compact JWS" errors from JWT validation.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  },
});
