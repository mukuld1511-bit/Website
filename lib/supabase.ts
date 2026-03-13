// Direct Supabase Storage uploader — bypasses SDK JWT validation entirely
// Uses XMLHttpRequest for real upload progress tracking

const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/['"]/g, "").trim() ||
  "https://xmzkuyhltvoiummebxxm.supabase.co";

const SUPABASE_KEY =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").replace(/['"]/g, "").trim() ||
  "sb_publishable_JKnQ3Wj2w6CWdLPexQ0jfQ_b3nl";

/**
 * Upload a file to Supabase Storage via direct REST API (no SDK / no JWT parsing).
 * Returns the public URL of the uploaded file.
 */
export function uploadToSupabase(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200 || xhr.status === 201) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
        resolve(publicUrl);
      } else {
        let msg = `Upload failed: ${xhr.status}`;
        try { msg = JSON.parse(xhr.responseText)?.error ?? msg; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload was aborted")));

    xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`);
    xhr.setRequestHeader("apikey", SUPABASE_KEY);
    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_KEY}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  });
}

// Keep the Supabase client for any non-upload use (getPublicUrl etc.)
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
});

