"use client";

import { useState, useCallback } from "react";
import { uploadFile, getContentType } from "@/lib/upload-client";
import type { UploadProgress } from "@/lib/upload-client";

export type UploadType = "image" | "video" | "file";

interface UseUploadReturn {
  uploading: boolean;
  progress: UploadProgress;
  upload: (file: File, type: UploadType) => Promise<string | null>;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({ current: 0, total: 0 });

  const upload = useCallback(async (file: File, _type: UploadType): Promise<string | null> => {
    setUploading(true);
    try {
      const url = await uploadFile(file, (p) => setProgress(p));
      return url;
    } catch (e: any) {
      alert(e.message || "上传失败");
      return null;
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress({ current: 0, total: 0 });
  }, []);

  return { uploading, progress, upload, reset };
}

/** Build HTML to insert into TipTap editor after upload */
export function buildInsertHtml(
  url: string,
  file: File,
  type: UploadType
): string {
  if (type === "image") {
    return `<img src="${url}" alt="${file.name}" />`;
  }
  if (type === "video") {
    return `<video src="${url}" controls="true" playsinline="true" preload="metadata" style="width:100%;max-width:720px;border-radius:8px;display:block"></video>`;
  }
  // file download link
  const sizeMb = (file.size / 1024 / 1024).toFixed(1);
  return `<p><a href="${url}" download style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#f4f4f5;border-radius:8px;color:#18181b;text-decoration:none;font-weight:500">📦 ${file.name} （${sizeMb} MB） — 点击下载</a></p>`;
}
