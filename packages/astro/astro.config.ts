import { defineConfig } from "astro/config"
import react from '@astrojs/react';
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import icon from "astro-icon"
import expressiveCode from "astro-expressive-code"
import { expressiveCodeOptions } from "./src/site.config"

// https://astro.build/config
export default defineConfig({
    site: "https://autoshow.sh/",
    integrations: [
      expressiveCode(expressiveCodeOptions),
      icon(),
      sitemap(),
      mdx(),
      react(),
    ],
    // https://docs.astro.build/en/guides/prefetch/
    prefetch: true,
})