/**
 * Client-side upload to local server.
 * Simple upload ≤50MB. Multipart >50MB (10MB chunks, 3x parallel + retry).
 */

const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETRIES = 3;
const CONCURRENCY = 3;

export interface UploadProgress {
  current: number;
  total: number;
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
    dmg: "application/x-apple-diskimage", pkg: "application/x-newton-compatible-pkg",
    deb: "application/vnd.debian.binary-package", rpm: "application/x-rpm",
    iso: "application/x-iso9660-image", apk: "application/vnd.android.package-archive",
  };
  return map[ext] || "application/octet-stream";
}

async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, init);
    } catch (e) {
      lastErr = e;
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

async function simpleUpload(file: File, onProgress?: (p: UploadProgress) => void): Promise<string> {
  onProgress?.({ current: 1, total: 1 });
  const form = new FormData();
  form.append("file", file);
  const res = await fetchWithRetry("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `上传失败 (${res.status})` }));
    throw new Error(err.error || "上传失败");
  }
  onProgress?.({ current: 1, total: 1 });
  return (await res.json()).url;
}

async function uploadPart(uploadId: string, partNumber: number, chunk: Blob): Promise<void> {
  const res = await fetchWithRetry(`/api/upload/mp?action=part&uploadId=${uploadId}&part=${partNumber}`, { method: "POST", body: chunk });
  if (!res.ok) throw new Error(`分片 ${partNumber} 上传失败`);
}

async function multipartUpload(file: File, onProgress: (p: UploadProgress) => void): Promise<string> {
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);

  // 1) Start
  const startRes = await fetchWithRetry("/api/upload/mp?action=start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name }),
  });
  if (!startRes.ok) throw new Error("创建分片上传失败");
  const { uploadId } = await startRes.json();

  // 2) Upload parts with concurrency
  let done = 0;
  let next = 0;

  async function worker() {
    while (next < totalParts) {
      const i = next++;
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      await uploadPart(uploadId, i + 1, chunk);
      done++;
      onProgress({ current: done, total: totalParts + 1 });
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, totalParts) }, () => worker());
  await Promise.all(workers);

  // 3) Complete
  onProgress({ current: totalParts + 1, total: totalParts + 1 });
  const doneRes = await fetchWithRetry("/api/upload/mp?action=complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadId }),
  });
  if (!doneRes.ok) throw new Error("分片组装失败");
  return (await doneRes.json()).url;
}

export async function uploadFile(file: File, onProgress?: (p: UploadProgress) => void): Promise<string> {
  if (file.size <= 50 * 1024 * 1024) {
    return simpleUpload(file, onProgress);
  }
  return multipartUpload(file, onProgress || (() => {}));
}
