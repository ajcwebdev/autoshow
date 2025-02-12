// web/astro.config.ts

import { defineConfig } from "astro/config"
import react from '@astrojs/react'
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"

// https://astro.build/config
export default defineConfig({
    output: "server",
    site: "https://autoshow.sh/",
    integrations: [
      sitemap(),
      mdx(),
      react(),
    ],
    prefetch: true,
})