"use client";

import { useState, useEffect, useMemo } from "react";
import type { Category } from "@/lib/types";

/**
 * Fetch categories once on mount.
 * Provides pre-computed catMap and sidebarCats for consumers.
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        setLoading(false);
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
