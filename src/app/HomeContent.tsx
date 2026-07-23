"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useHomeData, HeroFavicon, ScrollReveal, SectionHeading, Empty, stripHtml } from "./HomeShared";
import MobileLayout from "./MobileLayout";
import ResourceCard from "@/components/ResourceCard";
import { useDevice } from "./DeviceProvider";
import { useDraggablePosition } from "@/hooks/useDraggablePosition";
import type { Resource, Category } from "@/lib/types";

export default function HomeContent() {
  const sp = useSearchParams();
  const viewParam = sp.get("view");
  const detectedDevice = useDevice();

  // Track window width for auto-switch (SSR-safe: defaults to 0, measured in effect)
  const [winW, setWinW] = useState(0);
  useEffect(() => {
    const onResize = () => setWinW(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ?view=mobile → force mobile; ?view=desktop → force desktop
  // No param → auto: initial UA detection, then live window width (<768px → mobile)
  const isMobile =
    viewParam === "mobile" ||
    (viewParam !== "desktop" &&
      (winW === 0 ? detectedDevice === "mobile" : winW < 768));
  const data = useHomeData();

  if (data.loading) {
    return (
      <div className="flex gap-8" style={{ paddingTop: "24px" }}>
        {/* Sidebar skeleton */}
        <aside className="hidden lg:block shrink-0 sticky top-28 self-start" style={{ width: "220px" }}>
          <div className="rounded-[var(--radius-xl)] p-4 space-y-2" style={{ background: "#fff", border: "1px solid var(--color-border)" }}>
            <div className="h-3 w-12 rounded-full animate-pulse" style={{ background: "var(--color-paper-3)" }} />
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="h-9 rounded-[var(--radius-md)] animate-pulse" style={{ background: "var(--color-paper-2)", animationDelay: `${i*80}ms` }} />
            ))}
          </div>
        </aside>
        {/* Grid skeleton */}
        <div className="flex-1 min-w-0 space-y-8 sm:space-y-14">
          {/* Search skeleton */}
          <div className="h-11 rounded-full animate-pulse" style={{ background: "var(--color-paper-2)", maxWidth: "480px" }} />
          {/* Card skeletons */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="rounded-[var(--radius-xl)] p-6 animate-pulse" style={{ background: "#fff", border: "1px solid var(--color-border)", animationDelay: `${i*100}ms`, minHeight: "140px" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-11 h-11 rounded-[var(--radius-md)] shrink-0" style={{ background: "var(--color-paper-3)" }} />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <div className="h-4 w-28 rounded" style={{ background: "var(--color-paper-3)" }} />
                    <div className="h-3 w-20 rounded" style={{ background: "var(--color-paper-2)" }} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-5 w-14 rounded-md" style={{ background: "var(--color-accent-glow)" }} />
                  <div className="h-5 w-12 rounded-md" style={{ background: "var(--color-paper-2)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
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
          featured={data.featured}
          recent={data.recent}
        />
      ) : (
        <DesktopView data={data} />
      )}

      {/* Draggable mode switch */}
      <DraggableToggle isMobile={isMobile} />
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
    <div className="flex flex-col lg:flex-row gap-8" style={{ paddingTop: "24px", minHeight: "calc(100vh - 24px)" }}>
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
      <aside className="hidden lg:flex shrink-0 flex-col gap-1 sticky top-20 self-start" style={{ width: "220px" }}>
        <div className="rounded-[var(--radius-xl)] overflow-hidden" style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--color-text-muted)" }}>分类</p>
          </div>
          <div className="px-2 pb-2">
            <button onClick={() => selectCat(null)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-medium transition-all"
              style={{
                background: activeCategory === null ? "var(--color-accent-glow)" : "transparent",
                color: activeCategory === null ? "var(--color-accent)" : "var(--color-text)",
                borderLeft: activeCategory === null ? "2px solid var(--color-accent)" : "2px solid transparent",
                transition: "all 200ms var(--ease-spring)",
              }}>
              <span>全部</span>
              <span className="text-xs tabular-nums" style={{ color: activeCategory === null ? "var(--color-accent)" : "var(--color-text-muted)" }}>{allCount}</span>
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
                    borderLeft: isActive ? "2px solid var(--color-accent)" : "2px solid transparent",
                    transition: "all 200ms var(--ease-spring)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--color-paper-2)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                  <span className="truncate">{cat.icon} {cat.name}</span>
                  <span className="text-xs ml-2 shrink-0 tabular-nums" style={{ color: "var(--color-text-muted)" }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-[var(--radius-xl)] overflow-hidden mt-2" style={{ background: "#fff", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xs)" }}>
          <div className="px-4 pt-4 pb-2">
            <p className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--color-text-muted)" }}>操作</p>
          </div>
          <div className="px-2 pb-2">
            <a href="/admin/resources/new"
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all"
              style={{ color: "var(--color-text-soft)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-paper-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              提交
            </a>
            <a href="/admin/resources"
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all"
              style={{ color: "var(--color-text-soft)", textDecoration: "none" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-paper-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192" /></svg>
              管理
            </a>
            <button onClick={async () => { await fetch("/api/auth", { method: "DELETE" }); window.location.href = "/"; }}
              className="flex items-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius-md)] text-sm transition-all"
              style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-body)" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-paper-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
              退出
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 space-y-8 sm:space-y-14">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--color-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索工具、网站、教程…"
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
                      <HeroFavicon key={featured.id} link={featured.link} fallback={cMap.get(featured.category)?.icon || "📦"} />
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

// ResourceCard is now shared — imported from @/components/ResourceCard

/* ═══ Draggable mode switch button ═══ */
function DraggableToggle({ isMobile }: { isMobile: boolean }) {
  const {
    elementRef: btnRef,
    moved,
    onPointerDown,
    onPointerMove,
    finishDrag,
    persist,
  } = useDraggablePosition<HTMLButtonElement>({ storageKey: "sh-toggle-pos", elementWidth: 44, elementHeight: 44 });

  const onPointerUp = useCallback(() => {
    const finalPos = finishDrag();
    if (finalPos) persist(finalPos);
  }, [finishDrag, persist]);

  function toggle() {
    if (moved.current) return;
    const url = new URL(window.location.href);
    if (isMobile) {
      url.searchParams.set("view", "desktop");
    } else {
      url.searchParams.set("view", "mobile");
      url.searchParams.delete("cat"); // reset category filter when entering mobile
    }
    window.location.href = url.toString();
  }

  return (
    <button
      ref={btnRef}
      onClick={toggle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95"
      style={{
        background: isMobile ? "#06B6D4" : "var(--color-accent)",
        color: "#fff",
        border: "none",
        cursor: "grab",
        touchAction: "none",
      }}
      title={isMobile ? "拖拽移动 / 点击切换桌面版" : "拖拽移动 / 点击切换手机版"}>
      <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {isMobile ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        )}
      </svg>
    </button>
  );
}
