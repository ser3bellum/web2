"use client";

import { CustomizeDashboardModal } from "app/(app)/components/CustomizeDashboardModal";
import { DASHBOARD_CARDS } from "app/(app)/components/DashboardCards";
import { LogoutButton } from "app/(app)/components/LogoutButton";
import { cn } from "app/(app)/lib/cn";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/getDictionary";

type NavItem = { label: string; href: string; icon: ReactNode };
type AppId = "slack" | "google-analytics" | "shopify" | "stripe" | "meta-ads";

type ConnectorStatus = "active" | "awaiting-data" | "failed" | "disconnected";

type ConnectorItem = {
	id: AppId;
	label: string;
	status: ConnectorStatus;
};

/**
 * Glass system
 * - Hover is more obvious
 * - Active uses brand blue as accent (not full fill)
 */
const glassBase =
	"w-full rounded-xl px-3 py-2.5 flex items-center gap-3 " +
	"border border-white/25 bg-white/10 backdrop-blur-xl " +
	"ring-1 ring-white/10 shadow-sm transition-colors";

const glassHover = "hover:bg-white/22 hover:border-white/45 hover:shadow-md";
const glassActive = "bg-white/18 border-blue-400/35 ring-1 ring-blue-500/20";

type SidebarProps = {
	companyName: string;
	userEmail: string;
	userName?: string;
	avatarUrl?: string | null;
	endUserId: string;
	dictionary: Dictionary;
};

type ConnectionState = {
	slack: ConnectorStatus;
	googleAnalytics: ConnectorStatus;
	shopify: ConnectorStatus;
	stripe: ConnectorStatus;
	metaAds: ConnectorStatus;
};

export function Sidebar({
	companyName,
	userEmail,
	userName,
	avatarUrl,
	endUserId,
	dictionary,
}: SidebarProps) {
	const t = dictionary.navigation;
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
	const [appsOpen, setAppsOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [companyOpen, setCompanyOpen] = useState(false);
	const [connections, setConnections] = useState<ConnectionState>({
	slack: "disconnected",
	googleAnalytics: "disconnected",
	shopify: "disconnected",
	stripe: "disconnected",
	metaAds: "disconnected",
	});

	useEffect(() => {
		let cancelled = false;

		async function loadConnections() {
			try {
				const slackKey =
					process.env.NEXT_PUBLIC_NANGO_SLACK_PROVIDER_CONFIG_KEY || "slack";
				const gaKey =
					process.env.NEXT_PUBLIC_NANGO_GOOGLE_ANALYTICS_PROVIDER_CONFIG_KEY ||
					"google-analytics";
				const metaKey =
					process.env.NEXT_PUBLIC_NANGO_META_PROVIDER_CONFIG_KEY ||
					"meta-marketing-api";
				const shopifyKey =
					process.env.NEXT_PUBLIC_NANGO_SHOPIFY_PROVIDER_CONFIG_KEY || "shopify";
				const stripeKey =
				process.env.NEXT_PUBLIC_NANGO_STRIPE_PROVIDER_CONFIG_KEY || "stripe-api-key";
				
				const res = await fetch("/api/nango/connection-status", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						endUserId,
						providerConfigKeys: [slackKey, gaKey, shopifyKey, stripeKey, metaKey],
					}),
				});

				const data = await res.json();

				if (cancelled || !Array.isArray(data?.results)) return;

				const getStatus = (providerConfigKey: string): ConnectorStatus => {
				const result = data.results.find(
				(item: { providerConfigKey: string; status?: ConnectorStatus }) =>
				item.providerConfigKey === providerConfigKey,
				);

				return result?.status ?? "disconnected";
				};

			setConnections({
				slack: getStatus(slackKey),
				googleAnalytics: getStatus(gaKey),
				shopify: getStatus(shopifyKey),
				stripe: getStatus(stripeKey),
				metaAds: getStatus(metaKey),
			});
			} catch (error) {
				console.error("SIDEBAR_CONNECTION_STATUS_FAILED", error);
				
			}
		}

		if (endUserId) {
			loadConnections();
		}

		return () => {
			cancelled = true;
		};
	}, [endUserId]);


	const [activeApp, setActiveApp] = useState<AppId | null>(null);

	const connectors = useMemo<ConnectorItem[]>(() => {
	return [
		{
			id: "google-analytics",
			label: "Google Analytics",
			status: connections.googleAnalytics,
		},
		{
			id: "shopify",
			label: "Shopify",
			status: connections.shopify,
		},
		{
			id: "stripe",
			label: "Stripe",
			status: connections.stripe,
		},
		{
			id: "slack",
			label: "Slack",
			status: connections.slack,
		},
		{
			id: "meta-ads",
			label: "Meta Ads",
			status: connections.metaAds,
		},
	];
}, [connections]);

	const connectedAppsCount = connectors.filter(
	(connector) => connector.status !== "disconnected",
	).length;

	const appLinks: NavItem[] = useMemo(
		() => [
			{ label: t.analytics, href: "/analytics", icon: <AnalyticsIcon /> },
			{ label: t.siteHealth, href: "/site-health", icon: <ShieldIcon /> },
		],
		[t],
	);

	const settingsLinks: NavItem[] = useMemo(
		() => [
			{
				label: t.integrations,
				href: "/settings/integrations",
				icon: <KeyIcon />,
			},
		],
		[t],
	);

	const companies = useMemo(
  () => [{ name: "Home", href: "/dashboard?company=a" }],
  [],
	);

const hasMultipleCompanies = companies.length > 1;

	const [_activeCompany, setActiveCompany] = useState(companies[0]);

	const toggleCompany = () => {
		setCompanyOpen((v) => {
			const next = !v;
			if (next) {
				setAppsOpen(false);
				setSettingsOpen(false);
			}
			return next;
		});
	};

		const [isRefreshing, setIsRefreshing] = useState(false);

const handleRefresh = async () => {
	if (isRefreshing) return;

	try {
		setIsRefreshing(true);

		const from =
			searchParams.get("from") ??
			new Date().toISOString().slice(0, 10);

		const to =
			searchParams.get("to") ??
			new Date().toISOString().slice(0, 10);

		const res = await fetch("/api/dashboard/refresh", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				from,
				to,
				endUserId,
			}),
		});

		const text = await res.text();
		const data = text ? JSON.parse(text) : null;

		if (!res.ok) {
			throw new Error(data?.error || "Refresh failed");
		}

		console.log("Dashboard refreshed:", data);
	} catch (error) {
		console.error("Refresh failed:", error);
	} finally {
		setIsRefreshing(false);
	}
};

	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!mobileOpen) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [mobileOpen]);

	return (
		<>
			<button
				type="button"
				onClick={() => setMobileOpen(true)}
				aria-label="Open navigation"
				aria-controls="app-sidebar"
				aria-expanded={mobileOpen}
				className="fixed left-3 top-3 z-[90] inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/50 bg-white/90 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white md:hidden"
			>
				<Menu size={20} />
			</button>

			{mobileOpen && (
				<button
					type="button"
					aria-label="Close navigation"
					onClick={() => setMobileOpen(false)}
					className="fixed inset-0 z-[95] bg-slate-950/30 backdrop-blur-[2px] md:hidden"
				/>
			)}

			<aside
				id="app-sidebar"
				className={cn(
					"fixed inset-y-0 left-0 z-[100] h-dvh w-[min(18rem,calc(100vw-3rem))] border-r border-white/40 bg-white/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition-transform duration-200 ease-out",
					"md:static md:z-50 md:h-full md:w-72 md:translate-x-0 md:bg-white/80 md:shadow-[0_2px_4px_rgba(0,0,0,0.08)]",
					mobileOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
			<div className="relative flex h-dvh flex-col px-6 pb-3 pt-5 md:h-screen">
				<button
					type="button"
					onClick={() => setMobileOpen(false)}
					aria-label="Close navigation"
					className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 md:hidden"
				>
					<X size={20} />
				</button>
				<div className="mb-6 flex h-20 items-center justify-center">
					<img
						src="/brand/ser3bellum-logo-final.svg"
						alt="Ser3bellum"
						aria-label="Ser3bellum"
						className="max-h-14 w-auto object-contain"
					/>
				</div>

				<button
					type="button"
					onClick={toggleCompany}
					className={cn(
						"mb-2 mt-4 flex w-full items-center justify-between rounded-lg px-3 py-2.5",
						"bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-100",
						"border border-indigo-300/40",
						"transition-all duration-200",
						"hover:border-indigo-400/50",
						"hover:shadow-md hover:shadow-indigo-200/40",
					)}
				>
					<span className="inline-flex items-center gap-3">
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.25)]">
							<GridIcon />
						</span>
						<span className="text-sm font-semibold text-slate-700">
							{companyName}
						</span>
					</span>

					<span className="ml-auto text-slate-700 opacity-70">
						<ChevronIcon
							className={cn(
								"opacity-80 transition-transform duration-200",
								companyOpen && "rotate-180",
							)}
						/>
					</span>
				</button>

				<div
					className={cn(
						"mb-3 grid transition-[grid-template-rows,opacity] duration-200 ease-out",
						companyOpen
							? "grid-rows-[1fr] opacity-100"
							: "grid-rows-[0fr] opacity-0 pointer-events-none",
					)}
				>
					<div className="overflow-hidden">
						<div className="mt-2 flex flex-col gap-1">
							{companies
								.filter((c) => c.name !== companyName)
								.map((c) => (
									<Link
										key={c.name}
										href={c.href}
										onClick={() => {
											setActiveCompany(c);
											setCompanyOpen(false);
										}}
										className={cn(
											"relative w-full rounded-lg px-3 py-2 text-sm transition-colors",
											"text-slate-600 hover:bg-slate-100/60",
										)}
									>
										<span className="pl-3">{c.name}</span>
									</Link>
								))}
						</div>
					</div>
				</div>

				<Link
					href="/user-settings"
					aria-label={t.openProfileSettings}
					className={cn(
						"group mb-5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
						"border border-white/25 bg-white/10 backdrop-blur-xl ring-1 ring-white/10 shadow-sm transition-colors",
						"hover:bg-white/22 hover:border-white/45 hover:shadow-md",
						"focus:outline-none focus:ring-2 focus:ring-blue-500/30",
					)}
				>
					<div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-zinc-200">
						{avatarUrl ? (
							<img
								src={avatarUrl}
								alt=""
								className="h-full w-full object-cover"
								referrerPolicy="no-referrer"
							/>
						) : (
							<span className="text-xs font-semibold text-slate-600">
								{(userEmail?.[0] ?? "U").toUpperCase()}
							</span>
						)}

						<span className="pointer-events-none absolute inset-0 grid place-items-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100">
							{t.edit}
						</span>
					</div>

					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold text-slate-800">
							{userName || t.userFallback}
						</div>

						<div className="flex items-center gap-2">
							<span className="text-xs text-slate-400 opacity-0 transition group-hover:opacity-100">
								• {t.editProfile}
							</span>
						</div>
					</div>

					<span className="ml-auto text-slate-400 opacity-0 transition group-hover:opacity-100">
						<ChevronIcon />
					</span>
				</Link>

				<div className="mt-3 flex min-h-0 flex-1 flex-col gap-1 px-1">
					<DropdownHeader
						label={t.apps}
						open={appsOpen}
						badge={`${connectedAppsCount}/${connectors.length}`}
						onToggle={() => {
							setAppsOpen((v) => {
								const next = !v;
								if (next) setSettingsOpen(false);
								if (next) setCompanyOpen(false);
								return next;
							});
						}}
						icon={<AppsIcon />}
					/>

					<div
						className={cn(
							"grid transition-[grid-template-rows,opacity] duration-200 ease-out",
							appsOpen
								? "grid-rows-[1fr] opacity-100"
								: "grid-rows-[0fr] opacity-0 pointer-events-none",
						)}
					>
						<div className="overflow-hidden">
							<div className="mt-2 mb-2 max-h-48 overflow-y-auto pr-1">
	<div className="flex flex-col gap-1">
		{connectors.map((connector) => (
			<button
				type="button"
				key={connector.id}
				onClick={() => setActiveApp(connector.id)}
				className={cn(
					"relative flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
					"text-slate-500 hover:bg-slate-100/60",
					activeApp === connector.id && "text-slate-700",
				)}
			>
				{activeApp === connector.id && (
					<span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-blue-500" />
				)}

				<ConnectorDot status={connector.status} />

				<span className="truncate pl-1">{connector.label}</span>
			</button>
		))}
	</div>
</div>
					</div>
</div>
					<ActionRow
	label={isRefreshing ? "Actualisation..." : t.refreshData}
	icon={
		<RefreshIcon
			className={isRefreshing ? "animate-spin" : ""}
		/>
	}
	onClick={handleRefresh}
	disabled={isRefreshing}
/>
					<nav className="mt-2 flex flex-col gap-2">
						{appLinks.map((item) => (
							<NavRow
								key={item.href}
								item={item}
								active={pathname === item.href}
							/>
						))}
					</nav>

					<div className="pt-2">
						<DropdownHeader
							label={t.settings}
							open={settingsOpen}
							onToggle={() => {
								setSettingsOpen((v) => {
									const next = !v;
									if (next) setAppsOpen(false);
									if (next) setCompanyOpen(false);
									return next;
								});
							}}
							icon={<SettingsIcon />}
						/>

						<div
							className={cn(
								"grid transition-[grid-template-rows,opacity] duration-200 ease-out",
								settingsOpen
									? "grid-rows-[1fr] opacity-100"
									: "grid-rows-[0fr] opacity-0 pointer-events-none",
							)}
						>
							<div className="overflow-hidden">
								<div className="mt-3">
									<nav className="flex flex-col gap-1">
										{settingsLinks.map((item) => (
											<NavRow
												key={item.href}
												item={item}
												active={pathname === item.href}
											/>
										))}
									</nav>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mt-auto pt-4">
					<button
						type="button"
						onClick={() => setIsCustomizeOpen(true)}
						className={cn(
							"flex h-14 w-full items-center justify-center gap-2 rounded-xl px-3",
							"bg-gradient-to-br from-blue-600/80 via-blue-600/90 to-indigo-600/70 backdrop-blur-xl",
							"border border-white/20 text-white",
							"transition-all duration-200",
							"hover:bg-blue-600/90 hover:shadow-md hover:shadow-blue-700/20",
							"active:translate-y-[1px]",
							"focus:outline-none focus:ring-2 focus:ring-blue-400/30",
						)}
					>
						<GridIcon />
						<span className="text-sm">{t.customizeDashboard}</span>
					</button>

					<div className="mt-2 md:hidden">
						<LogoutButton
							label={dictionary.navigation.logout}
							loadingLabel={dictionary.navigation.loggingOut}
						/>
					</div>
				</div>

				<CustomizeDashboardModal
					open={isCustomizeOpen}
					onClose={() => setIsCustomizeOpen(false)}
					cards={DASHBOARD_CARDS}
				/>
			</div>
			</aside>
		</>
	);
}

	function DropdownHeader({
	label,
	open,
	onToggle,
	icon,
	badge,
	}: {
	label: string;
	open: boolean;
	onToggle: () => void;
	icon: ReactNode;
	badge?: string;
	}) {
	return (
		<button
			type="button"
			onClick={onToggle}
			className={cn(glassBase, glassHover, open && glassActive)}
		>
			<span className="inline-flex items-center gap-2 text-sm text-slate-600">
				<span
					className={cn(
						"inline-flex h-8 w-8 items-center justify-center rounded-lg",
						"bg-white/10 border border-white/20",
						open && "border-blue-400/40 text-blue-700",
					)}
				>
					{icon}
				</span>
				{label}
			</span>
				{badge ? (
		<span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
		{badge}
	</span>
	) : null}

	<ChevronIcon
	className={cn(
		"opacity-80 transition-transform duration-200",
		open && "rotate-180",
	)}
	/>	

		</button>
	);
}

function RowShell({
	active,
	children,
	className,
}: {
	active?: boolean;
	children: ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("relative", className)}>
			{active && (
				<span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-blue-600" />
			)}
			{children}
		</div>
	);
}

function ActionRow({
	label,
	icon,
	onClick,
	disabled = false,
}: {
	label: string;
	icon: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={[
				"flex w-full items-center gap-3 rounded-xl bg-white px-5 py-4 text-left text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-100 transition",
				"hover:bg-slate-50 hover:text-slate-900",
				disabled && "cursor-not-allowed opacity-60",
			]
				.filter(Boolean)
				.join(" ")}
		>
			<span className="flex h-5 w-5 items-center justify-center text-slate-500">
				{icon}
			</span>

			<span>{label}</span>
		</button>
	);
}

function NavRow({ item, active }: { item: NavItem; active: boolean }) {
	return (
		<RowShell active={active}>
			<Link
				href={item.href}
				className={cn(
					glassBase,
					glassHover,
					active && glassActive,
					active ? "text-zinc-900" : "text-zinc-700/90",
				)}
			>
				<span
					className={cn(
						"inline-flex h-8 w-8 items-center justify-center rounded-lg",
						"bg-white/10 border border-white/20",
						active && "border-blue-400/40 text-blue-700",
					)}
				>
					{item.icon}
				</span>

				<span className="text-sm text-slate-600">{item.label}</span>
			</Link>
		</RowShell>
	);
}

function ChevronIcon({ className }: { className?: string }) {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M6 9l6 6 6-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function GridIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z"
				stroke="currentColor"
				strokeWidth="2"
			/>
		</svg>
	);
}

function AppsIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
			<path
				d="M7 3v2M17 3v2M4 8h16M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}



export function SettingsIcon({ className = "" }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			width="18"
			height="18"
			fill="none"
			className={className}
			aria-hidden="true"
		>
			<path
				d="M4 21v-7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M4 10V3"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M12 21v-9"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M12 8V3"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M20 21v-5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M20 12V3"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M2 14h4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M10 12h4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M18 16h4"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function RefreshIcon({ className = "" }: { className?: string }) {
	return (
		<svg
			className={className}
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M21 12a9 9 0 1 1-2.64-6.36"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M21 3v6h-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function AnalyticsIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M5 12v7M12 5v14M19 9v10"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ShieldIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function _LinkIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M10 13a5 5 0 007 0l2-2a5 5 0 00-7-7l-1 1"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M14 11a5 5 0 01-7 0l-2 2a5 5 0 007 7l1-1"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function KeyIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M21 10l-6 6h-3v3H9v3H6v-3.5l7.2-7.2A5 5 0 1121 10z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<path
				d="M16.5 8.5h.01"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}
function ConnectorDot({ status }: { status: ConnectorStatus }) {
	if (status === "active") {
		return (
			<span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12)]" />
		);
	}

	if (status === "awaiting-data") {
		return (
			<span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-transparent" />
		);
	}

	if (status === "failed") {
		return (
			<span className="h-2.5 w-2.5 rounded-full bg-orange-400 shadow-[0_0_0_3px_rgba(251,146,60,0.14)]" />
		);
	}

	return <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-white" />;
}
