"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHomeData, FaviconIcon, HeroFavicon, ScrollReveal, SectionHeading, Empty, stripHtml } from "./HomeShared";
import MobileLayout from "./MobileLayout";
import type { Resource, Category } from "@/lib/types";
import { getFaviconSources } from "@/lib/favicon";

export default function HomeContent() {
  const sp = useSearchParams();
  const isMobile = sp.get("view") === "mobile";
  const data = useHomeData();

  if (data.loading) {
    return (
      <div className="flex items-center justify-center" style={{ paddingTop: "120px" }}>
        <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: "var(--color-border)", borderTopColor: "var(--color-accent)" }} />
      </div>
    );
  }

  return (
    <>
      {isMobile ? (
        <MobileLayout
          display={data.display}
          search={data.search}
          setSearch={data.setSearch}
          activeCategory={data.activeCategory}
          cMap={data.cMap}
          sidebarCats={data.sidebarCats}
          resources={data.resources}
          selectCat={data.selectCat}
        />
      ) : (
        <DesktopView data={data} />
      )}

      {/* Mode switch button */}
      <button
        onClick={() => {
          const url = new URL(window.location.href);
          url.searchParams.set("view", isMobile ? "desktop" : "mobile");
          window.location.href = url.toString();
        }}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{
          background: isMobile ? "#06B6D4" : "var(--color-accent)",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
        title={isMobile ? "切换桌面版" : "切换手机版"}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          {isMobile ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          )}
        </svg>
      </button>
    </>
  );
}

/* ====== Desktop View ====== */

function DesktopView({ data }: { data: ReturnType<typeof useHomeData> }) {
  const {
    resources, categories, search, setSearch,
    activeCategory, selectCat, cMap, display, isHome,
    featured, totalSlides, slideIdx, setSlideIdx,
    recent, categorySections, sidebarCats, allCount,
  } = data;

  return (
    <div className="flex gap-8" style={{ paddingTop: "24px" }}>
      {/* Mobile category pills */}
      <div className="lg:hidden w-full -mx-2 px-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          <button onClick={() => selectCat(null)} className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all" style={{
            background: activeCategory === null ? "var(--color-accent)" : "#fff",
            color: activeCategory === null ? "#fff" : "var(--color-text-soft)",
            border: activeCategory === null ? "none" : "1px solid var(--color-border)",
          }}>首页</button>
          {sidebarCats.map((cat) => {
            const count = resources.filter((r) => r.category === cat.id).length;
            if (count === 0) return null;
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => selectCat(cat.id)} className="shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all" style={{
                background: isActive ? "var(--color-accent)" : "#fff",
                color: isActive ? "#fff" : "var(--color-text-soft)",
                border: isActive ? "none" : "1px solid var(--color-border)",
              }}>{cat.icon} {cat.name}</button>
            );
          })}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0 flex-col gap-1 sticky top-28 self-start" style={{ width: "220px" }}>
        <div className="rounded-[var(--radius-xl)] border overflow-hidden" style={{ background: "#fff", borderColor: "var(--color-border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="px-4 pt-4 pb-2"><p className="text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>分类</p></div>
          <div className="px-2 pb-2">
            <button onClick={() => selectCat(null)} className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all" style={{ background: activeCategory === null ? "var(--color-accent-glow)" : "transparent", color: activeCategory === null ? "var(--color-accent)" : "var(--color-text)", transition: "all 200ms var(--ease-spring)" }}>
              <span>首页</span><span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{allCount}</span>
            </button>
            {sidebarCats.map((cat) => {
              const count = resources.filter((r) => r.category === cat.id).length;
              if (count === 0) return null;
              const isActive = activeCategory === cat.id;
              return (
                <button key={cat.id} onClick={() => selectCat(cat.id)} className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all" style={{ background: isActive ? "var(--color-accent-glow)" : "transparent", color: isActive ? "var(--color-accent)" : "var(--color-text-soft)", fontWeight: isActive ? 600 : 400, transition: "all 200ms var(--ease-spring)" }}>
                  <span className="truncate">{cat.icon} {cat.name}</span><span className="text-xs ml-2 shrink-0" style={{ color: "var(--color-text-muted)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-8 sm:space-y-14">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索资源..."
            className="w-full h-11 pl-11 pr-4 rounded-[var(--radius-full)] border text-sm outline-none transition-all"
            style={{ background: "#fff", borderColor: "var(--color-border)", color: "var(--color-text)", boxShadow: "var(--shadow-xs)" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.boxShadow = "var(--shadow-glow)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.boxShadow = "var(--shadow-xs)"; }}
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-md" style={{ color: "var(--color-text-muted)" }}>清除</button>}
        </div>

        {/* Hero */}
        {featured && isHome && (
          <ScrollReveal>
            <div className="relative rounded-[28px] group/banner" style={{ background: "linear-gradient(135deg, #F6F7FF 0%, #EDEEFF 30%, #F8F5FF 60%, #FBFAFF 100%)", boxShadow: "0 20px 60px rgba(79,124,255,0.08)", border: "1px solid rgba(0,0,0,0.04)" }}>
              <div className="absolute inset-0 rounded-[28px] overflow-hidden pointer-events-none">
                <div className="absolute" style={{ top: "-25%", right: "-10%", width: "520px", height: "520px", borderRadius: "50%", background: "radial-gradient(circle, rgba(79,124,255,0.14) 0%, rgba(168,148,255,0.05) 35%, transparent 65%)", animation: "float-glow 8s ease-in-out infinite" }} />
                <div className="absolute pointer-events-none" style={{ bottom: "-35%", left: "5%", width: "340px", height: "340px", borderRadius: "50%", background: "radial-gradient(circle, rgba(99,140,255,0.08) 0%, rgba(180,160,255,0.03) 40%, transparent 65%)", animation: "float-glow 10s ease-in-out infinite 3s" }} />
                <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #4F7CFF 1px, transparent 1px)", backgroundSize: "28px 28px", maskImage: "radial-gradient(ellipse at 70% 30%, black 30%, transparent 70%)", WebkitMaskImage: "radial-gradient(ellipse at 70% 30%, black 30%, transparent 70%)" }} />
                <div className="absolute pointer-events-none" style={{ top: "10%", left: "55%", width: "200px", height: "2px", background: "linear-gradient(90deg, transparent, rgba(79,124,255,0.15), transparent)", transform: "rotate(-25deg)", filter: "blur(2px)" }} />
              </div>
              <div className="relative z-10 flex items-center gap-8" style={{ padding: "48px", minHeight: "320px" }}>
                <div style={{ flex: "1 1 0%", maxWidth: "58%", minWidth: 0 }}>
                  <span className="inline-block rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.18em] uppercase mb-5" style={{ background: "var(--color-accent)", color: "#fff" }}>今日推荐</span>
                  <h2 style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.02em", color: "var(--color-text)", fontFamily: "var(--font-display)", marginBottom: "10px" }}>{featured.name}</h2>
                  {(featured.subtitle || featured.description) && (
                    <p className="line-clamp-2" style={{ fontSize: "16px", lineHeight: 1.6, color: "var(--color-text-soft)", maxWidth: "460px", marginBottom: "28px" }}>{featured.subtitle || stripHtml(featured.description)}</p>
                  )}
                  <div className="flex gap-3">
                    <a href={featured.link} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all select-none" style={{ background: "var(--color-accent)", color: "#fff" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.30)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                      立即打开
                      <span className="flex items-center justify-center w-6 h-6 rounded-full transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-px" style={{ background: "rgba(255,255,255,0.18)" }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-6-6m6 6l-6 6" /></svg>
                      </span>
                    </a>
                    <Link href={`/resource/${featured.id}`} className="group inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all select-none" style={{ background: "rgba(255,255,255,0.7)", color: "var(--color-text)", border: "1.5px solid rgba(0,0,0,0.08)", backdropFilter: "blur(4px)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; e.currentTarget.style.color = "var(--color-accent)"; e.currentTarget.style.background = "#fff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "var(--color-text)"; e.currentTarget.style.background = "rgba(255,255,255,0.7)"; }}>查看详情</Link>
                  </div>
                </div>
                <div className="hidden sm:flex shrink-0 items-center justify-center" style={{ flex: "0 0 40%", minWidth: 0 }}>
                  <div className="rounded-[20px] p-2" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", animation: "icon-float 5s ease-in-out infinite" }}>
                    <div className="flex items-center justify-center select-none rounded-[12px]" style={{ width: "320px", height: "200px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.7)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                      <HeroFavicon link={featured.link} fallback={cMap.get(featured.category)?.icon || "📦"} />
                    </div>
                  </div>
                </div>
              </div>
              {totalSlides > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {Array.from({ length: totalSlides }).map((_, i) => (
                    <button key={i} onClick={() => setSlideIdx(i)} className="w-2 h-2 rounded-full transition-all" style={{ background: i === slideIdx ? "var(--color-accent)" : "rgba(0,0,0,0.10)", boxShadow: i === slideIdx ? "0 0 6px rgba(37,99,235,0.4)" : "none", transition: "all 300ms var(--ease-spring)", transform: i === slideIdx ? "scale(1.3)" : "scale(1)", border: "none", cursor: "pointer" }} />
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Search results / Single category / Sectioned home */}
        {search && <SearchView display={display} cMap={cMap} />}
        {activeCategory && !search && <CategoryView display={display} cMap={cMap} activeCategory={activeCategory} />}
        {!activeCategory && !search && <DesktopSections display={display} cMap={cMap} recent={recent} categorySections={categorySections} selectCat={selectCat} />}
      </div>
    </div>
  );
}

function SearchView({ display, cMap }: { display: Resource[]; cMap: Map<string, Category> }) {
  return (<><ScrollReveal><SectionHeading title={`搜索结果 (${display.length})`} /></ScrollReveal>{display.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{display.map((r, i) => <ScrollReveal key={r.id} delay={i * 50}><ResourceCard resource={r} category={cMap.get(r.category)} /></ScrollReveal>)}</div> : <Empty message="没有匹配的资源" hint="试试别的关键词" />}</>);
}

function CategoryView({ display, cMap, activeCategory }: { display: Resource[]; cMap: Map<string, Category>; activeCategory: string }) {
  return (<><ScrollReveal><SectionHeading title={`${cMap.get(activeCategory)?.icon || ""} ${cMap.get(activeCategory)?.name || ""} (${display.length})`} /></ScrollReveal>{display.length > 0 ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{display.map((r, i) => <ScrollReveal key={r.id} delay={i * 50}><ResourceCard resource={r} category={cMap.get(r.category)} /></ScrollReveal>)}</div> : <Empty message="还没有资源" hint="登录后就可以添加啦" />}</>);
}

function DesktopSections({ display, cMap, recent, categorySections, selectCat }: { display: Resource[]; cMap: Map<string, Category>; recent: Resource[]; categorySections: [string, Resource[]][]; selectCat: (id: string | null) => void }) {
  return (
    <>
      {recent.length > 0 && (
        <div>
          <SectionHeading title="最近更新" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((r, i) => <ScrollReveal key={r.id} delay={i * 50}><ResourceCard resource={r} category={cMap.get(r.category)} /></ScrollReveal>)}
          </div>
        </div>
      )}
      {categorySections.map(([catId, items]) => {
        const cat = cMap.get(catId);
        if (!cat || items.length === 0) return null;
        const shown = items.slice(0, 3);
        return (
          <div key={catId}>
            <SectionHeading title={`${cat.icon} ${cat.name}`} count={items.length} onViewAll={() => selectCat(cat.id)} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map((r, i) => <ScrollReveal key={r.id} delay={i * 50}><ResourceCard resource={r} category={cat} /></ScrollReveal>)}
            </div>
          </div>
        );
      })}
      {display.length === 0 && <Empty message="还没有资源" hint="登录后就可以添加啦" />}
    </>
  );
}

// Re-use the same card from original (not in shared to keep the file simpler)
function ResourceCard({ resource, category }: { resource: Resource; category?: Category }) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  return (
    <Link href={`/resource/${resource.id}`} className="block group" style={{ textDecoration: "none" }}>
      <div className="rounded-[var(--radius-xl)] p-[1px] h-full transition-all" style={{ background: "var(--color-border)", transition: "all 300ms var(--ease-spring)" }}>
        <div className="flex flex-col p-5 rounded-[calc(var(--radius-xl)-1px)] transition-all active:scale-[0.985]"
          style={{ background: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)", transition: "all 300ms var(--ease-spring)", minHeight: "120px" }}
          onMouseEnter={(e) => { const p = e.currentTarget.parentElement; if (p) { p.style.background = "var(--color-accent-ring)"; p.style.transform = "translateY(-2px)"; p.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-card-hover)"; } }}
          onMouseLeave={(e) => { const p = e.currentTarget.parentElement; if (p) { p.style.background = "var(--color-border)"; p.style.transform = "translateY(0)"; p.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)"; } }}>
          <div className="flex items-start gap-3 mb-2.5">
            <FaviconIcon link={resource.link} alt={resource.name} fallback={category?.icon || "📦"} />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold truncate" style={{ fontSize: "15px", color: "var(--color-text)" }}>{resource.name}</h3>
                {resource.featured && <span className="shrink-0" style={{ color: "var(--color-accent)", fontSize: "13px" }}>★</span>}
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>{resource.subtitle || ""}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {category && <span className="text-xs px-2 py-0.5 rounded-md font-medium" style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}>{category.name}</span>}
            {tags.slice(0, 4 - (category ? 1 : 0)).map((tag, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--color-paper-2)", color: "var(--color-text-muted)" }}>{tag}</span>)}
            {tags.length > (category ? 3 : 4) && <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>+{tags.length - (category ? 3 : 4)}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
