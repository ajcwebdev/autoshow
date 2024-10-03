import { defineCollection, z } from "astro:content"

const post = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string().max(60),
	  description: z.string().min(10).max(200),
	  publishDate: z.string().or(z.date()).transform((val) => new Date(val)),
      updatedDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
	  coverImage: z.object({alt: z.string(),src: image()}).optional(),
	  ogImage: z.string().optional(),
    }),
  type: "content",
})

export const collections = { post }