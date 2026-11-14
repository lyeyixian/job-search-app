import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // The Docker image runs the standalone server. The trace root is the repo root,
  // because pnpm keeps the packages there.
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  // The application board is the first page of the app. See docs/architecture/routes.md.
  redirects: async () => [{ source: "/", destination: "/applications", permanent: false }],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
