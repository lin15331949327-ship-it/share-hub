"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories, checkScroll]);

  function scroll(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  const pill = (id: string | null, label: string) => (
    <button
      key={id ?? "__all__"}
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
