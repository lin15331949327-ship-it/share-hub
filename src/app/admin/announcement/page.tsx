"use client";

import { useState, useEffect, useCallback } from "react";
import type { Announcement } from "@/lib/types";

const COLORS = [
  { value: "blue", label: "蓝色", dot: "#3b82f6" },
  { value: "yellow", label: "黄色", dot: "#eab308" },
  { value: "green", label: "绿色", dot: "#22c55e" },
];

export default function AnnouncementEditor() {
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [color, setColor] = useState<string>("blue");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/announcement")
      .then((r) => r.json())
      .then((a: Announcement | null) => {
        if (a) {
          setText(a.text || "");
          setLink(a.link || "");
          setColor(a.color || "blue");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = useCallback(async () => {
    if (!text.trim()) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), link: link.trim() || undefined, color }),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg({ type: "ok", text: "公告已更新" });
      } else {
        setMsg({ type: "err", text: d.error || "保存失败" });
      }
    } catch {
      setMsg({ type: "err", text: "网络错误" });
    } finally {
      setSaving(false);
    }
  }, [text, link, color]);

  const clear = useCallback(async () => {
    if (!confirm("确定要清除公告吗？")) return;
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/announcement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "", color: "blue" }),
      });
      if (res.ok) {
        setText("");
        setLink("");
        setMsg({ type: "ok", text: "公告已清除" });
      } else {
        const d = await res.json();
        setMsg({ type: "err", text: d.error || "清除失败" });
      }
    } catch {
      setMsg({ type: "err", text: "网络错误" });
    } finally {
      setSaving(false);
    }
  }, []);

  if (!loaded) {
    return <div className="text-sm py-12 text-center" style={{ color: "var(--color-text-muted)" }}>加载中...</div>;
  }

  const previewLink = text ? (link || undefined) : undefined;

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold mb-6" style={{ color: "var(--color-text)" }}>📢 公告管理</h1>

      <div className="space-y-5">
        {/* Text */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-soft)" }}>
            公告内容 <span className="text-zinc-400">(1-200字)</span>
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={200}
            placeholder="例如：新工具上线了，来看看！"
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              background: "#fff",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--color-text-soft)" }}>
            链接 <span className="text-zinc-400">(可选)</span>
          </label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              background: "#fff",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; }}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--color-text-soft)" }}>
            颜色
          </label>
          <div className="flex gap-3">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  background: color === c.value ? "var(--color-accent-glow)" : "#fff",
                  color: color === c.value ? "var(--color-accent)" : "var(--color-text-soft)",
                  border: color === c.value ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.dot }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        {text && (
          <div className="rounded-xl p-4 border" style={{ borderColor: "var(--color-border)", background: "#fafafa" }}>
            <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>预览</p>
            <PreviewBanner text={text} link={previewLink} color={color} />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving || !text.trim()}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "var(--color-accent)" }}
          >
            {saving ? "保存中..." : "保存"}
          </button>
          {text && (
            <button
              onClick={clear}
              disabled={saving}
              className="px-5 py-2.5 rounded-full text-sm transition-all"
              style={{ color: "var(--color-text-muted)", background: "none", border: "1px solid var(--color-border)" }}
            >
              清除公告
            </button>
          )}
        </div>

        {msg && (
          <p
            className="text-sm font-medium"
            style={{ color: msg.type === "ok" ? "#16a34a" : "#dc2626" }}
          >
            {msg.text}
          </p>
        )}
      </div>
    </div>
  );
}

function PreviewBanner({ text, link, color }: { text: string; link?: string; color: string }) {
  const p = {
    blue:   { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", dot: "#3b82f6" },
    yellow: { bg: "#fefce8", border: "#fde68a", text: "#854d0e", dot: "#eab308" },
    green:  { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534", dot: "#22c55e" },
  }[color] || { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af", dot: "#3b82f6" };

  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm"
      style={{ background: p.bg, border: `1px solid ${p.border}`, color: p.text }}
    >
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.dot }} />
      {link ? <span className="truncate underline cursor-pointer">{text}</span> : <span className="truncate">{text}</span>}
      <span className="shrink-0 opacity-40">✕</span>
    </div>
  );
}
