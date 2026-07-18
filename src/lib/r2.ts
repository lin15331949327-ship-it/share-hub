import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

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

/** Extract R2 keys from resource description HTML, then delete them from the bucket */
export async function deleteR2Files(html: string): Promise<void> {
  if (!BUCKET || !PUBLIC_PREFIX) return;

  const re = new RegExp(
    PUBLIC_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^\"'\\s<>]+)",
    "g"
  );
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

export interface R2Stats {
  objects: number;
  totalBytes: number;
  totalMB: string;
  quotaGB: number;
  percentUsed: string;
}

/** Read R2 bucket statistics */
export async function getR2Stats(): Promise<R2Stats> {
  if (!BUCKET) {
    return { objects: 0, totalBytes: 0, totalMB: "0", quotaGB: 10, percentUsed: "0" };
  }

  try {
    const result = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
    const totalBytes = (result.Contents || []).reduce((sum, o) => sum + (o.Size || 0), 0);
    const objects = (result.Contents || []).length;
    const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
    const quotaGB = 10;
    const percentUsed = ((totalBytes / (quotaGB * 1024 * 1024 * 1024)) * 100).toFixed(1);
    return { objects, totalBytes, totalMB, quotaGB, percentUsed };
  } catch {
    return { objects: 0, totalBytes: 0, totalMB: "0", quotaGB: 10, percentUsed: "0" };
  }
}
