// Supabase Storage client — used for model/thumbnail uploads (v2)
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/['"]/g, "").trim() ||
  "https://xmzkuyhltvoiummebxxm.supabase.co";

const supabaseKey =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/['"]/g, "").trim() ||
  "sb_publishable_JKnQ3Wj2w6CWdLPexQ0jfQ_b3nl";

export const supabase = createClient(supabaseUrl, supabaseKey);
