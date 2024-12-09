import { defineCollection, z } from "astro:content"
import { glob } from 'astro/loaders'

const post = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/data/post" }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60),
	  description: z.string().min(10).max(200),
	  publishDate: z.string().or(z.date()).transform((val) => new Date(val)),
      updatedDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
	  coverImage: z.object({alt: z.string(),src: image()}).optional(),
	  ogImage: z.string().optional(),
    }),
})

export const collections = { post }