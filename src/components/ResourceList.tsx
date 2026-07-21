"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Resource, Category } from "@/lib/types";

export default function ResourceList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
        <h2 className="text-lg font-semibold text-zinc-900">资源管理</h2>
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
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
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
