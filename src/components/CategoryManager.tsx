"use client";

import { useState, useEffect, useRef } from "react";
import type { Category } from "@/lib/types";

interface Props {
  onUpdate?: () => void;
}

export default function CategoryManager({ onUpdate }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");
  const dragIdx = useRef<number | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  async function persist(id: string, field: string, value: string | boolean | number) {
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
    await load();
    onUpdate?.();
  }

  async function saveOrder(list: Category[]) {
    // Reindex order based on array position
    const updated = list.map((cat, i) => ({ ...cat, order: i }));
    setCategories(updated);
    // Persist each category's new order
    await Promise.all(updated.map((cat, i) =>
      fetch("/api/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: cat.id, order: i }),
      })
    ));
    onUpdate?.();
  }

  function onDragStart(idx: number) {
    dragIdx.current = idx;
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function onDrop(idx: number) {
    const src = dragIdx.current;
    if (src === null || src === idx) return;
    const list = [...categories];
    const [item] = list.splice(src, 1);
    list.splice(idx, 0, item);
    saveOrder(list);
    dragIdx.current = null;
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

      <div className="space-y-1">
        {categories.map((cat, idx) => (
          <div
            key={cat.id}
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(idx)}
            className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 bg-white transition-all cursor-default"
          >
            {/* Drag handle */}
            <span
              className="select-none cursor-grab text-zinc-300 hover:text-zinc-500 transition-colors shrink-0"
              style={{ fontSize: "14px", letterSpacing: "2px", lineHeight: 1 }}
              title="拖拽排序">
              ⋮⋮
            </span>

            <input
              defaultValue={cat.icon}
              onBlur={(e) => {
                if (e.target.value !== cat.icon) persist(cat.id, "icon", e.target.value);
              }}
              className="w-10 text-center text-lg border border-transparent focus:border-zinc-300 rounded outline-none"
              title="图标"
            />
            <input
              defaultValue={cat.name}
              onBlur={(e) => {
                if (e.target.value !== cat.name && e.target.value.trim()) {
                  persist(cat.id, "name", e.target.value.trim());
                }
              }}
              className="flex-1 px-3 py-1.5 rounded border border-transparent hover:border-zinc-200 focus:border-zinc-400 outline-none text-sm"
            />
            <span className="text-[11px] shrink-0" style={{ color: "var(--color-text-muted)" }}>
              #{idx + 1}
            </span>
            <label className="flex items-center gap-1 text-xs cursor-pointer shrink-0" style={{ color: "var(--color-text-muted)" }}>
              <input
                type="checkbox"
                defaultChecked={!!cat.isCatchAll}
                onChange={(e) => persist(cat.id, "isCatchAll", e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#2563eb] cursor-pointer"
              />
              杂项
            </label>
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
