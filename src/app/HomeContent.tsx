"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { filterForDisplay, sortForDisplay, catMap } from "@/lib/resources";
import { getFaviconSources } from "@/lib/favicon";
import type { Resource, Category } from "@/lib/types";

function getInitialCategory(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("cat");
}

function useScrollReveal() {
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

export default function HomeContent() {
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

  // Carousel: only admin-featured resources, fallback to single latest
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

  // recent = last 4 by time
  const recent = useMemo(() => {
    return [...display].sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
  }, [display]);

  // grouped by category for sectioned view
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
    window.history.replaceState(null, "", id ? `/?cat=${id}` : "/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ paddingTop: "120px" }}>
        <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }} />
      </div>
    );
  }

  const sidebarCats = [...categories].filter((c) => !c.isCatchAll).sort((a, b) => (a.sortWeight ?? 0) - (b.sortWeight ?? 0));
  const allCount = resources.filter((r) => { const cat = cMap.get(r.category); return !cat?.isCatchAll; }).length;

  return (
    <div className="flex gap-8" style={{ paddingTop: "24px" }}>
      {/* Mobile category pills */}
      <div className="lg:hidden w-full -mx-2 px-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          <button onClick={() => selectCat(null)} className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeCategory === null ? "var(--color-accent)" : "#fff",
              color: activeCategory === null ? "#fff" : "var(--color-text-soft)",
              border: activeCategory === null ? "none" : "1px solid var(--color-border)",
            }}>
            首页
          </button>
          {sidebarCats.map((cat) => {
            const count = resources.filter((r) => r.category === cat.id).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => selectCat(cat.id)} className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all"
                style={{
                  background: isActive ? "var(--color-accent)" : "#fff",
                  color: isActive ? "#fff" : "var(--color-text-soft)",
                  border: isActive ? "none" : "1px solid var(--color-border)",
                }}>
                {cat.icon} {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0 flex-col gap-1 sticky top-28 self-start" style={{ width: "220px" }}>
        <div className="rounded-[var(--radius-xl)] border overflow-hidden" style={{ background: "#fff", borderColor: "var(--color-border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>分类</p>
          </div>
          <div className="px-2 pb-2">
            <SidebarItems allCount={allCount} activeCategory={activeCategory} sidebarCats={sidebarCats} resources={resources} selectCat={selectCat} />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-8 sm:space-y-14">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资源..."
            className="w-full h-11 pl-11 pr-4 rounded-[var(--radius-full)] border text-sm outline-none transition-all"
            style={{ background: "#fff", borderColor: "var(--color-border)", color: "var(--color-text)", boxShadow: "var(--shadow-xs)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "var(--shadow-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md" style={{ color: "var(--color-text-muted)" }}>清除</button>}
        </div>

        {/* Hero Banner — enhanced with geometric decor + indicators + floating icon */}
        {featured && isHome && (
          <ScrollReveal>
            <div className="relative rounded-[28px] group/banner"
              style={{
                background: "linear-gradient(135deg, #F6F7FF 0%, #EDEEFF 30%, #F8F5FF 60%, #FBFAFF 100%)",
                boxShadow: "0 20px 60px rgba(79,124,255,0.08)",
                border: "1px solid rgba(0,0,0,0.04)",
              }}>

              {/* Background decorations layer — clipped to rounded corners */}
              <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                {/* Layer 1: Large ambient glow top-right */}
                <div className="absolute"
                style={{
                  top: "-25%", right: "-10%",
                  width: "520px", height: "520px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(79,124,255,0.14) 0%, rgba(168,148,255,0.05) 35%, transparent 65%)",
                  animation: "float-glow 8s ease-in-out infinite",
                }} />

              {/* Layer 2: Warm accent glow bottom-left */}
              <div className="absolute pointer-events-none"
                style={{
                  bottom: "-35%", left: "5%",
                  width: "340px", height: "340px", borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(99,140,255,0.08) 0%, rgba(180,160,255,0.03) 40%, transparent 65%)",
                  animation: "float-glow 10s ease-in-out infinite 3s",
                }} />

              {/* Layer 3: Geometric dot grid — subtle tech texture */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.06]"
                style={{
                  backgroundImage: "radial-gradient(circle, #4F7CFF 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                  maskImage: "radial-gradient(ellipse at 70% 30%, black 30%, transparent 70%)",
                  WebkitMaskImage: "radial-gradient(ellipse at 70% 30%, black 30%, transparent 70%)",
                }} />

              {/* Layer 4: Subtle diagonal light streak */}
              <div className="absolute pointer-events-none"
                style={{
                  top: "10%", left: "55%",
                  width: "200px", height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(79,124,255,0.15), transparent)",
                  transform: "rotate(-25deg)",
                  filter: "blur(2px)",
                }} />

              </div>{/* end background decorations layer */}

              {/* --- Content --- */}
              <div className="relative z-10 flex items-center gap-8" style={{ padding: "48px", minHeight: "320px" }}>
                {/* Left: 60% text */}
                <div style={{ flex: "0 0 60%", maxWidth: "60%" }}>
                  <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase mb-5"
                    style={{ background: "var(--color-accent)", color: "#fff", fontFamily: "var(--font-body)" }}>
                    今日推荐
                  </span>
                  <h2 style={{
                    fontSize: "42px", fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.02em",
                    color: "var(--color-text)", fontFamily: "var(--font-display)", marginBottom: "10px",
                  }}>
                    {featured.name}
                  </h2>
                  {(featured.subtitle || featured.description) && (
                    <p style={{
                      fontSize: "16px", lineHeight: 1.6, color: "var(--color-text-soft)",
                      maxWidth: "460px", marginBottom: "28px",
                    }} className="line-clamp-2">
                      {featured.subtitle || stripHtml(featured.description)}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <a href={featured.link} target="_blank" rel="noopener noreferrer"
                      className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all select-none"
                      style={{
                        background: "var(--color-accent)", color: "#fff",
                        transition: "transform 200ms var(--ease-spring), box-shadow 200ms var(--ease-spring)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.30)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}>
                      立即打开
                      <span className="flex items-center justify-center w-6 h-6 rounded-full transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-px"
                        style={{ background: "rgba(255,255,255,0.18)" }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" />
                        </svg>
                      </span>
                    </a>
                    <Link href={`/resource/${featured.id}`}
                      className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all select-none"
                      style={{
                        background: "rgba(255,255,255,0.7)", color: "var(--color-text)",
                        border: "1.5px solid rgba(0,0,0,0.08)", backdropFilter: "blur(4px)",
                        transition: "all 200ms var(--ease-spring)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "var(--color-accent)";
                        e.currentTarget.style.color = "var(--color-accent)";
                        e.currentTarget.style.background = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                        e.currentTarget.style.color = "var(--color-text)";
                        e.currentTarget.style.background = "rgba(255,255,255,0.7)";
                      }}>
                      查看详情
                    </Link>
                  </div>
                </div>

                {/* Right: 40% icon — generous double-bezel with float */}
                <div className="hidden sm:flex shrink-0 items-center justify-center" style={{ flex: "0 0 42%", minWidth: 0 }}>
                  {/* Outer tray */}
                  <div className="rounded-[20px] p-2"
                    style={{
                      background: "rgba(0,0,0,0.04)",
                      border: "1px solid rgba(0,0,0,0.08)",
                      animation: "icon-float 5s ease-in-out infinite",
                    }}>
                    {/* Inner glass plate */}
                    <div className="flex items-center justify-center select-none rounded-[12px]"
                      style={{
                        width: "320px", height: "200px",
                        background: "rgba(255,255,255,0.55)",
                        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                      }}>
                      <HeroFavicon link={featured.link} fallback={cMap.get(featured.category)?.icon || "📦"} />
                    </div>
                  </div>
                </div>
                {/* Mobile icon — smaller, below text */}
                <div className="flex sm:hidden shrink-0 justify-center mt-4">
                  <div className="rounded-[16px] p-1" style={{ background: "rgba(0,0,0,0.03)" }}>
                    <div className="flex items-center justify-center select-none rounded-[12px]"
                      style={{
                        width: "120px", height: "120px",
                        background: "rgba(255,255,255,0.55)",
                        border: "1px solid rgba(255,255,255,0.7)",
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                      }}>
                      <span style={{ fontSize: "48px" }}>{cMap.get(featured.category)?.icon || "📦"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- Bottom indicator dots --- */}
              {totalSlides > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSlideIdx(i)}
                      className="w-2 h-2 rounded-full transition-all"
                      style={{
                        background: i === slideIdx ? "var(--color-accent)" : "rgba(0,0,0,0.10)",
                        boxShadow: i === slideIdx ? "0 0 6px rgba(37,99,235,0.4)" : "none",
                        transition: "all 300ms var(--ease-spring)",
                        transform: i === slideIdx ? "scale(1.3)" : "scale(1)",
                        border: "none", cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* ====== Search results ====== */}
        {search && (
          <>
            <ScrollReveal>
              <SectionHeading title={`搜索结果 (${display.length})`} />
            </ScrollReveal>
            {display.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {display.map((r, i) => (
                  <ScrollReveal key={r.id} delay={i * 50}>
                    <ResourceCard resource={r} category={cMap.get(r.category)} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <Empty message="没有匹配的资源" hint="试试别的关键词" />
            )}
          </>
        )}

        {/* ====== Single category view ====== */}
        {activeCategory && !search && (
          <>
            <ScrollReveal>
              <SectionHeading title={`${cMap.get(activeCategory)?.icon || ""} ${cMap.get(activeCategory)?.name || ""} (${display.length})`} />
            </ScrollReveal>
            {display.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {display.map((r, i) => (
                  <ScrollReveal key={r.id} delay={i * 50}>
                    <ResourceCard resource={r} category={cMap.get(r.category)} />
                  </ScrollReveal>
                ))}
              </div>
            ) : (
              <Empty message="还没有资源" hint="登录后就可以添加啦" />
            )}
          </>
        )}

        {/* ====== 首页 — sectioned by category ====== */}
        {!activeCategory && !search && (
          <>
            {/* Recent updates */}
            {recent.length > 0 && (
              <div>
                <SectionHeading title="最近更新" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {recent.map((r, i) => (
                    <ScrollReveal key={r.id} delay={i * 50}>
                      <ResourceCard resource={r} category={cMap.get(r.category)} />
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            )}

            {/* Category sections */}
            {categorySections.map(([catId, items]) => {
              const cat = cMap.get(catId);
              if (!cat || items.length === 0) return null;
              const shown = items.slice(0, 3);
              return (
                <div key={catId}>
                  <SectionHeading
                    title={`${cat.icon} ${cat.name}`}
                    count={items.length}
                    onViewAll={() => selectCat(cat.id)}
                  />
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {shown.map((r, i) => (
                      <ScrollReveal key={r.id} delay={i * 50}>
                        <ResourceCard resource={r} category={cat} />
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              );
            })}

            {display.length === 0 && (
              <Empty message="还没有资源" hint="登录后就可以添加啦" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ====== Sidebar ====== */

function SidebarItems({ allCount, activeCategory, sidebarCats, resources, selectCat }: {
  allCount: number; activeCategory: string | null; sidebarCats: Category[]; resources: Resource[]; selectCat: (id: string | null) => void;
}) {
  return (
    <>
      <button onClick={() => selectCat(null)} className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all"
        style={{ background: activeCategory === null ? "var(--color-accent-glow)" : "transparent", color: activeCategory === null ? "var(--color-accent)" : "var(--color-text)", transition: "all 200ms var(--ease-spring)" }}>
        <span>首页</span><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{allCount}</span>
      </button>
      {sidebarCats.map((cat) => {
        const count = resources.filter((r) => r.category === cat.id).length;
        if (count === 0) return null;
        const isActive = activeCategory === cat.id;
        return (
          <button key={cat.id} onClick={() => selectCat(cat.id)} className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all"
            style={{ background: isActive ? "var(--color-accent-glow)" : "transparent", color: isActive ? "var(--color-accent)" : "var(--color-text-soft)", fontWeight: isActive ? 600 : 400, transition: "all 200ms var(--ease-spring)" }}>
            <span className="truncate">{cat.icon} {cat.name}</span>
            <span className="text-xs ml-2 shrink-0" style={{ color: "var(--color-text-muted)" }}>{count}</span>
          </button>
        );
      })}
    </>
  );
}

/* ====== Section Heading ====== */

function SectionHeading({ title, count, viewAll, onViewAll }: {
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

/* ====== Scroll Reveal ====== */

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
      transition: `opacity 600ms var(--ease-out) ${delay}ms, transform 600ms var(--ease-out) ${delay}ms`,
    }}>{children}</div>
  );
}

/* ====== Favicon with emoji fallback ====== */

function HeroFavicon({ link, fallback }: { link: string; fallback: string }) {
  const sources = getFaviconSources(link);
  const [srcIdx, setSrcIdx] = useState(0);
  if (sources.length === 0 || srcIdx >= sources.length) return <span style={{ fontSize: "72px" }}>{fallback}</span>;
  return (
    <img src={sources[srcIdx]} alt="" className="w-20 h-20 object-contain"
      loading="lazy" onError={() => setSrcIdx((i) => i + 1)} />
  );
}

function FaviconIcon({ link, alt, fallback }: { link: string; alt: string; fallback: string }) {
  const sources = getFaviconSources(link);
  const [srcIdx, setSrcIdx] = useState(0);
  const hasSource = sources.length > 0 && srcIdx < sources.length;
  return (
    <div className="shrink-0 w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center select-none"
      style={{ background: "var(--color-paper-2)", overflow: "hidden" }}>
      {hasSource ? (
        <img src={sources[srcIdx]} alt={alt} className="w-7 h-7 object-contain"
          loading="lazy" onError={() => setSrcIdx((i) => i + 1)} />
      ) : (
        <span className="text-xl">{fallback}</span>
      )}
    </div>
  );
}

/* ====== Resource Card — fixed height, structured layout ====== */

function ResourceCard({ resource, category }: { resource: Resource; category?: Category }) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];

  return (
    <Link href={`/resource/${resource.id}`} className="block group" style={{ textDecoration: "none" }}>
      <div className="rounded-[var(--radius-xl)] p-[1px] h-full transition-all"
        style={{ background: "var(--color-border)", transition: "all 300ms var(--ease-spring)" }}>
        <div className="flex flex-col p-5 rounded-[calc(var(--radius-xl)-1px)] transition-all active:scale-[0.985]"
          style={{ background: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)", transition: "all 300ms var(--ease-spring)", minHeight: "120px" }}
          onMouseEnter={(e) => {
            const p = e.currentTarget.parentElement;
            if (p) { p.style.background = "var(--color-accent-ring)"; p.style.transform = "translateY(-2px)"; p.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-card-hover)"; }
          }}
          onMouseLeave={(e) => {
            const p = e.currentTarget.parentElement;
            if (p) { p.style.background = "var(--color-border)"; p.style.transform = "translateY(0)"; p.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)"; }
          }}>

          {/* Header: icon + title + subtitle */}
          <div className="flex items-start gap-3 mb-2.5">
            <FaviconIcon link={resource.link} alt={resource.name} fallback={category?.icon || "📦"} />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold truncate" style={{ fontSize: "15px", color: "var(--color-text)", fontFamily: "var(--font-body)" }}>
                  {resource.name}
                </h3>
                {resource.featured && <span className="shrink-0" style={{ color: "var(--color-accent)", fontSize: "13px" }}>★</span>}
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                {resource.subtitle || ""}
              </p>
            </div>
          </div>


          {/* Footer: category chip + tags */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {category && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}>
                {category.name}
              </span>
            )}
            {tags.slice(0, 4 - (category ? 1 : 0)).map((tag, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--color-paper-2)", color: "var(--color-text-muted)" }}>
                {tag}
              </span>
            ))}
            {tags.length > (category ? 3 : 4) && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>+{tags.length - (category ? 3 : 4)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ====== Empty ====== */

function Empty({ message, hint }: { message: string; hint: string }) {
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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 200);
}
