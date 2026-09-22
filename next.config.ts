import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this app so Turbopack doesn't get confused by
  // the stray package-lock.json one directory up.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
