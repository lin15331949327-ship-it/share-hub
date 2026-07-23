"use client";

import { useState, useEffect } from "react";
import type { Resource } from "@/lib/types";

/**
 * Fetch all resources once on mount.
 * Returns raw data only — filtering/sorting is done by pure functions elsewhere.
 */
export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resources")
      .then((r) => r.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      });
  }, []);

  return { resources, loading };
}
