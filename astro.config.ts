// web/astro.config.ts

import { defineConfig } from "astro/config"
import solid from '@astrojs/solid-js'
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import node from "@astrojs/node"

export default defineConfig({
  output: 'server',
  site: "https://autoshow.sh/",
  integrations: [
    sitemap(),
    mdx(),
    solid(),
  ],
  prefetch: true,
  adapter: node({
    mode: "middleware",
  }),
})