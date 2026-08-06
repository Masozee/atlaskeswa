import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  // Pin the workspace root to this app dir. Without it Next walks up and can
  // pick a stray lockfile (e.g. in the home dir) as the root, warning about
  // "multiple lockfiles". __dirname is this frontend/ directory.
  turbopack: {
    root: path.resolve(__dirname),
  },
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
