/**
 * Client-side upload to Cloudflare Worker.
 * Simple upload ≤50MB. Multipart >50MB (no size limit, 10MB chunks, 3x parallel + retry).
 */

const WORKER = process.env.NEXT_PUBLIC_UPLOAD_WORKER || "https://share-hub-upload.lin15331949327.workers.dev";
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETRIES = 3;
const CONCURRENCY = 3; // parallel chunk uploads

async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, init);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastErr;
}

export function getContentType(file: File): string {
  if (file.type && file.type.length > 0) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    mp4: "video/mp4", webm: "video/webm", ogg: "video/ogg", ogv: "video/ogg",
    mov: "video/quicktime", mkv: "video/x-matroska", avi: "video/x-msvideo",
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
    gif: "image/gif", svg: "image/svg+xml",
    zip: "application/zip", rar: "application/x-rar-compressed", "7z": "application/x-7z-compressed",
    exe: "application/x-msdownload", msi: "application/x-msi",
    appx: "application/x-ms-appx", msix: "application/zip",
    dmg: "application/x-apple-diskimage", pkg: "application/x-newton-compatible-pkg",
    deb: "application/vnd.debian.binary-package", rpm: "application/x-rpm",
    iso: "application/x-iso9660-image", apk: "application/vnd.android.package-archive",
  };
  return map[ext] || "application/octet-stream";
}

export interface UploadProgress {
  current: number;
  total: number;
}

async function simpleUpload(file: File): Promise<string> {
  const ct = encodeURIComponent(getContentType(file));
  const res = await fetchWithRetry(
    `${WORKER}/upload?filename=${encodeURIComponent(file.name)}&ct=${ct}`,
    { method: "POST", body: file }
  );
  if (!res.ok) throw new Error("上传失败");
  const { url } = await res.json();
  return url;
}

/** Upload a single chunk, returning { etag, partNumber } */
async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  chunk: Blob
): Promise<{ etag: string; partNumber: number }> {
  const partRes = await fetchWithRetry(
    `${WORKER}/mp/part?key=${encodeURIComponent(key)}&uploadId=${uploadId}&part=${partNumber}`,
    { method: "POST", body: chunk }
  );
  if (!partRes.ok) throw new Error(`分片 ${partNumber} 上传失败`);
  const { etag } = await partRes.json();
  return { etag, partNumber };
}

async function multipartUpload(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  const ct = encodeURIComponent(getContentType(file));
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  // 1) start multipart session
  const startRes = await fetchWithRetry(
    `${WORKER}/mp/start?filename=${encodeURIComponent(file.name)}&ct=${ct}`,
    { method: "POST" }
  );
  if (!startRes.ok) throw new Error("创建分片上传失败");
  const { uploadId, key } = await startRes.json();

  // 2) upload parts with concurrency limit
  const parts: { etag: string; partNumber: number }[] = [];
  let done = 0;
  let next = 0;

  async function worker() {
    while (next < totalParts) {
      const i = next++;
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      const partNumber = i + 1;

      const result = await uploadPart(key, uploadId, partNumber, chunk);
      parts.push(result);
      done++;
      onProgress({ current: done, total: totalParts + 1 });
    }
  }

  // launch CONCURRENCY workers
  const workers = Array.from({ length: Math.min(CONCURRENCY, totalParts) }, () => worker());
  await Promise.all(workers);

  // 3) complete
  onProgress({ current: totalParts + 1, total: totalParts + 1 });
  parts.sort((a, b) => a.partNumber - b.partNumber);

  const doneRes = await fetchWithRetry(
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
