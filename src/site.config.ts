// web/src/site.config.ts

import type { SiteConfig } from "./types.ts"

export const siteConfig: SiteConfig = {
	author: "Anthony Campolo",
	title: "Astro AutoShow",
	description: "AutoShow site generator with Astro.",
	lang: "en-US",
	ogLocale: "en_US",
	sortPostsByUpdatedDate: false,
	date: {
		locale: "en-US",
		options: {
			day: "numeric",
			month: "long",
			year: "numeric",
		},
	},
}