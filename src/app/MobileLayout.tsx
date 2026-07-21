"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { stripHtml } from "./HomeShared";
import { getFaviconSources } from "@/lib/favicon";
import type { Resource, Category } from "@/lib/types";

interface Props {
  display: Resource[];
  search: string;
  setSearch: (v: string) => void;
  activeCategory: string | null;
  cMap: Map<string, Category>;
  sidebarCats: Category[];
  resources: Resource[];
  selectCat: (id: string | null) => void;
  featured: Resource | undefined;
  recent: Resource[];
}

/* ============================== TOKENS ============================== */
const T = {
  bg:      "#09090B",
  surface: "rgba(255,255,255,0.03)",
  raised:  "rgba(255,255,255,0.06)",
  border:  "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.14)",
  accent:  "#3B82F6",
  accentSoft: "rgba(59,130,246,0.12)",
  accentGlow: "rgba(59,130,246,0.20)",
  purple:  "#8B5CF6",
  purpleSoft: "rgba(139,92,246,0.10)",
  text:    "#FAFAFA",
  soft:    "#A1A1AA",
  muted:   "#71717A",
};

/* ============================== HELPERS ============================== */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  if (h < 21) return "Good Evening";
  return "Good Night";
}

type Tab = "home" | "search" | "bookmarks" | "profile";

/* ============================== MAIN ============================== */
export default function MobileLayout({
  display, search, setSearch, activeCategory, cMap,
  sidebarCats, resources, selectCat, featured, recent,
}: Props) {
  const [tab, setTab] = useState<Tab>("home");

  /* Body background override */
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = T.bg;
    return () => { document.body.style.background = prev; };
  }, []);

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/";
  }

  const bookmarkList = useMemo(() => display.filter((r) => r.featured), [display]);

  return (
    <div style={{
      margin: "-1rem -1.5rem -6rem",
      width: "calc(100% + 3rem)",
      background: T.bg,
      color: T.text,
      fontFamily: "var(--font-body)",
      minHeight: "100dvh",
      paddingBottom: "96px",
      position: "relative",
      overflow: "hidden",
    }}>
      <AmbientBackground />

      {/* ═══ HOME TAB ═══ */}
      {tab === "home" && (
        <div className="relative z-10">
          <GreetingHeader onLogout={logout} />
          <AISearch value={search} onChange={setSearch} onFocus={() => setTab("search")} />
          {featured && <FeaturedCard resource={featured} category={cMap.get(featured.category)} />}
          {recent.length > 0 && <RecentScroll items={recent} cMap={cMap} />}
          {/* Collections */}
          {!activeCategory && !search && sidebarCats.map((cat) => {
            const items = display.filter((r) => r.category === cat.id);
            if (items.length === 0) return null;
            return <CollectionStrip key={cat.id} category={cat} items={items} selectCat={selectCat} />;
          })}
          <div style={{ height: 16 }} />
        </div>
      )}

      {/* ═══ SEARCH TAB ═══ */}
      {tab === "search" && (
        <div className="relative z-10">
          <div className="px-5 pt-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: T.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Ask ShareHub…" autoFocus
                className="w-full h-12 pl-12 pr-5 rounded-2xl text-[15px] outline-none transition-all"
                style={{
                  background: T.surface, border: `1px solid ${T.border}`, color: T.text,
                  fontFamily: "var(--font-body)",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentSoft}`; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <p className="mt-3 text-xs text-balance" style={{ color: T.muted, paddingLeft: 4 }}>
              搜索工具、网站、教程…
            </p>
          </div>
          <div className="px-5 pt-4 space-y-2">
            {display.length > 0 ? display.map((r, i) => (
              <SearchResult key={r.id} resource={r} category={cMap.get(r.category)} index={i} />
            )) : (
              <EmptyState icon="🔍" title="No results" subtitle="Try a different keyword" />
            )}
          </div>
        </div>
      )}

      {/* ═══ BOOKMARKS TAB ═══ */}
      {tab === "bookmarks" && (
        <div className="relative z-10 px-5 pt-4">
          <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>★ Starred</h2>
          <div className="space-y-2">
            {bookmarkList.length > 0 ? bookmarkList.map((r, i) => (
              <SearchResult key={r.id} resource={r} category={cMap.get(r.category)} index={i} />
            )) : (
              <EmptyState icon="★" title="No starred items" subtitle="Star resources to see them here" />
            )}
          </div>
        </div>
      )}

      {/* ═══ PROFILE TAB ═══ */}
      {tab === "profile" && (
        <div className="relative z-10 px-5 pt-4">
          {/* Avatar */}
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})` }}>
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2} style={{ color: "#fff" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold mt-4" style={{ fontFamily: "var(--font-display)" }}>ShareHub</h2>
            <p className="text-sm mt-1" style={{ color: T.muted }}>AI-native resource sharing</p>
          </div>

          {/* Menu links */}
          <div className="space-y-2">
            <ProfileLink href="/admin/resources/new" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} label="提交资源" />
            <ProfileLink href="/admin/resources" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>} label="管理资源" />
            <ProfileLink href="/admin/categories" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>} label="管理分类" />

            <hr className="my-3" style={{ borderColor: T.border }} />

            <button onClick={logout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
              style={{ color: "#EF4444", background: T.surface, border: `1px solid ${T.border}` }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              退出登录
            </button>

            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("view", "desktop");
                window.location.href = url.toString();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] mt-2"
              style={{ background: T.surface, color: T.soft, border: `1px solid ${T.border}` }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
              </svg>
              Switch to Desktop
            </button>
          </div>
        </div>
      )}

      {/* ═══ BOTTOM NAV ═══ */}
      <BottomNav tab={tab} onTab={setTab} />
    </div>
  );
}

/* =========================== SUB-COMPONENTS =========================== */

function AmbientBackground() {
  return (
    <>
      <div className="absolute pointer-events-none" style={{
        top: "-20%", left: "-30%", width: "500px", height: "500px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${T.accentGlow} 0%, rgba(59,130,246,0.03) 40%, transparent 70%)`,
        filter: "blur(40px)",
      }} />
      <div className="absolute pointer-events-none" style={{
        top: "5%", right: "-25%", width: "360px", height: "360px",
        borderRadius: "50%",
        background: `radial-gradient(circle, ${T.purpleSoft} 0%, rgba(139,92,246,0.02) 40%, transparent 70%)`,
        filter: "blur(40px)",
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: "10%", left: "20%", width: "250px", height: "250px",
        borderRadius: "50%",
        background: `radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 60%)`,
        filter: "blur(60px)",
      }} />
    </>
  );
}

function GreetingHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex items-start justify-between px-5 pt-5 pb-1">
      <div>
        <p className="text-sm font-medium" style={{ color: T.muted }}>{greeting()},</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5" style={{ fontFamily: "var(--font-display)" }}>
          ShareHub
        </h1>
        <p className="text-[13px] mt-1 text-balance" style={{ color: T.soft }}>小圈子，大资源。</p>
      </div>
      <button onClick={onLogout}
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-90"
        style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`, border: "none", cursor: "pointer" }}
        title="退出登录">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>
      </button>
    </div>
  );
}

function AISearch({ value, onChange, onFocus }: { value: string; onChange: (v: string) => void; onFocus: () => void }) {
  return (
    <div className="px-5 pt-4 pb-2">
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: T.muted }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="Ask ShareHub…"
          className="w-full h-12 pl-12 pr-5 rounded-2xl text-[15px] outline-none transition-all placeholder:text-zinc-500"
          style={{
            background: T.surface, border: `1px solid ${T.border}`, color: T.text,
            fontFamily: "var(--font-body)",
          }}
          onFocus={(e) => { onFocus(); e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 0 0 3px ${T.accentSoft}`; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md" style={{ background: T.accentSoft, color: T.accent }}>
            AI
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs text-balance" style={{ color: T.muted, paddingLeft: 4 }}>
        搜索工具、网站、教程…
      </p>
    </div>
  );
}

function FeaturedCard({ resource, category }: { resource: Resource; category?: Category }) {
  const desc = resource.subtitle || (resource.description ? stripHtml(resource.description).slice(0, 120) : "");

  return (
    <div className="px-5 pt-2 pb-4">
      <Link href={`/resource/${resource.id}`} style={{ textDecoration: "none" }}>
        <div className="rounded-3xl p-5 transition-all active:scale-[0.985] relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(139,92,246,0.06) 100%)`,
            border: `1px solid rgba(255,255,255,0.10)`,
            boxShadow: `0 0 40px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)`,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}>
          {/* Today's Pick badge */}
          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold mb-4"
            style={{ background: T.accentSoft, color: T.accent }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Today&apos;s Pick
          </span>

          <div className="flex items-center gap-4">
            {/* Icon — smaller, left-aligned */}
            <div className="shrink-0 relative">
              <div className="absolute inset-0 rounded-2xl blur-lg opacity-25"
                style={{ background: T.accent }} />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: "rgba(59,130,246,0.15)", border: `1px solid rgba(255,255,255,0.12)`, boxShadow: `0 0 20px ${T.accentGlow}` }}>
                <FaviconLarge link={resource.link} fallback={category?.icon || "📦"} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight mb-1" style={{ fontFamily: "var(--font-display)" }}>
                {resource.name}
              </h2>
              {desc && (
                <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: T.soft }}>{desc}</p>
              )}
              <div className="flex gap-2.5 mt-3">
                <a href={resource.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                  style={{ background: "#fff", color: "#09090B" }}
                  onClick={(e) => e.stopPropagation()}>
                  Open
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
                <Link href={`/resource/${resource.id}`}
                  className="inline-flex items-center px-4 py-2 rounded-full text-[13px] font-semibold transition-all active:scale-95"
                  style={{ background: "rgba(255,255,255,0.06)", color: T.text }}
                  onClick={(e) => e.stopPropagation()}>
                  Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function RecentScroll({ items, cMap }: { items: Resource[]; cMap: Map<string, Category> }) {
  return (
    <div className="pt-2 pb-4">
      <div className="flex items-center justify-between px-5 mb-3">
        <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: T.muted }}>Recent</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5" style={{ scrollSnapType: "x mandatory" }}>
        {items.map((r) => (
          <Link key={r.id} href={`/resource/${r.id}`} style={{ textDecoration: "none", scrollSnapAlign: "start", flexShrink: 0 }}>
            <div className="w-[150px] h-[155px] rounded-2xl p-4 transition-all active:scale-[0.97] flex flex-col"
              style={{
                background: T.surface, border: `1px solid ${T.border}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden mb-3 shrink-0"
                style={{ background: T.raised }}>
                <FaviconIcon link={r.link} alt={r.name} fallback={cMap.get(r.category)?.icon || "📦"} />
              </div>
              <h4 className="text-sm font-semibold truncate mb-1 shrink-0" style={{ fontFamily: "var(--font-display)" }}>{r.name}</h4>
              <p className="text-[12px] line-clamp-2 leading-relaxed flex-1" style={{ color: T.muted }}>
                {r.description ? stripHtml(r.description) : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function CollectionStrip({ category, items, selectCat }: { category: Category; items: Resource[]; selectCat: (id: string) => void }) {
  return (
    <div className="pt-2 pb-3">
      <div className="flex items-center justify-between px-5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{category.icon}</span>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>{category.name}</h3>
        </div>
        <button onClick={() => selectCat(category.id)}
          className="text-xs font-medium transition-all active:scale-95 flex items-center gap-1"
          style={{ color: T.accent }}>
          See all <span style={{ color: T.muted, fontWeight: 400 }}>({items.length})</span> →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 scroll-pl-5" style={{ scrollSnapType: "x mandatory" }}>
        {items.slice(0, 4).map((r) => (
          <Link key={r.id} href={`/resource/${r.id}`} style={{ textDecoration: "none", scrollSnapAlign: "start", flexShrink: 0 }}>
            <div className="w-[150px] h-[110px] rounded-2xl p-3 transition-all active:scale-[0.97] flex flex-col items-center text-center"
              style={{
                background: T.surface, border: `1px solid ${T.border}`,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
              }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden mb-2 shrink-0"
                style={{ background: T.raised }}>
                <FaviconIcon link={r.link} alt={r.name} fallback={category.icon || "📦"} />
              </div>
              <h4 className="text-[12px] font-semibold line-clamp-2 leading-tight flex-1 flex items-center px-0.5" style={{ fontFamily: "var(--font-display)", wordBreak: "break-word" }}>{r.name}</h4>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchResult({ resource, category, index }: { resource: Resource; category?: Category; index: number }) {
  return (
    <Link href={`/resource/${resource.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div className="rounded-2xl p-4 transition-all active:scale-[0.985]"
        style={{
          background: T.surface, border: `1px solid ${T.border}`,
          animation: `cardIn 350ms cubic-bezier(0.32,0.72,0,1) ${index * 40}ms both`,
        }}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
            style={{ background: T.raised }}>
            <FaviconIcon link={resource.link} alt={resource.name} fallback={category?.icon || "📦"} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold truncate">{resource.name}</h4>
            {resource.subtitle && <p className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{resource.subtitle}</p>}
          </div>
          {resource.featured && <span style={{ color: T.accent, fontSize: "13px" }}>★</span>}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p style={{ color: T.soft, fontSize: "15px", fontWeight: 500 }}>{title}</p>
      <p className="text-sm mt-1" style={{ color: T.muted }}>{subtitle}</p>
    </div>
  );
}

/* ═══ BOTTOM NAV ═══ */
function BottomNav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 flex justify-center pb-3 px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1 px-2 py-2 rounded-2xl"
        style={{
          background: "rgba(18,18,22,0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: `1px solid ${T.border}`,
          boxShadow: `0 0 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)`,
        }}>
        <NavItem active={tab === "home"} onClick={() => onTab("home")}
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />}
          label="Home" />
        <NavItem active={tab === "search"} onClick={() => onTab("search")}
          icon={<><circle cx="11" cy="11" r="8" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.3-4.3" /></>}
          label="Search" />

        {/* + Add — prominent center */}
        <Link href="/admin/resources/new"
          className="flex flex-col items-center justify-center w-14 h-14 rounded-full transition-all active:scale-90 -mt-5 mx-1"
          style={{
            textDecoration: "none",
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            border: `2px solid rgba(255,255,255,0.2)`,
            boxShadow: `0 0 24px ${T.accentGlow}, 0 4px 16px rgba(59,130,246,0.3)`,
          }}>
          <svg className="w-6 h-6" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Link>

        <NavItem active={tab === "bookmarks"} onClick={() => onTab("bookmarks")}
          icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />}
          label="Saved" />
        <NavItem active={tab === "profile"} onClick={() => onTab("profile")}
          icon={<><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></>}
          label="Profile" />
      </div>
    </div>
  );
}

function ProfileLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
      style={{ textDecoration: "none", background: T.surface, color: T.text, border: `1px solid ${T.border}` }}>
      <span style={{ color: T.soft }}>{icon}</span>
      {label}
    </Link>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-0.5 w-14 py-1 rounded-xl transition-all active:scale-90"
      style={{ color: active ? T.accent : T.muted, transition: "all 200ms cubic-bezier(0.32,0.72,0,1)" }}>
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        {icon}
      </svg>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}

/* ═══ FAVICON ═══ */
function FaviconIcon({ link, alt, fallback }: { link: string; alt: string; fallback: string }) {
  const sources = getFaviconSources(link);
  const [srcIdx, setSrcIdx] = useState(0);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>
      <span style={{ position: "absolute", fontSize: 16, lineHeight: 1 }}>{fallback}</span>
      {srcIdx < sources.length && (
        <img src={sources[srcIdx]} alt={alt}
          style={{ position: "relative", zIndex: 1, width: 20, height: 20, objectFit: "contain", background: "transparent" }}
          onError={() => setSrcIdx((i) => i + 1)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth < 6) setSrcIdx((i) => i + 1); }} />
      )}
    </span>
  );
}

function FaviconLarge({ link, fallback }: { link: string; fallback: string }) {
  const sources = getFaviconSources(link);
  const [srcIdx, setSrcIdx] = useState(0);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40 }}>
      <span style={{ position: "absolute", fontSize: 32, lineHeight: 1 }}>{fallback}</span>
      {srcIdx < sources.length && (
        <img src={sources[srcIdx]} alt=""
          style={{ position: "relative", zIndex: 1, width: 40, height: 40, objectFit: "contain", background: "transparent" }}
          onError={() => setSrcIdx((i) => i + 1)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth < 6) setSrcIdx((i) => i + 1); }} />
      )}
    </span>
  );
}
