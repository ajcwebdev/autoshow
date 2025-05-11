// astro.config.ts

import { defineConfig } from "astro/config"
import solid from '@astrojs/solid-js'
import sitemap from "@astrojs/sitemap"
import tailwindcss from "@tailwindcss/vite"
import icon from "astro-icon"

export default defineConfig({
  output: 'server',
  site: "https://autoshow.sh/",

  integrations: [
    sitemap(),
    solid(),
    icon(),
  ],

  prefetch: true,

  vite: {
    plugins: [tailwindcss()],
  },
})