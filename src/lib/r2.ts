import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getSession } from "./auth";

const BUCKET = process.env.R2_BUCKET;

function getS3Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  size: number
): Promise<{ uploadUrl: string; fileUrl: string }> {
  const session = await getSession();
  if (!session) throw new Error("Login required");

  if (!BUCKET) throw new Error("R2_BUCKET not configured");

  const key = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, fileUrl };
}
