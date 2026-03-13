import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/['"]/g, '').trim();
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/['"]/g, '').trim();

export const supabase = createClient(supabaseUrl, supabaseKey);
