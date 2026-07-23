import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { seed } from "@/lib/seed";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import PwaRegister from "@/components/PwaRegister";
import { DeviceProvider } from "./DeviceProvider";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ShareHub",
  description: "极简资源共享站",
  manifest: "/manifest.json",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const device = /Mobile|Android|iPhone|iPad|iPod/i.test(ua) ? "mobile" as const : "desktop" as const;

  return (
    <html lang="zh-CN" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased" style={{ background: "#fafafa" }}>
        <DeviceProvider device={device}>
          <AuthGuard>
            <Navbar />
            <main className="max-w-6xl mx-auto px-6 pb-24 pt-4">{children}</main>
          </AuthGuard>
        </DeviceProvider>
        <PwaRegister />
        <SeedRunner />
      </body>
    </html>
  );
}

async function SeedRunner() {
  try {
    await seed();
  } catch {
    // Silently fail
  }
  return null;
}
