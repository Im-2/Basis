import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // The web app imports backend modules from ../src (see @backend/* in
    // tsconfig.json), so Turbopack's root needs to cover the whole repo,
    // not just web/.
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
