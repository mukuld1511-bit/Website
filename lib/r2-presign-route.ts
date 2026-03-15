import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET, generateR2Key, getR2PublicUrl, getFileCategory, ALLOWED_EXTENSIONS } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType, userId } = await req.json();

    if (!fileName || !userId) {
      return NextResponse.json(
        { error: "fileName and userId are required" },
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
    const key = generateR2Key(userId, fileName, folder);

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: fileType || "application/octet-stream",
    });

    const presignedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600,
    });

    const publicUrl = getR2PublicUrl(key);

    return NextResponse.json({
      presignedUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("R2 presign error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
