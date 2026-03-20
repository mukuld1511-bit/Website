import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2PublicClient, R2_BUCKET, generateR2Key, getR2PublicUrl, getFileCategory, ALLOWED_EXTENSIONS } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Support both call signatures ──────────────────────────────
    // Old (CertUploader):  { key, contentType }
    // New (model upload):  { fileName, fileType, userId }
    const { key: rawKey, contentType, fileName, fileType, userId } = body;

    // ── Path A — direct key provided (CertUploader style) ─────────
    if (rawKey) {
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: rawKey,
        ContentType: contentType || "application/octet-stream",
      });
      const url = await getSignedUrl(r2PublicClient, command, { expiresIn: 3600 });
      const publicUrl = getR2PublicUrl(rawKey);
      return NextResponse.json({ url, presignedUrl: url, publicUrl, key: rawKey });
    }

    // ── Path B — fileName + userId provided (model upload style) ──
    if (!fileName || !userId) {
      return NextResponse.json(
        { error: "Provide either 'key' or both 'fileName' and 'userId'" },
        { status: 400 }
      );
    }

    const ext = "." + fileName.toLowerCase().split(".").pop();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `File type ${ext} not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    const folder = getFileCategory(fileName);
    const key    = generateR2Key(userId, fileName, folder);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType || "application/octet-stream",
    });

    const presignedUrl = await getSignedUrl(r2PublicClient, command, { expiresIn: 3600 });
    const publicUrl    = getR2PublicUrl(key);

    return NextResponse.json({ presignedUrl, url: presignedUrl, publicUrl, key });

  } catch (error) {
    console.error("R2 presign error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}