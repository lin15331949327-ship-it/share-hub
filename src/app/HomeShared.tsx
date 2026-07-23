"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { filterForDisplay, sortForDisplay, catMap } from "@/lib/resources";
import { getFaviconSources } from "@/lib/favicon";
import type { Resource, Category } from "@/lib/types";

/* ====== Shared hooks & utils ====== */

export function getInitialCategory(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("cat");
}

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export function useHomeData() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(getInitialCategory);

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

  const cMap = catMap(categories);

  const display = useMemo(() => {
    let list = activeCategory
      ? resources.filter((r) => r.category === activeCategory)
      : filterForDisplay(resources, categories, null);
    list = sortForDisplay(list, categories);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || r.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [resources, categories, activeCategory, search]);

  const isHome = !activeCategory && !search;

  const featuredList = useMemo(() => display.filter((r) => r.featured), [display]);
  const carouselSlides = featuredList.length > 0 ? featuredList : [display[0]].filter(Boolean);
  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (!isHome || carouselSlides.length <= 1) return;
    const t = setInterval(() => setSlideIdx((i) => (i + 1) % carouselSlides.length), 8000);
    return () => clearInterval(t);
  }, [isHome, carouselSlides.length]);
  useEffect(() => { setSlideIdx(0); }, [carouselSlides.length]);

  const featured = carouselSlides[slideIdx] || display[0];
  const totalSlides = carouselSlides.length;

  const recent = useMemo(() => {
    return [...display].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  }, [display]);

  const categorySections = useMemo(() => {
    if (activeCategory || search) return [];
    const grouped = new Map<string, Resource[]>();
    for (const r of display) {
      const list = grouped.get(r.category) || [];
      list.push(r);
      grouped.set(r.category, list);
    }
    return Array.from(grouped.entries()).sort((a, b) => {
      const catA = cMap.get(a[0]);
      const catB = cMap.get(b[0]);
      return (catA?.sortWeight ?? 0) - (catB?.sortWeight ?? 0);
    });
  }, [display, activeCategory, search, cMap]);

  function selectCat(id: string | null) {
    setActiveCategory(id);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    const sp = new URLSearchParams(window.location.search);
    if (id) sp.set("cat", id); else sp.delete("cat");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
  }

  const sidebarCats = [...categories].filter((c) => !c.isCatchAll).sort((a, b) => (a.sortWeight ?? 0) - (b.sortWeight ?? 0));
  const allCount = resources.filter((r) => { const cat = cMap.get(r.category); return !cat?.isCatchAll; }).length;

  return {
    resources, categories, loading, search, setSearch,
    activeCategory, selectCat, cMap, display, isHome,
    featured, totalSlides, slideIdx, setSlideIdx,
    recent, categorySections, sidebarCats, allCount,
    carouselSlides,
  };
}

/* ====== Shared sub-components ====== */

export function SectionHeading({ title, count, viewAll, onViewAll }: {
  title: string; count?: number; viewAll?: boolean; onViewAll?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-bold tracking-tight" style={{ fontSize: "var(--text-lg)", color: "var(--color-text)", fontFamily: "var(--font-display)" }}>
        {title}
      </h2>
      {(viewAll || onViewAll) && (
        <button onClick={onViewAll} className="text-xs font-medium transition-colors"
          style={{ color: "var(--color-text-muted)" }}>
          查看全部{count !== undefined ? ` (${count})` : ""} &rarr;
        </button>
      )}
    </div>
  );
}

export function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: `opacity 600ms var(--ease-out) ${delay}ms, transform 600ms var(--ease-out) ${delay}ms`,
    }}>{children}</div>
  );
}

export function HeroFavicon({ link, fallback }: { link: string; fallback: string }) {
  const sources = getFaviconSources(link);
  const [srcIdx, setSrcIdx] = useState(0);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 80, height: 80 }}>
      <span style={{ position: "absolute", fontSize: 72, lineHeight: 1 }}>{fallback}</span>
      {srcIdx < sources.length && (
        <img src={sources[srcIdx]} alt=""
          style={{ position: "relative", zIndex: 1, width: 80, height: 80, objectFit: "contain", background: "transparent" }}
          loading="lazy"
          onError={() => setSrcIdx((i) => i + 1)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth < 8) setSrcIdx((i) => i + 1); }} />
      )}
    </span>
  );
}

export function FaviconIcon({ link, alt, fallback }: { link: string; alt: string; fallback: string }) {
  const sources = getFaviconSources(link);
  const [srcIdx, setSrcIdx] = useState(0);
  return (
    <div className="shrink-0 w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center select-none"
      style={{ background: "var(--color-paper-2)", overflow: "hidden", position: "relative" }}>
      <span className="text-xl" style={{ position: "absolute" }}>{fallback}</span>
      {srcIdx < sources.length && (
        <img src={sources[srcIdx]} alt={alt}
          style={{ position: "relative", zIndex: 1, width: 28, height: 28, objectFit: "contain", background: "transparent" }}
          loading="lazy"
          onError={() => setSrcIdx((i) => i + 1)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth < 8) setSrcIdx((i) => i + 1); }} />
      )}
    </div>
  );
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 200);
}

export function Empty({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--color-text-muted)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-paper-2)" }}>
        <svg className="w-8 h-8" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="font-medium" style={{ fontSize: "var(--text-base)", color: "var(--color-text-soft)" }}>{message}</p>
      <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>{hint}</p>
    </div>
  );
}
