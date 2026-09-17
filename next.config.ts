import type { NextConfig } from "next";
import { resolveBuildId } from "./build-id.mjs";

const buildId = resolveBuildId();

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  env: {
    NEXT_PUBLIC_APP_BUILD_ID: buildId,
  },
  generateBuildId: async () => `ourjourney-${buildId}`,
};

export default nextConfig;
