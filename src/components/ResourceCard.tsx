"use client";

import Link from "next/link";
import { FaviconIcon } from "@/app/HomeShared";
import type { Resource, Category } from "@/lib/types";

interface Props {
  resource: Resource;
  category?: Category;
  /** Staggered entrance delay index (0 = no animation delay) */
  index?: number;
}

/**
 * Unified ResourceCard — used on both desktop homepage and admin views.
 *
 * Features: emoji-first favicon, hover tooltip (subtitle), double-border hover
 * effect, category badge, tags, featured star, entrance animation.
 */
export default function ResourceCard({ resource, category, index = 0 }: Props) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const subtitle = resource.subtitle || "";

  return (
    <Link
      href={`/resource/${resource.id}`}
      className="block group/card outline-none relative"
      style={{
        textDecoration: "none",
        animation: "cardIn 500ms var(--ease-spring) both",
        animationDelay: `${index * 60}ms`,
      }}
    >
      {/* ── Hover tooltip ── */}
      {subtitle && (
        <div
          className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-3 px-3.5 py-2 rounded-xl text-xs leading-relaxed max-w-[280px] pointer-events-none opacity-0 group-hover/card:opacity-100 transition-all duration-200 text-center"
          style={{
            background: "var(--color-text)",
            color: "#fff",
            boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          {subtitle}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent"
            style={{ borderTopColor: "var(--color-text)" }}
          />
        </div>
      )}

      {/* ── Card body (double-border pattern) ── */}
      <div
        className="rounded-[var(--radius-xl)] p-[1px] h-full transition-all"
        style={{
          background: "var(--color-border)",
          transition: "all 300ms var(--ease-spring)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--color-accent-ring)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-card-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--color-border)";
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)";
        }}
      >
        <div
          className="flex flex-col p-5 rounded-[calc(var(--radius-xl)-1px)] transition-all active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-ring)]"
          style={{
            background: "#fff",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.6), var(--shadow-sm)",
            transition: "all 300ms var(--ease-spring)",
            minHeight: "120px",
          }}
        >
          {/* Header row: favicon + name */}
          <div className="flex items-start gap-3 mb-2.5">
            <FaviconIcon
              link={resource.link}
              alt={resource.name}
              fallback={category?.icon || "📦"}
            />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-1.5">
                <h3
                  className="font-semibold truncate"
                  style={{ fontSize: "15px", color: "var(--color-text)" }}
                >
                  {resource.name}
                </h3>
                {resource.featured && (
                  <span
                    className="shrink-0"
                    style={{ color: "var(--color-accent)", fontSize: "13px" }}
                  >
                    ★
                  </span>
                )}
              </div>
              <p
                className="text-xs mt-0.5 truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {category && (
              <span
                className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{
                  background: "var(--color-accent-glow)",
                  color: "var(--color-accent)",
                }}
              >
                {category.name}
              </span>
            )}
            {tags
              .slice(0, 4 - (category ? 1 : 0))
              .map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-md"
                  style={{
                    background: "var(--color-paper-2)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {tag}
                </span>
              ))}
            {tags.length > (category ? 3 : 4) && (
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                +{tags.length - (category ? 3 : 4)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
