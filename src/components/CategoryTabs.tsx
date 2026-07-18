"use client";

import { useRef, useState, useEffect } from "react";
import type { Category } from "@/lib/types";

interface Props {
  categories: Category[];
  active: string | null;
  onSelect: (id: string | null) => void;
}

export default function CategoryTabs({ categories, active, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const rafRef = useRef<number>(0);

  function checkScroll() {
    const el = scrollRef.current;
    if (!el) return;
    // use requestAnimationFrame to avoid re-render feedback loops
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el2 = scrollRef.current;
      if (!el2) return;
      const gap = 8; // hysteresis
      setCanScrollLeft((prev) => {
        const now = el2.scrollLeft > gap;
        return prev !== now ? now : prev;
      });
      setCanScrollRight((prev) => {
        const now = el2.scrollLeft + el2.clientWidth < el2.scrollWidth - gap;
        return prev !== now ? now : prev;
      });
    });
  }

  // scroll the active pill into view on mount & when active changes
  useEffect(() => {
    if (!active) return;
    const el = scrollRef.current;
    if (!el) return;
    // find the active button and scroll it to center
    const btn = el.querySelector(`[data-cat="${active}"]`) as HTMLElement | null;
    if (btn) {
      const containerCenter = el.clientWidth / 2;
      const btnCenter = btn.offsetLeft + btn.offsetWidth / 2;
      el.scrollTo({ left: btnCenter - containerCenter, behavior: "instant" as ScrollBehavior });
    }
  }, [active]);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
    };
  }, [categories]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  const pill = (id: string | null, label: string) => (
    <button
      key={id ?? "__all__"}
      data-cat={id ?? "__all__"}
      onClick={() => onSelect(id)}
      className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
        active === id
          ? "bg-zinc-900 text-white shadow-md scale-105"
          : "bg-white text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-zinc-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow-md border border-zinc-200 hover:bg-white transition-all"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Gradient fade right */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none bg-gradient-to-l from-zinc-50 to-transparent" />
      )}

      {/* Gradient fade left */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-r from-zinc-50 to-transparent" />
      )}

      {/* Scrollable pills */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth pb-1 px-0.5"
      >
        {pill(null, "全部")}
        {categories.map((cat) => pill(cat.id, `${cat.icon} ${cat.name}`))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 shadow-md border border-zinc-200 hover:bg-white transition-all"
        >
          <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
