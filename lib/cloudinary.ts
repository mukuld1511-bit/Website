/**
 * Upload a file to Cloudinary.
 * @param file       – The File to upload
 * @param onProgress – Optional progress callback (0–100)
 * @param preset     – Cloudinary upload preset name (defaults to env var or "zenith-cloud")
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void,
  preset?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadPreset =
      preset ??
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
      "zenith-cloud";

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.secure_url) resolve(data.secure_url);
          else reject(new Error(data.error?.message ?? "No URL returned"));
        } catch {
          reject(new Error("Invalid response from Cloudinary"));
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText);
          reject(new Error(err.error?.message ?? `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload was aborted")));

    // Use /auto/upload — Cloudinary auto-detects image, video, or raw
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`
    );
    xhr.send(formData);
  });
}