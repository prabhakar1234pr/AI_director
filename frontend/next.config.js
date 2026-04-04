/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.googleapis.com" },
      { protocol: "https", hostname: "*.storage.googleapis.com" },
      { protocol: "https", hostname: "storage.cloud.google.com" },
      { protocol: "https", hostname: "cdn.minimax.io" },
      { protocol: "https", hostname: "*.minimax.io" },
    ],
  },
};

module.exports = nextConfig;
