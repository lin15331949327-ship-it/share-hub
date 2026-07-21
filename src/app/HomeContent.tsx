"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { filterForDisplay, sortForDisplay, catMap } from "@/lib/resources";
import type { Resource, Category } from "@/lib/types";

function getInitialCategory(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("cat");
}

/* ---- Scroll reveal hook ---- */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

export default function HomeContent() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(getInitialCategory);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.tags?.some((t: string) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [resources, categories, activeCategory, search]);

  const featured = display[0];
  const isHome = !activeCategory && !search;

  function selectCat(id: string | null) {
    setActiveCategory(id);
    setSidebarOpen(false);
    const url = id ? `/?cat=${id}` : "/";
    window.history.replaceState(null, "", url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ paddingTop: "120px" }}>
        <div
          className="w-4 h-4 rounded-full border-2 animate-spin"
          style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }}
        />
      </div>
    );
  }

  const sidebarCats = [...categories]
    .filter((c) => !c.isCatchAll)
    .sort((a, b) => (a.sortWeight ?? 0) - (b.sortWeight ?? 0));
  const allCount = resources.filter((r) => {
    const cat = cMap.get(r.category);
    return !cat?.isCatchAll;
  }).length;

  return (
    <div className="flex gap-8" style={{ paddingTop: "24px" }}>
      {/* Mobile category selector */}
      <div className="lg:hidden w-full mb-2">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex items-center gap-2 w-full px-4 py-3 rounded-[var(--radius-md)] border text-sm font-medium"
          style={{
            background: "#fff",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
            fontFamily: "var(--font-body)",
          }}
        >
          {activeCategory
            ? `${cMap.get(activeCategory)?.icon || ""} ${cMap.get(activeCategory)?.name || ""}`
            : `全部 (${allCount})`}
          <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {sidebarOpen && (
          <div className="mt-2 rounded-[var(--radius-lg)] border p-2 space-y-1" style={{ background: "#fff", borderColor: "var(--color-border)" }}>
            <SidebarItems allCount={allCount} activeCategory={activeCategory} sidebarCats={sidebarCats} resources={resources} selectCat={selectCat} />
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0 flex-col gap-1 sticky top-28 self-start" style={{ width: "220px" }}>
        <div className="rounded-[var(--radius-xl)] border overflow-hidden" style={{ background: "#fff", borderColor: "var(--color-border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}>
              分类
            </p>
          </div>
          <div className="px-2 pb-2">
            <SidebarItems allCount={allCount} activeCategory={activeCategory} sidebarCats={sidebarCats} resources={resources} selectCat={selectCat} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-12">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索资源..."
            className="w-full h-11 pl-11 pr-4 rounded-[var(--radius-full)] border text-sm outline-none transition-all"
            style={{
              background: "#fff",
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
              boxShadow: "var(--shadow-xs)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--color-accent)";
              e.currentTarget.style.boxShadow = "var(--shadow-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--color-border)";
              e.currentTarget.style.boxShadow = "var(--shadow-xs)";
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md"
              style={{ color: "var(--color-text-muted)" }}>
              清除
            </button>
          )}
        </div>

        {/* Hero — Double-Bezel Architecture */}
        {featured && isHome && (
          <ScrollReveal>
            {/* Outer shell */}
            <div className="p-2 rounded-[var(--radius-2xl)]" style={{ background: "linear-gradient(135deg, #F0F4FF 0%, #F8F6FF 50%, #FDFAFF 100%)", border: "1px solid rgba(0,0,0,0.05)" }}>
              {/* Inner core */}
              <div className="relative rounded-[calc(var(--radius-2xl)-4px)] overflow-hidden" style={{
                minHeight: "300px", padding: "48px",
                background: "rgba(255,255,255,0.5)",
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.8)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
              }}>
                {/* Radial glow */}
                <div className="absolute pointer-events-none" style={{
                  top: "-30%", right: "-5%", width: "460px", height: "460px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(79,124,255,0.10) 0%, transparent 70%)",
                }} />

                <div className="relative z-10 flex items-center h-full gap-8" style={{ minHeight: "204px" }}>
                  <div className="flex-1" style={{ maxWidth: "58%" }}>
                    {/* Eyebrow */}
                    <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase mb-5"
                      style={{ background: "var(--color-accent)", color: "#fff", fontFamily: "var(--font-body)" }}>
                      今日推荐
                    </span>
                    <h2 className="tracking-tight mb-3" style={{
                      fontSize: "44px", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em",
                      color: "var(--color-text)", fontFamily: "var(--font-display)",
                    }}>
                      {featured.name}
                    </h2>
                    {featured.description && (
                      <p className="mb-8 line-clamp-2" style={{
                        fontSize: "16px", lineHeight: 1.6, color: "var(--color-text-soft)", maxWidth: "460px",
                      }}>
                        {stripHtml(featured.description)}
                      </p>
                    )}

                    {/* Button-in-Button CTAs */}
                    <div className="flex gap-3">
                      <a href={featured.link} target="_blank" rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                          background: "var(--color-accent)", color: "#fff",
                          transition: "transform 200ms var(--ease-spring), box-shadow 200ms var(--ease-spring)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.28)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        立即打开
                        <span className="flex items-center justify-center w-6 h-6 rounded-full transition-transform"
                          style={{ background: "rgba(255,255,255,0.2)", transition: "transform 200ms var(--ease-spring)" }}>
                          <svg className="w-3 h-3 group-hover:translate-x-px transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                          </svg>
                        </span>
                      </a>

                      <Link href={`/resource/${featured.id}`}
                        className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                        style={{
                          background: "#fff", color: "var(--color-text)",
                          border: "1.5px solid var(--color-border)",
                          transition: "all 200ms var(--ease-spring)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-accent)";
                          e.currentTarget.style.color = "var(--color-accent)";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--color-border)";
                          e.currentTarget.style.color = "var(--color-text)";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        查看详情
                      </Link>
                    </div>
                  </div>

                  {/* Right icon plate */}
                  <div className="hidden sm:flex shrink-0 items-center justify-center" style={{ width: "42%" }}>
                    <div className="rounded-[var(--radius-2xl)] p-1" style={{ background: "rgba(0,0,0,0.03)" }}>
                      <div className="flex items-center justify-center select-none rounded-[calc(var(--radius-2xl)-4px)]"
                        style={{
                          width: "300px", height: "180px",
                          background: "rgba(255,255,255,0.6)",
                          fontSize: "72px",
                          border: "1px solid rgba(255,255,255,0.8)",
                          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                        }}>
                        {cMap.get(featured.category)?.icon || "📦"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Results */}
        <ScrollReveal>
          <div>
            <h2 className="font-semibold tracking-tight mb-5" style={{
              fontSize: "var(--text-lg)", color: "var(--color-text)", fontFamily: "var(--font-display)",
            }}>
              {search ? `搜索结果 (${display.length})` : activeCategory ? `${cMap.get(activeCategory)?.icon || ""} ${cMap.get(activeCategory)?.name || ""} (${display.length})` : `全部资源 (${display.length})`}
            </h2>
            {display.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {display.map((r, i) => (
                  <ScrollReveal key={r.id} delay={i * 60}>
                    <ResourceCard resource={r} category={cMap.get(r.category)} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <Empty message={search ? "没有匹配的资源" : "还没有资源"} hint={search ? "试试别的关键词" : "登录后就可以添加啦"} />
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

/* ---- Sidebar items ---- */
function SidebarItems({
  allCount, activeCategory, sidebarCats, resources, selectCat,
}: {
  allCount: number; activeCategory: string | null; sidebarCats: Category[]; resources: Resource[]; selectCat: (id: string | null) => void;
}) {
  return (
    <>
      <button onClick={() => selectCat(null)}
        className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all"
        style={{
          background: activeCategory === null ? "var(--color-accent-glow)" : "transparent",
          color: activeCategory === null ? "var(--color-accent)" : "var(--color-text)",
          fontFamily: "var(--font-body)",
          transition: "all 200ms var(--ease-spring)",
        }}>
        <span>全部</span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{allCount}</span>
      </button>
      {sidebarCats.map((cat) => {
        const count = resources.filter((r) => r.category === cat.id).length;
        if (count === 0) return null;
        const isActive = activeCategory === cat.id;
        return (
          <button key={cat.id} onClick={() => selectCat(cat.id)}
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all"
            style={{
              background: isActive ? "var(--color-accent-glow)" : "transparent",
              color: isActive ? "var(--color-accent)" : "var(--color-text-soft)",
              fontWeight: isActive ? 600 : 400,
              fontFamily: "var(--font-body)",
              transition: "all 200ms var(--ease-spring)",
            }}>
            <span className="truncate">{cat.icon} {cat.name}</span>
            <span className="text-xs ml-2 shrink-0" style={{ color: "var(--color-text-muted)" }}>{count}</span>
          </button>
        );
      })}
    </>
  );
}

/* ---- Scroll Reveal Wrapper ---- */
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity ${"var(--dur-reveal)"} var(--ease-out) ${delay}ms, transform ${"var(--dur-reveal)"} var(--ease-out) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ---- Resource Card — Double-Bezel ---- */
function ResourceCard({ resource, category }: { resource: Resource; category?: Category }) {
  return (
    <Link href={`/resource/${resource.id}`} className="block group" style={{ textDecoration: "none" }}>
      {/* Outer shell */}
      <div className="rounded-[var(--radius-xl)] p-[1px] transition-all" style={{
        background: "var(--color-border)",
        transition: "all 300ms var(--ease-spring)",
      }}>
        {/* Inner core */}
        <div className="flex items-center gap-4 p-4 rounded-[calc(var(--radius-xl)-1px)] transition-all"
          style={{
            background: "#fff",
            border: "1px solid transparent",
            boxShadow: "var(--shadow-sm)",
            transition: "all 300ms var(--ease-spring)",
          }}
          onMouseEnter={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.background = "var(--color-accent-ring)";
              parent.style.transform = "translateY(-2px)";
              parent.style.boxShadow = "var(--shadow-card-hover)";
            }
          }}
          onMouseLeave={(e) => {
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.style.background = "var(--color-border)";
              parent.style.transform = "translateY(0)";
              parent.style.boxShadow = "none";
            }
          }}
        >
          <div className="shrink-0 w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center text-lg select-none"
            style={{ background: "var(--color-paper-2)" }}>
            {category?.icon || "📦"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate" style={{
              fontSize: "var(--text-sm)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontWeight: 600,
            }}>
              {resource.name}
            </h3>
            <p className="line-clamp-1 mt-0.5" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
              {resource.description ? stripHtml(resource.description) : new Date(resource.createdAt).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
            </p>
          </div>
          <svg className="shrink-0 w-4 h-4 opacity-0 group-hover:opacity-100 transition-all duration-[var(--dur-normal)]" style={{ color: "var(--color-text-muted)", transform: "translateX(-4px)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

function Empty({ message, hint }: { message: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24" style={{ color: "var(--color-text-muted)" }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--color-paper-2)" }}>
        <svg className="w-8 h-8" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <p className="font-medium" style={{ fontSize: "var(--text-base)", color: "var(--color-text-soft)", fontFamily: "var(--font-body)" }}>{message}</p>
      <p className="mt-1" style={{ fontSize: "var(--text-sm)" }}>{hint}</p>
    </div>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 120);
}
