// web/astro.config.ts

import { defineConfig } from "astro/config"
import react from '@astrojs/react'
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import expressiveCode from "astro-expressive-code"
import { expressiveCodeOptions } from "./src/site.config"

// https://astro.build/config
export default defineConfig({
    output: "server",
    site: "https://autoshow.sh/",
    integrations: [
      expressiveCode(expressiveCodeOptions),
      sitemap(),
      mdx(),
      react(),
    ],
    // https://docs.astro.build/en/guides/prefetch/
    prefetch: true,
})