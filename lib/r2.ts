import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export function getR2PublicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}

export function generateR2Key(
  userId: string,
  fileName: string,
  folder: "models" | "autocad" | "arvr"
): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${folder}/${userId}/${timestamp}_${sanitized}`;
}

export async function deleteR2Object(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

export const ALLOWED_MODEL_TYPES: Record<string, string> = {
  "model/gltf-binary": "glb",
  "model/gltf+json": "gltf",
  "application/octet-stream": "glb",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
};

export const ALLOWED_EXTENSIONS = [
  ".glb", ".gltf", ".obj", ".fbx", ".zip", ".dwg", ".dxf",
];

export function getFileCategory(fileName: string): "models" | "autocad" | "arvr" {
  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "dwg" || ext === "dxf") return "autocad";
  if (ext === "zip") return "arvr";
  return "models";
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
