import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";
import { ensurePartnerConvexEnv, loadLocalEnv } from "./scripts/load-local-env.mjs";

loadLocalEnv();
ensurePartnerConvexEnv();

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Root partners/ is the canonical app. Use the wrapper workspace root so
// Turbopack can resolve shared Anan packages without scanning from a stale
// nested app location.
const wrapperWorkspaceRoot = path.resolve(dirname, "..");
const historicalAnanRoot = path.resolve(dirname, "../../");
const isHistoricalNestedApp = dirname.includes(path.join("apps", "partners"));
const projectRoot = isHistoricalNestedApp ? historicalAnanRoot : wrapperWorkspaceRoot;

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    externalDir: true,
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL ?? "",
    NEXT_PUBLIC_CONVEX_SITE_URL: process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? process.env.CONVEX_SITE_URL ?? "",
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
