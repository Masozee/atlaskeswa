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
  // The atlas page was renamed "Penyedia layanan"; keep old links and the
  // `?kecamatan=` deep-link working (query strings carry over).
  async redirects() {
    return [{ source: "/layanan-kesehatan", destination: "/penyedia-layanan", permanent: true }];
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
    // Next 16 blocks the image optimizer from fetching loopback/private IPs.
    // The Django dev server lives on localhost:8000, so allow it in dev only.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
