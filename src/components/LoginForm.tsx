"use client";

import { useState } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const data = await res.json();
      // Force full reload so cookie is picked up by AuthGuard
      window.location.href = data.role === "admin" ? "/admin/resources" : "/admin/resources/new";
      return;
    } else {
      setError("密码错误");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="max-w-sm mx-auto space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">
          输入密码
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
          placeholder="输入密码"
          autoFocus
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-2.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "验证中..." : "登录"}
      </button>
    </form>
  );
}
