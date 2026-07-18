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
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el2 = scrollRef.current;
      if (!el2) return;
      const gap = 8;
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

  // scroll active pill into view
  useEffect(() => {
    if (!active) return;
    const el = scrollRef.current;
    if (!el) return;
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
    scrollRef.current?.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" });
  }

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full border transition-all"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <svg className="w-4 h-4" style={{ color: "var(--color-text-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Gradient fades */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--color-paper), transparent)" }} />
      )}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--color-paper), transparent)" }} />
      )}

      {/* Pills */}
      <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth pb-1 px-0.5">
        {pill(null, "全部", active, onSelect)}
        {categories.map((cat) => pill(cat.id, `${cat.icon} ${cat.name}`, active, onSelect))}
      </div>

      {/* Right arrow */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full border transition-all"
          style={{
            background: "var(--color-surface)",
            borderColor: "var(--color-border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <svg className="w-4 h-4" style={{ color: "var(--color-text-soft)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}

function pill(
  id: string | null,
  label: string,
  active: string | null,
  onSelect: (id: string | null) => void
) {
  const isActive = active === id;
  return (
    <button
      key={id ?? "__all__"}
      data-cat={id ?? "__all__"}
      onClick={() => onSelect(id)}
      className="shrink-0 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
      style={{
        fontFamily: "var(--font-body)",
        background: isActive ? "var(--color-accent)" : "var(--color-surface)",
        color: isActive ? "#fff" : "var(--color-text-soft)",
        border: isActive ? "1.5px solid var(--color-accent)" : "1px solid var(--color-border)",
        boxShadow: isActive ? "0 2px 12px var(--color-accent-glow)" : "none",
        transform: isActive ? "scale(1.05)" : "scale(1)",
      }}
    >
      {label}
    </button>
  );
}
