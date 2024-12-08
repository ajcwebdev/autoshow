import type { MarkdownHeading } from "astro";
import { siteConfig } from "@/site-config";

const dateFormat = new Intl.DateTimeFormat(siteConfig.date.locale, siteConfig.date.options);

export function getFormattedDate(
	date: string | number | Date,
	options?: Intl.DateTimeFormatOptions,
) {
	if (typeof options !== "undefined") {
		return new Date(date).toLocaleDateString(siteConfig.date.locale, {
			...(siteConfig.date.options as Intl.DateTimeFormatOptions),
			...options,
		});
	}

	return dateFormat.format(new Date(date));
}


export interface TocItem extends MarkdownHeading {
	children: TocItem[];
}

interface TocOpts {
	maxHeadingLevel?: number | undefined;
	minHeadingLevel?: number | undefined;
}

/** Inject a ToC entry as deep in the tree as its `depth` property requires. */
function injectChild(items: TocItem[], item: TocItem): void {
	const lastItem = items.at(-1);
	if (!lastItem || lastItem.depth >= item.depth) {
		items.push(item);
	} else {
		injectChild(lastItem.children, item);
		return;
	}
}

export function generateToc(
	headings: ReadonlyArray<MarkdownHeading>,
	{ maxHeadingLevel = 4, minHeadingLevel = 2 }: TocOpts = {},
) {
	// by default this ignores/filters out h1 and h5 heading(s)
	const bodyHeadings = headings.filter(
		({ depth }) => depth >= minHeadingLevel && depth <= maxHeadingLevel,
	);
	const toc: Array<TocItem> = [];

	for (const heading of bodyHeadings) injectChild(toc, { ...heading, children: [] });

	return toc;
}

export function toggleClass(element: HTMLElement, className: string) {
	element.classList.toggle(className);
}

export function elementHasClass(element: HTMLElement, className: string) {
	return element.classList.contains(className);
}

export function rootInDarkMode() {
	return document.documentElement.getAttribute("data-theme") === "dark";
}
