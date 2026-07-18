"use client";

import { useState, useEffect } from "react";
import CategoryTabs from "@/components/CategoryTabs";
import ResourceCard from "@/components/ResourceCard";
import type { Resource, Category } from "@/lib/types";

export default function HomePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/resources").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([res, cats]) => {
      setResources(res);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const filtered = activeCategory
    ? resources.filter((r) => r.category === activeCategory)
    : resources;

  const catMap = new Map(categories.map((c) => [c.id, c]));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-zinc-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryTabs
        categories={categories}
        active={activeCategory}
        onSelect={setActiveCategory}
      />

      {categories.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 text-amber-700 text-sm">
          还没有分类数据。请先配置 Vercel KV 环境变量并重启应用。
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg">还没有资源</p>
          <p className="text-sm mt-1">登录后就可以添加啦</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} category={catMap.get(r.category)} />
          ))}
        </div>
      )}
    </div>
  );
}
