import type { NextConfig } from "next";

const isGhPages = process.env.GITHUB_PAGES === "true";
const repoName = "phonics-web";
const basePath = isGhPages ? `/${repoName}` : "";

const nextConfig: NextConfig = {
  // Static export so the app can be hosted on GitHub Pages (public HTTPS).
  output: "export",
  // Disable strict mode for speech API compatibility
  reactStrictMode: false,
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: basePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
