import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow large file uploads (up to 100MB)
  serverActions: { bodySizeLimit: "100mb" },
};

export default nextConfig;
