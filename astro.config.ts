// astro.config.ts

import { defineConfig } from "astro/config"
import solid from '@astrojs/solid-js'
import sitemap from "@astrojs/sitemap"
import node from "@astrojs/node"
import db from "@astrojs/db"

export default defineConfig({
  output: 'server',
  site: "https://autoshow.sh/",
  integrations: [
    sitemap(),
    db(),
    solid(),
  ],
  prefetch: true,
  adapter: node({
    mode: "middleware",
  }),
})