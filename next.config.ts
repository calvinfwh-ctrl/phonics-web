import type { NextConfig } from "next";

/**
 * China-accessible hosting.
 * The GitHub repo is private, so github.io cannot be published, and github.io
 * is blocked in mainland China anyway. The static site is pushed to the `web`
 * branch and opened through a jsDelivr mirror that uses a mainland CDN.
 *
 * Open open.svg, not index.html. These CDNs serve HTML as plain text.
 *   https://cdn.jsdmirror.com/gh/calvinfwh-ctrl/phonics-web@web/open.svg
 */
const cdnBasePath =
  process.env.WEB_CDN === "true" ? "/gh/calvinfwh-ctrl/phonics-web@web" : "";

const nextConfig: NextConfig = {
  output: "export",
  // Disable strict mode for speech API compatibility
  reactStrictMode: false,
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: cdnBasePath || undefined,
  env: {
    NEXT_PUBLIC_BASE_PATH: cdnBasePath,
  },
};

export default nextConfig;
