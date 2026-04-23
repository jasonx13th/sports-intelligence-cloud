import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: resolve(projectDir, "../.."),
    resolveAlias: {
      tailwindcss: resolve(projectDir, "node_modules/tailwindcss")
    }
  }
};

export default nextConfig;
