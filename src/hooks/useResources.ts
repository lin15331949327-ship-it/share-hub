"use client";

import { useState, useEffect } from "react";
import type { Resource } from "@/lib/types";

// Module-level cache — survives client-side back-navigation.
// On first load: fetch + cache. On back-navigation: instant from cache, then refresh.
let _cache: Resource[] | null = null;

export function useResources() {
  const [resources, setResources] = useState<Resource[]>(_cache || []);
  const loading = !_cache;

  useEffect(() => {
    fetch("/api/resources")
      .then((r) => r.json())
      .then((data) => {
        _cache = data;
        setResources(data);
      });
  }, []);

  return { resources, loading };
}
