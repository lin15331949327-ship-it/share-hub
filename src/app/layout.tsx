import type { Metadata } from "next";
import { seed } from "@/lib/seed";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShareHub",
  description: "极简资源共享站",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <SeedRunner />
      </body>
    </html>
  );
}

async function SeedRunner() {
  try {
    await seed();
  } catch {
    // Silently fail — seed only works with KV connected
  }
  return null;
}
