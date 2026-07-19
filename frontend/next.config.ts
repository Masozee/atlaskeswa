import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  images: {
    // Hosts allowed for next/image. Survey photos are served from the
    // Django media host (absolute URLs like https://api.atlaskeswa.id/media/...).
    remotePatterns: [
      { protocol: "https", hostname: "api.atlaskeswa.id", pathname: "/media/**" },
      { protocol: "https", hostname: "atlaskeswa.id", pathname: "/media/**" },
      { protocol: "https", hostname: "www.atlaskeswa.id", pathname: "/media/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
    ],
  },
};

export default nextConfig;
