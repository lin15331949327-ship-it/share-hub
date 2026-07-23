"use client";

import { useState, useEffect, useMemo } from "react";
import type { Category } from "@/lib/types";

// Module-level cache — survives client-side back-navigation.
let _cache: Category[] | null = null;

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>(_cache || []);
  const loading = !_cache;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        _cache = data;
        setCategories(data);
      });
  }, []);

  const catMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const sidebarCats = useMemo(() => {
    return [...categories]
      .filter((c) => !c.isCatchAll)
      .sort((a, b) => (a.sortWeight ?? 0) - (b.sortWeight ?? 0));
  }, [categories]);

  return { categories, loading, catMap, sidebarCats };
}
