"use client";

import { useState } from "react";

export default function PasswordForm() {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("admin");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, oldPassword: oldPw, newPassword: newPw }),
    });
    const d = await res.json();
    if (res.ok) {
      setMsg({ type: "ok", text: "密码已更新" });
      setOldPw("");
      setNewPw("");
    } else {
      setMsg({ type: "err", text: d.error });
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
      >
        修改密码
      </button>
    );
  }

  return (
    <div className="p-5 rounded-xl border border-zinc-200 bg-white max-w-sm">
      <h3 className="font-medium text-zinc-900 mb-4">修改密码</h3>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">修改哪个密码</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:border-zinc-900 outline-none"
          >
            <option value="admin">管理员密码</option>
            <option value="editor">编辑者密码</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">旧密码</label>
          <input
            type="password"
            value={oldPw}
            onChange={(e) => setOldPw(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:border-zinc-900 outline-none"
            required
          />
        </div>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">新密码</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:border-zinc-900 outline-none"
            required
          />
        </div>
        {msg && (
          <p className={`text-sm ${msg.type === "ok" ? "text-emerald-600" : "text-red-500"}`}>
            {msg.text}
          </p>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50"
          >
            {saving ? "保存中..." : "更新密码"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-zinc-500 hover:text-zinc-700"
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}
