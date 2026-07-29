"use client";

import { useState, useEffect, useCallback } from "react";
import type { Announcement } from "@/lib/types";

const STORAGE_KEY = "sh-announcement-dismissed";

const PALETTE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue:    { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", dot: "#3b82f6" },
  yellow:  { bg: "#fefce8", border: "#fde68a", text: "#854d0e", dot: "#eab308" },
  green:   { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#22c55e" },
};

export default function AnnouncementBar() {
  const [data, setData] = useState<Announcement | null>(null);

  useEffect(() => {
    // Check if user dismissed a previous announcement within 24h
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { id, at } = JSON.parse(raw);
        if (id && at && Date.now() - at < 24 * 3600_000) {
          // Still within 24h — don't fetch, the component returns null
          return;
        }
      }
    } catch { /* ignore */ }

    fetch("/api/announcement")
      .then((r) => r.json())
      .then((a: Announcement | null) => {
        if (a?.text) {
          // Only show if the user hasn't dismissed THIS specific announcement
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              const { id } = JSON.parse(raw);
              if (id === String(a.updatedAt)) return;
            }
          } catch { /* ignore */ }
          setData(a);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = useCallback(() => {
    if (!data) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: String(data.updatedAt), at: Date.now() }));
    setData(null);
  }, [data]);

  if (!data?.text) return null;

  const p = PALETTE[data.color || "blue"] || PALETTE.blue;

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl mb-6 text-sm"
      style={{
        background: p.bg,
        border: `1px solid ${p.border}`,
        color: p.text,
      }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: p.dot }} />
        {data.link ? (
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate hover:underline"
            style={{ color: p.text, textDecoration: "none" }}
          >
            {data.text}
          </a>
        ) : (
          <span className="truncate">{data.text}</span>
        )}
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        style={{ background: "none", border: "none", cursor: "pointer", color: p.text, fontSize: "16px", lineHeight: 1 }}
        title="关闭"
      >
        ✕
      </button>
    </div>
  );
}
