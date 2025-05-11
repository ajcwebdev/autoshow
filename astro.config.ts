// astro.config.ts

import { defineConfig } from "astro/config"
import solid from '@astrojs/solid-js'
import sitemap from "@astrojs/sitemap"
import node from "@astrojs/node"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  output: 'server',
  site: "https://autoshow.sh/",

  integrations: [
    sitemap(),
    solid(),
  ],

  prefetch: true,

  adapter: node({
    mode: "middleware",
  }),

  vite: {
    plugins: [tailwindcss()],
  },
})