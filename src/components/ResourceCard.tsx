import Link from "next/link";
import type { Resource, Category } from "@/lib/types";

interface Props {
  resource: Resource;
  category?: Category;
  /** stagger delay index for entrance animation */
  index?: number;
}

export default function ResourceCard({ resource, category, index = 0 }: Props) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];
  const delay = `${index * 60}ms`;

  return (
    <Link
      href={`/resource/${resource.id}`}
      className="block p-6 rounded-[var(--radius-lg)] border transition-all duration-[var(--dur-normal)] animate-card-in"
      style={{
        background: "var(--color-surface)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
        ["--card-delay" as string]: delay,
        textDecoration: "none",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-card-hover)";
        e.currentTarget.style.borderColor = "oklch(58% 0.16 65 / 30%)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.borderColor = "var(--color-border)";
      }}
    >
      {/* Header: title + category badge */}
      <div className="flex items-start justify-between mb-2 gap-2">
        <h3
          className="font-medium line-clamp-1"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-base)",
            color: "var(--color-text)",
            fontWeight: 600,
          }}
        >
          {resource.name}
        </h3>
        {category && (
          <span
            className="shrink-0 text-xs px-2.5 py-1 rounded-full"
            style={{
              background: "var(--color-accent-glow)",
              color: "var(--color-accent)",
              fontWeight: 500,
            }}
          >
            {category.icon} {category.name}
          </span>
        )}
      </div>

      {/* Description */}
      {resource.description && (
        <p
          className="line-clamp-2 mb-3 leading-relaxed"
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-text-soft)",
          }}
        >
          {stripHtml(resource.description)}
        </p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag, i) => (
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
          {tags.length > 4 && (
            <span
              className="text-xs px-2 py-0.5 rounded-md"
              style={{ color: "var(--color-text-muted)" }}
            >
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 120);
}
