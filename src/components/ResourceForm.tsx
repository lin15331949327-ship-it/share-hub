"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import type { Category, Resource } from "@/lib/types";

interface Props {
  categories: Category[];
  resource?: Resource; // if editing
}

export default function ResourceForm({ categories, resource }: Props) {
  const router = useRouter();
  const [name, setName] = useState(resource?.name || "");
  const [link, setLink] = useState(resource?.link || "");
  const [category, setCategory] = useState(resource?.category || categories[0]?.id || "");
  const [tags, setTags] = useState(resource?.tags?.join(", ") || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const packageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      LinkExtension.configure({ openOnClick: false }),
      ImageExtension.configure({ allowBase64: false }),
    ],
    content: resource?.description || "",
    immediatelyRender: false,
  });

  async function uploadImage(file: File) {
    await uploadAndInsert(file, "image");
  }

  async function uploadVideoFile(file: File) {
    await uploadAndInsert(file, "video");
  }

  async function uploadPackage(file: File) {
    await uploadAndInsert(file, "file");
  }

  async function uploadAndInsert(file: File, type: "image" | "video" | "file") {
    setUploading(true);
    try {
      // 1. Get presigned upload URL from server
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "获取上传链接失败");
      }
      const { uploadUrl, fileUrl } = await res.json();

      // 2. Upload directly to R2 (no custom headers — let browser handle it)
      const putRes = await fetch(uploadUrl, { method: "PUT", body: file });
      if (!putRes.ok) {
        const errText = await putRes.text();
        throw new Error(`上传失败(${putRes.status}): ${errText.slice(0, 100)}`);
      }

      // 3. Insert into editor
      if (type === "image") {
        editor?.chain().focus().setImage({ src: fileUrl }).run();
      } else if (type === "video") {
        editor?.chain().focus().insertContent(
          `<video src="${fileUrl}" controls preload="metadata" style="width:100%;max-width:100%;border-radius:8px"><p>你的浏览器不支持视频播放，<a href="${fileUrl}">点此下载</a></p></video>`
        ).run();
      } else {
        const sizeMb = (file.size / 1024 / 1024).toFixed(1);
        editor?.chain().focus().insertContent(
          `<p><a href="${fileUrl}" download style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:#f4f4f5;border-radius:8px;color:#18181b;text-decoration:none;font-weight:500">📦 ${file.name} （${sizeMb} MB） — 点击下载</a></p>`
        ).run();
      }
    } catch (e: any) {
      alert(e.message || "上传失败");
    }
    setUploading(false);
  }

  function insertVideo() {
    const videoUrl = window.prompt("粘贴视频链接（支持 B站 / YouTube / 直链 MP4）：");
    if (!videoUrl) return;

    let embedHtml = "";
    const biliMatch = videoUrl.match(/bilibili\.com\/video\/(BV\w+)/);
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);

    if (biliMatch) {
      embedHtml = `<iframe src="https://player.bilibili.com/player.html?bvid=${biliMatch[1]}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px" allowfullscreen></iframe>`;
    } else if (ytMatch) {
      embedHtml = `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" style="width:100%;aspect-ratio:16/9;border:none;border-radius:8px" allowfullscreen></iframe>`;
    } else if (/\.mp4$/i.test(videoUrl)) {
      embedHtml = `<video src="${videoUrl}" controls style="width:100%;max-width:100%;border-radius:8px"></video>`;
    } else {
      embedHtml = `<p><a href="${videoUrl}">📺 查看视频</a></p>`;
    }

    editor?.chain().focus().insertContent(embedHtml).run();
  }

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].id);
    }
  }, [categories, category]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !link.trim()) {
      setError("名称和链接必填");
      return;
    }
    setSaving(true);
    setError("");

    const body = {
      name: name.trim(),
      link: link.trim(),
      category,
      description: editor?.getHTML() || "",
      tags: tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
    };

    const url = resource ? `/api/resources/${resource.id}` : "/api/resources";
    const method = resource ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/resources");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "保存失败");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">名称 *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
          placeholder="IDM 破解版 v6.42"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">链接 *</label>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
          placeholder="https://www.123pan.com/s/xxx 或 https://..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">分类 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all bg-white"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">标签</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-100 outline-none transition-all"
            placeholder="破解, 绿色版, 2026"
          />
          <p className="text-xs text-zinc-400 mt-1">逗号分隔</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1.5">描述</label>
        <div className="border border-zinc-300 rounded-lg overflow-hidden focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-100 transition-all">
          <div className="flex gap-1 p-2 border-b border-zinc-200 bg-zinc-50 flex-wrap">
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`px-2 py-1 text-sm rounded hover:bg-zinc-200 ${editor?.isActive("bold") ? "bg-zinc-200 font-bold" : ""}`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`px-2 py-1 text-sm rounded hover:bg-zinc-200 ${editor?.isActive("italic") ? "bg-zinc-200 italic" : ""}`}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1 text-sm rounded hover:bg-zinc-200 ${editor?.isActive("heading") ? "bg-zinc-200 font-bold" : ""}`}
            >
              H2
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={`px-2 py-1 text-sm rounded hover:bg-zinc-200 ${editor?.isActive("bulletList") ? "bg-zinc-200" : ""}`}
            >
              • List
            </button>
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("链接地址:");
                if (url) editor?.chain().focus().setLink({ href: url }).run();
              }}
              className={`px-2 py-1 text-sm rounded hover:bg-zinc-200 ${editor?.isActive("link") ? "bg-zinc-200 underline" : ""}`}
            >
              🔗
            </button>
            <span className="w-px bg-zinc-300 mx-0.5" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-2 py-1 text-sm rounded hover:bg-zinc-200 disabled:opacity-50"
              title="上传图片（最大 4.5MB）"
            >
              {uploading ? "⏳" : "🖼️"}
            </button>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              disabled={uploading}
              className="px-2 py-1 text-sm rounded hover:bg-zinc-200 disabled:opacity-50"
              title="上传视频（最大 500MB）"
            >
              📹
            </button>
            <button
              type="button"
              onClick={() => packageInputRef.current?.click()}
              disabled={uploading}
              className="px-2 py-1 text-sm rounded hover:bg-zinc-200 disabled:opacity-50"
              title="上传安装包/文件（最大 500MB）"
            >
              📦
            </button>
            <button
              type="button"
              onClick={insertVideo}
              className="px-2 py-1 text-sm rounded hover:bg-zinc-200"
              title="嵌入视频链接（B站/YouTube/MP4）"
            >
              🎬
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
            <input
              ref={videoInputRef}
              type="file"
              accept="video/mp4,video/webm,video/ogg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadVideoFile(file);
                e.target.value = "";
              }}
            />
            <input
              ref={packageInputRef}
              type="file"
              accept=".exe,.msi,.zip,.rar,.7z,.dmg,.apk,.iso,.tar.gz,.tgz"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadPackage(file);
                e.target.value = "";
              }}
            />
          </div>
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[150px]"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "保存中..." : resource ? "保存修改" : "发布资源"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 text-zinc-600 hover:text-zinc-900 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
