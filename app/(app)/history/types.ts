export type HistorySource =
	| "google-analytics"
	| "shopify"
	| "stripe"
	| "meta-ads"
	| "site-health";

export type HistoryReport = {
	id: string;
	date: string;
	title: string;
	summary: string;
	sources: HistorySource[];
	isLatest?: boolean;
};

export type BusinessProgress = {
	label: string;
	title: string;
	description: string;
	change?: string;
};