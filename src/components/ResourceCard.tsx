import Link from "next/link";
import type { Resource, Category } from "@/lib/types";

interface Props {
  resource: Resource;
  category?: Category;
}

export default function ResourceCard({ resource, category }: Props) {
  const tags = Array.isArray(resource.tags) ? resource.tags : [];

  return (
    <Link
      href={`/resource/${resource.id}`}
      className="block p-5 rounded-xl border border-zinc-200 bg-white hover:shadow-md hover:border-zinc-300 transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-medium text-zinc-900 group-hover:text-zinc-700 transition-colors line-clamp-1">
          {resource.name}
        </h3>
        {category && (
          <span className="shrink-0 text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full ml-2">
            {category.icon} {category.name}
          </span>
        )}
      </div>

      {resource.description && (
        <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
          {stripHtml(resource.description)}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="text-xs text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-md"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-xs text-zinc-400">+{tags.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").slice(0, 120);
}
