import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      // better-auth always imports telemetry, even when telemetry is disabled.
      // The upstream telemetry package probes /proc, which breaks Vercel's
      // function tracing during build.
      "@better-auth/telemetry": fileURLToPath(
        new URL(
          "./src/lib/server/auth/better-auth-telemetry-stub.ts",
          import.meta.url,
        ),
      ),
    },
  },
  plugins: [tailwindcss(), sveltekit()],
});
