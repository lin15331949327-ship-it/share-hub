"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CategoryTabs from "@/components/CategoryTabs";
import ResourceCard from "@/components/ResourceCard";
import { filterForDisplay, sortForDisplay, catMap } from "@/lib/resources";
import type { Resource, Category } from "@/lib/types";

export default function HomeContent() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const activeCategory = searchParams.get("cat"); // null = "全部"

  const handleSelect = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("cat", id);
      } else {
        params.delete("cat");
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [searchParams, router]
  );

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

  const filtered = filterForDisplay(resources, categories, activeCategory);
  const sorted = sortForDisplay(filtered, categories);
  const cMap = catMap(categories);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--color-border)",
            borderTopColor: "var(--color-accent)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <CategoryTabs
        categories={categories}
        active={activeCategory}
        onSelect={handleSelect}
      />

      {categories.length === 0 && (
        <div
          className="p-5 rounded-[var(--radius-lg)] text-sm"
          style={{
            background: "var(--color-accent-glow)",
            color: "var(--color-accent)",
          }}
        >
          还没有分类数据。请先配置 Vercel KV 环境变量。
        </div>
      )}

      {sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24"
          style={{ color: "var(--color-text-muted)" }}
        >
          <p className="text-5xl mb-5 select-none">📭</p>
          <p
            className="mb-1.5"
            style={{
              fontSize: "var(--text-lg)",
              color: "var(--color-text-soft)",
              fontWeight: 500,
            }}
          >
            还没有资源
          </p>
          <p style={{ fontSize: "var(--text-sm)" }}>
            登录后就可以添加啦
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((r, i) => (
            <ResourceCard
              key={r.id}
              resource={r}
              category={cMap.get(r.category)}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}
