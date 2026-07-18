import { notFound } from "next/navigation";
import { getResource, getAllCategories } from "@/lib/kv";
import ResourceForm from "@/components/ResourceForm";

export const dynamic = "force-dynamic";

export default async function EditResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [resource, categories] = await Promise.all([getResource(id), getAllCategories()]);
  if (!resource) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 mb-6">编辑资源</h1>
      <ResourceForm categories={categories} resource={resource} />
    </div>
  );
}
