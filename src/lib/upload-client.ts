/**
 * Client-side upload to local server.
 * Simple upload — no more Cloudflare Worker dependency.
 */

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
    appx: "application/x-ms-appx", msix: "application/zip",
    dmg: "application/x-apple-diskimage", pkg: "application/x-newton-compatible-pkg",
    deb: "application/vnd.debian.binary-package", rpm: "application/x-rpm",
    iso: "application/x-iso9660-image", apk: "application/vnd.android.package-archive",
  };
  return map[ext] || "application/octet-stream";
}

export async function uploadFile(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<string> {
  onProgress?.({ current: 1, total: 1 });

  const form = new FormData();
  form.append("file", file);

  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `上传失败 (${res.status})` }));
    throw new Error(err.error || "上传失败");
  }

  onProgress?.({ current: 1, total: 1 });
  const { url } = await res.json();
  return url;
}
