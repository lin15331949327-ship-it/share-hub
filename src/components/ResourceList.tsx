"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Resource, Category } from "@/lib/types";

export default function ResourceList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const dragId = useRef<string | null>(null);
  const dragOverId = useRef<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth").then((r) => r.json()),
      fetch("/api/resources").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([auth, res, cats]) => {
      setRole(auth.role);
      setResources(res);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  async function del(id: string, name: string) {
    if (!confirm(`删除「${name}」？此操作不可撤销。`)) return;
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    setResources((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch(`/api/resources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !current }),
    });
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, featured: !current } : r))
    );
  }

  // Drag-and-drop reorder
  function onDragStart(id: string) {
    dragId.current = id;
  }
  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault();
    dragOverId.current = id;
  }
  async function onDrop(targetId: string) {
    const fromId = dragId.current;
    if (!fromId || fromId === targetId) return;

    const fromIdx = resources.findIndex((r) => r.id === fromId);
    const toIdx = resources.findIndex((r) => r.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    // reorder locally
    const reordered = [...resources];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    // assign new displayOrder based on position (decreasing)
    const now = Date.now();
    reordered.forEach((r, i) => {
      r.displayOrder = now - i;
    });
    setResources(reordered);

    // persist ALL items — every position gets a new displayOrder
    await Promise.all(
      reordered.map((r) =>
        fetch(`/api/resources/${r.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayOrder: r.displayOrder }),
        })
      )
    );
  }

  if (loading) {
    return <p className="text-zinc-400 text-sm">加载中...</p>;
  }

  if (!role) {
    return <p className="text-zinc-400">请先登录</p>;
  }

  const catMap = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-900">资源管理</h2>
          {role === "admin" && (
            <span className="text-xs text-zinc-400">拖拽行可排序</span>
          )}
        </div>
        <Link
          href="/admin/resources/new"
          className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
        >
          + 新建资源
        </Link>
      </div>

      {resources.length === 0 ? (
        <p className="text-zinc-400 text-sm py-8 text-center">还没有资源，创建第一个吧</p>
      ) : (
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                {role === "admin" && <th className="w-8" />}
                <th className="text-left px-4 py-3 font-medium">名称</th>
                <th className="text-left px-4 py-3 font-medium">分类</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">添加者</th>
                {role === "admin" && <th className="text-center px-2 py-3 font-medium w-12">推荐</th>}
                <th className="text-right px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {resources.map((r) => {
                const cat = catMap.get(r.category);
                const canEdit = role === "admin" || r.createdBy === "editor";
                return (
                  <tr
                    key={r.id}
                    draggable={role === "admin"}
                    onDragStart={() => onDragStart(r.id)}
                    onDragOver={(e) => onDragOver(e, r.id)}
                    onDrop={() => onDrop(r.id)}
                    className="hover:bg-zinc-50 transition-colors"
                    style={{ cursor: role === "admin" ? "grab" : "default" }}
                  >
                    {role === "admin" && (
                      <td className="pl-3 py-3 text-zinc-300 select-none" style={{ cursor: "grab" }}>
                        ⋮⋮
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <span className="font-medium text-zinc-900">{r.name}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {cat ? `${cat.icon} ${cat.name}` : r.category}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 hidden sm:table-cell">
                      {r.createdBy === "admin" ? "管理员" : "编辑者"}
                    </td>
                    {role === "admin" && (
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => toggleFeatured(r.id, !!r.featured)}
                          title={r.featured ? "取消推荐" : "设为推荐"}
                          className="text-lg transition-colors"
                          style={{ color: r.featured ? "#2563eb" : "var(--color-text-muted)" }}
                        >
                          {r.featured ? "★" : "☆"}
                        </button>
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      {canEdit && (
                        <>
                          <Link
                            href={`/admin/resources/${r.id}/edit`}
                            className="text-zinc-500 hover:text-zinc-900 mr-3 transition-colors"
                          >
                            编辑
                          </Link>
                          {role === "admin" && (
                            <button
                              onClick={() => del(r.id, r.name)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              删除
                            </button>
                          )}
                        </>
                      )}
                      {!canEdit && (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
