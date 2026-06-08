import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Disable CSS caching in dev so changes reflect without hard refresh
  ...(isDev && {
    headers: async () => [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ],
  }),
};

export default nextConfig;
