/**
 * Client-side upload to Cloudflare Worker.
 * Supports simple upload (≤50MB) and multipart (>50MB, no size limit).
 */

const WORKER = process.env.NEXT_PUBLIC_UPLOAD_WORKER || "https://share-hub-upload.lin15331949327.workers.dev";
const CHUNK_SIZE = 25 * 1024 * 1024; // 25MB

export function getContentType(file: File): string {
  if (file.type && file.type.length > 0) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg", ogv: "video/ogg",
    mov: "video/quicktime", mkv: "video/x-matroska", avi: "video/x-msvideo",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", svg: "image/svg+xml",
    zip: "application/zip", rar: "application/x-rar-compressed", "7z": "application/x-7z-compressed",
    exe: "application/x-msdownload", msi: "application/x-msdownload",
  };
  return map[ext] || "application/octet-stream";
}

export interface UploadProgress {
  current: number;
  total: number;
}

async function simpleUpload(file: File): Promise<string> {
  const ct = encodeURIComponent(getContentType(file));
  const res = await fetch(
    `${WORKER}/upload?filename=${encodeURIComponent(file.name)}&ct=${ct}`,
    { method: "POST", body: file }
  );
  if (!res.ok) throw new Error("上传失败");
  const { url } = await res.json();
  return url;
}

async function multipartUpload(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  const ct = encodeURIComponent(getContentType(file));
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  const startRes = await fetch(
    `${WORKER}/mp/start?filename=${encodeURIComponent(file.name)}&ct=${ct}`,
    { method: "POST" }
  );
  if (!startRes.ok) throw new Error("创建分片上传失败");
  const { uploadId, key } = await startRes.json();

  const parts: { etag: string; partNumber: number }[] = [];
  for (let i = 0; i < totalParts; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    onProgress({ current: i + 1, total: totalParts + 1 });
    const partRes = await fetch(
      `${WORKER}/mp/part?key=${encodeURIComponent(key)}&uploadId=${uploadId}&part=${i + 1}`,
      { method: "POST", body: chunk }
    );
    if (!partRes.ok) throw new Error(`分片 ${i + 1}/${totalParts} 上传失败`);
    const { etag } = await partRes.json();
    parts.push({ etag, partNumber: i + 1 });
  }

  onProgress({ current: totalParts + 1, total: totalParts + 1 });
  const doneRes = await fetch(
    `${WORKER}/mp/complete?key=${encodeURIComponent(key)}&uploadId=${uploadId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts }),
    }
  );
  if (!doneRes.ok) throw new Error("分片组装失败");
  const { url } = await doneRes.json();
  return url;
}

export async function uploadFile(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  if (file.size <= 50 * 1024 * 1024) {
    onProgress?.({ current: 1, total: 1 });
    return simpleUpload(file);
  }
  return multipartUpload(file, onProgress || (() => {}));
}
