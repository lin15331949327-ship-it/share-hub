"use client";

import { useState, useEffect, useMemo } from "react";
import type { Resource } from "@/lib/types";

/**
 * Manages carousel slide index + auto-advance for the Hero banner.
 *
 * @param resources  — the full display list
 * @param active     — when false, carousel is paused (e.g. when searching / viewing a category)
 */
export function useCarousel(resources: Resource[], active: boolean) {
  const slides = useMemo(() => {
    const featured = resources.filter((r) => r.featured);
    return featured.length > 0 ? featured : [resources[0]].filter(Boolean);
  }, [resources]);

  const [idx, setIdx] = useState(0);

  // Reset when slide set changes
  useEffect(() => { setIdx(0); }, [slides.length]);

  // Auto-advance
  useEffect(() => {
    if (!active || slides.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 8000);
    return () => clearInterval(t);
  }, [active, slides.length]);

  return {
    slides,
    idx,
    setIdx,
    current: slides[idx] || resources[0],
    total: slides.length,
  };
}
