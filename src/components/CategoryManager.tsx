"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/lib/types";

interface Props {
  onUpdate?: () => void;
}

export default function CategoryManager({ onUpdate }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  async function add() {
    if (!newName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), icon: newIcon }),
    });
    setNewName("");
    setNewIcon("📌");
    await load();
    onUpdate?.();
  }

  async function update(id: string, field: string, value: string | number) {
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    await load();
    onUpdate?.();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`删除分类「${name}」？`)) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    await load();
    onUpdate?.();
  }

  if (loading) return <p className="text-zinc-400 text-sm">加载中...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">分类管理</h2>

      <div className="space-y-2">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 bg-white"
          >
            <input
              value={cat.icon}
              onChange={(e) => update(cat.id, "icon", e.target.value)}
              className="w-10 text-center text-lg"
              title="图标"
            />
            <input
              value={cat.name}
              onChange={(e) => update(cat.id, "name", e.target.value)}
              className="flex-1 px-3 py-1.5 rounded border border-zinc-200 focus:border-zinc-400 outline-none text-sm"
            />
            <button
              onClick={() => remove(cat.id, cat.name)}
              className="text-red-400 hover:text-red-600 text-sm transition-colors shrink-0"
            >
              删除
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
          className="w-12 text-center text-lg border border-zinc-300 rounded-lg px-2 py-2"
          placeholder="📌"
        />
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none text-sm"
          placeholder="新分类名称"
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <button
          onClick={add}
          disabled={!newName.trim()}
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          添加
        </button>
      </div>
    </div>
  );
}
