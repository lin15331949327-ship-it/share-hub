import Link from "next/link";
import { notFound } from "next/navigation";
import { getResource, getAllCategories } from "@/lib/kv";

async function getData(id: string) {
  const [resource, categories] = await Promise.all([getResource(id), getAllCategories()]);
  if (!resource) return null;
  const category = categories.find((c) => c.id === resource!.category);
  return { resource, category };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  const { resource, category } = data;
  const tags = Array.isArray(resource.tags) ? resource.tags : [];

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href={resource.category ? `/?cat=${resource.category}` : "/"}
        className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors mb-6 inline-block"
      >
        ← 返回首页
      </Link>

      <article className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-zinc-900">{resource.name}</h1>
          {category && (
            <span className="shrink-0 text-sm text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full ml-3">
              {category.icon} {category.name}
            </span>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag, i) => (
              <span key={i} className="text-sm text-zinc-500 bg-zinc-50 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {resource.description && (
          <div
            className="prose prose-sm max-w-none mb-8 text-zinc-700"
            dangerouslySetInnerHTML={{ __html: resource.description }}
          />
        )}

        <a
          href={resource.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors"
        >
          🔗 打开链接
        </a>
      </article>
    </div>
  );
}
