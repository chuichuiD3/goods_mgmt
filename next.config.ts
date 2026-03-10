import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Pin workspace root so Next does not infer from parent-dir lockfiles (e.g. ~/package-lock.json) */
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
