/**
 * Client-side upload to Cloudflare Worker.
 * Simple upload ≤50MB. Multipart >50MB (no size limit, 10MB chunks + retry).
 */

const WORKER = process.env.NEXT_PUBLIC_UPLOAD_WORKER || "https://share-hub-upload.lin15331949327.workers.dev";
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB — keeps Worker under timeout on typical uplinks
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, init);
      return res;
    } catch (e) {
      lastErr = e;
      if (i < retries - 1) {
        // exponential backoff: 1s, 2s, 4s
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

async function multipartUpload(
  file: File,
  onProgress: (p: UploadProgress) => void
): Promise<string> {
  const ct = encodeURIComponent(getContentType(file));
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  const startRes = await fetchWithRetry(
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

    const partRes = await fetchWithRetry(
      `${WORKER}/mp/part?key=${encodeURIComponent(key)}&uploadId=${uploadId}&part=${i + 1}`,
      { method: "POST", body: chunk }
    );
    if (!partRes.ok) throw new Error(`分片 ${i + 1}/${totalParts} 上传失败`);
    const { etag } = await partRes.json();
    parts.push({ etag, partNumber: i + 1 });
  }

  onProgress({ current: totalParts + 1, total: totalParts + 1 });
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
