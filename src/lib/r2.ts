import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = process.env.R2_BUCKET;
const PUBLIC_PREFIX = process.env.R2_PUBLIC_URL + "/";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

export async function uploadToR2(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  if (!BUCKET) throw new Error("R2_BUCKET not configured");

  const key = `${crypto.randomUUID()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: contentType,
    })
  );

  return PUBLIC_PREFIX + key;
}

/** Extract R2 keys from resource description HTML, then delete them */
export async function deleteR2Files(html: string): Promise<void> {
  if (!BUCKET || !PUBLIC_PREFIX) return;

  const re = new RegExp(PUBLIC_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^\"'\\s<>]+)", "g");
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    keys.push(m[1]);
  }

  for (const key of keys) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET!, Key: key }));
    } catch {
      // ignore per-file errors
    }
  }
}
