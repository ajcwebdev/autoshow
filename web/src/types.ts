export interface SiteConfig {
	author: string;
	title: string;
	description: string;
	lang: string;
	ogLocale: string;
	date: {
		locale: string | string[] | undefined;
		options: Intl.DateTimeFormatOptions;
	};
	sortPostsByUpdatedDate: boolean;
}

export interface PaginationLink {
	url: string;
	text?: string;
	srLabel?: string;
}

export interface SiteMeta {
	title: string;
	description?: string;
	ogImage?: string | undefined;
	articleDate?: string | undefined;
}

export interface Author {
	type: string;
	name: string;
	photo: string;
	url: string;
}

export interface Content {
	"content-type": string;
	value: string;
	html: string;
	text: string;
}

export interface Rels {
	canonical: string;
}

export interface Summary {
	"content-type": string;
	value: string;
}
