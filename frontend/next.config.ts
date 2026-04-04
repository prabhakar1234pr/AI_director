import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "**.storage.googleapis.com" },
      { protocol: "https", hostname: "storage.cloud.google.com" },
      { protocol: "https", hostname: "**.minimax.io" },
      { protocol: "https", hostname: "cdn.minimax.io" },
    ],
  },
};

export default nextConfig;
