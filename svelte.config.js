import adapter from "@sveltejs/adapter-vercel";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    // Split routes into separate functions so heavy server-only code does not
    // inflate a single Vercel catch-all function past the size limit.
    adapter: adapter({
      split: true,
    }),
  },
};

export default config;
