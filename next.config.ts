import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKENDURL || "http://localhost:5007/api";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
