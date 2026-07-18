import { getAllCategories } from "@/lib/kv";
import ResourceForm from "@/components/ResourceForm";

export const dynamic = "force-dynamic";

export default async function NewResourcePage() {
  const categories = await getAllCategories();
  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 mb-6">新建资源</h1>
      <ResourceForm categories={categories} />
    </div>
  );
}
