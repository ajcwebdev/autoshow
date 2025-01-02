import { defineConfig } from "astro/config"
import react from '@astrojs/react';
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import icon from "astro-icon"
import expressiveCode from "astro-expressive-code"
import { expressiveCodeOptions } from "./src/site.config"

import db from "@astrojs/db";

// https://astro.build/config
export default defineConfig({
    output: "server",
    site: "https://autoshow.sh/",
    integrations: [
      expressiveCode(expressiveCodeOptions),
      icon(),
      sitemap(),
      mdx(),
      react(),
      db(),
    ],
    // https://docs.astro.build/en/guides/prefetch/
    prefetch: true,
})