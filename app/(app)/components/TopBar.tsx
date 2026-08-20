"use client";

import { LogoutButton } from "app/(app)/components/LogoutButton";
import { BaseModal } from "app/(app)/components/ui/Modal";
import { auth } from "@/lib/firebase/clients";
import { cn } from "app/(app)/lib/cn";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DayPicker, type DateRange as DayPickerRange } from "react-day-picker";
import { Home } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/getDictionary";

type UiDateRange = {
	from: Date;
	to: Date;
	label: string;
};

type TopBarProps = {
	companyName?: string;
	workspaceId?: string | null;
	rightSlot?: ReactNode;
	dictionary: Dictionary;
};


function toISODate(d: Date) {
	// YYYY-MM-DD
	return d.toISOString().slice(0, 10);
}

function startOfToday() {
	const d = new Date();
	d.setHours(0, 0, 0, 0);
	return d;
}

function addDays(base: Date, delta: number) {
	const d = new Date(base);
	d.setDate(d.getDate() + delta);
	return d;
}

function preset(label: string, daysBackInclusive: number): UiDateRange {
	const to = startOfToday();
	const from = addDays(to, -daysBackInclusive);
	return { from, to, label };
}

function formatShort(d: Date) {
	return new Intl.DateTimeFormat("en-GB", {
		month: "short",
		day: "2-digit",
		year: "numeric",
	}).format(d);
}

function formatRangeLabel(r: DayPickerRange | undefined) {
	if (r?.from && r?.to) return `${formatShort(r.from)} – ${formatShort(r.to)}`;
	if (r?.from) return `${formatShort(r.from)} – …`;
	return "Select dates";
}
function DashboardHomeLink({
	companyId,
	companyName,
	from,
	to,
}: {
	companyId?: string | null;
	companyName?: string | null;
	from?: string | null;
	to?: string | null;
}) {
	const params = new URLSearchParams();

	if (companyId) params.set("company", companyId);
	if (from) params.set("from", from);
	if (to) params.set("to", to);

	const href = `/dashboard${params.toString() ? `?${params.toString()}` : ""}`;
	const hasCompanyName = !!companyName?.trim();

	return (
		<Link
			href={href}
			title="Return to dashboard"
			className="inline-flex max-w-[260px] items-center gap-2.5 rounded-lg px-2 py-1 text-2xl font-semibold tracking-tight text-slate-900 transition hover:bg-slate-100 hover:text-blue-600"
		>
			<Home size={22} className="shrink-0 text-slate-500" />
			{hasCompanyName && <span className="truncate">{companyName}</span>}
		</Link>
	);
}
	export function TopBar({ companyName, workspaceId, rightSlot, dictionary }: TopBarProps) {
		 const t = dictionary.topbar;
		const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const presets = useMemo(
		() => [
			preset(t.today, 0),
			preset(t.last7Days, 6),
			preset(t.last30Days, 29),
			preset(t.last60Days, 59),
			preset(t.last90Days, 89),
		],
		[],
	);

	// Initialize from URL if present, else default to Last 7 days
	const initialRange = useMemo<UiDateRange>(() => {
		const from = searchParams.get("from");
		const to = searchParams.get("to");

		if (from && to) {
			const fromDate = new Date(from);
			const toDate = new Date(to);

			if (
				!Number.isNaN(fromDate.getTime()) &&
				!Number.isNaN(toDate.getTime())
			) {
				const matched =
					presets.find(
						(p) => toISODate(p.from) === from && toISODate(p.to) === to,
					) ?? null;

				return {
					from: fromDate,
					to: toDate,
					label: matched?.label ?? "Custom range",
				};
			}
		}

		return presets[1]; // Last 7 days
	}, [searchParams, presets]);

	const [open, setOpen] = useState(false);

	const [summaryNotification, setSummaryNotification] =
	useState<NotificationItem | null>(null);

	const [notificationsSeen, setNotificationsSeen] = useState(false);

	// single source of truth for URL sync + preset matching
	const [range, setRange] = useState<UiDateRange>(initialRange);

	// selection state for DayPicker (can be undefined / partial)
	const [selection, setSelection] = useState<DayPickerRange | undefined>({
		from: initialRange.from,
		to: initialRange.to,
	});

	const popoverRef = useRef<HTMLDivElement | null>(null);

	// Apply a UiDateRange to both states (preset or committed custom)
	const applyRange = (next: UiDateRange) => {
		setRange(next);
		setSelection({ from: next.from, to: next.to });
	};

	const todayPreset = presets[0];

	const resetToToday = () => {
		applyRange(todayPreset);
		setOpen(false);
	};

	const closeWithoutCommit = () => {
		// Revert any in-progress selection to the committed range
		setSelection({ from: range.from, to: range.to });
		setOpen(false);
	};

	const commitSelection = () => {
		if (!selection?.from || !selection?.to) return;

		const from = new Date(selection.from);
		const to = new Date(selection.to);
		from.setHours(0, 0, 0, 0);
		to.setHours(0, 0, 0, 0);

		const matched =
			presets.find(
				(p) =>
					toISODate(p.from) === toISODate(from) &&
					toISODate(p.to) === toISODate(to),
			) ?? null;

		setRange({ from, to, label: matched?.label ?? "Custom range" });
		setOpen(false);
	};
	const [mailOpen, setMailOpen] = useState(false);
	const [notifOpen, setNotifOpen] = useState(false);
	const [messages, setMessages] = useState<MailMessage[]>([]);
	const [messagesLoading, setMessagesLoading] = useState(false);

	useEffect(() => {
  let cancelled = false;

  async function loadSlackMessages() {
    try {
      const endUserId = auth.currentUser?.uid;

      if (!endUserId) {
        if (!cancelled) {
          setMessages([]);
          setMessagesLoading(false);
        }
        return;
      }

      setMessagesLoading(true);

      const res = await fetch("/api/messages/slack", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endUserId,
        }),
      });

      const data = await res.json();

      console.log("SLACK_MESSAGES_API_RESPONSE", data);

      if (!cancelled) {
        setMessages(Array.isArray(data.messages) ? data.messages : []);
      }
    } catch (error) {
      console.error("SLACK_MESSAGES_FETCH_FAILED", error);
      if (!cancelled) {
        setMessages([]);
      }
    } finally {
      if (!cancelled) {
        setMessagesLoading(false);
      }
    }
 	 }

 	 loadSlackMessages();

  return () => {
    cancelled = true;
  };
}, []);

	useEffect(() => {
  let cancelled = false;

  async function loadSummaryNotification() {
    if (!workspaceId) return;

    try {
      const res = await fetch(
        `/api/dashboard/latest-summary?workspaceId=${encodeURIComponent(
          workspaceId,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || "Failed to load latest summary",
        );
      }

      if (!cancelled && data.report) {
        setSummaryNotification({
          id: data.report.reportId,
          kind: "summary",
          title: data.report.headline,
          description:
            data.report.bullets?.[0] ??
            "Your daily operational summary is ready to review.",
          timeLabel: "Today",
          unread: true,
        });
      }
    } catch (error) {
      if (!cancelled) {
        console.error("SUMMARY_NOTIFICATION_FETCH_FAILED", error);
      }
    }
  }

  void loadSummaryNotification();

  return () => {
    cancelled = true;
  };
}, [workspaceId]);

	const notifications: NotificationItem[] = [
	...(summaryNotification ? [summaryNotification] : []),
	
	{
		id: "notif-2",
		kind: "analytics",
		title: "Traffic spike detected",
		description: "Google Analytics • Sessions increased by 18%.",
		timeLabel: "20 min ago",
		unread: true,
	},
	{
		id: "notif-3",
		kind: "alert",
		title: "Downtime detected",
		description: "Your website was unreachable for 3 minutes.",
		timeLabel: "2h ago",
		unread: false,
	},
	{
		id: "notif-4",
		kind: "system",
		title: "CPU usage high",
		description: "Server load stayed above 80% for 15 minutes.",
		timeLabel: "Yesterday",
		unread: false,
	},
];

const mailCount = messages.filter((item) => item.unread).length;
	const notifCount = notificationsSeen
	? 0
	: notifications.filter((item) => item.unread).length;

	// Sync URL when range changes
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("from", toISODate(range.from));
		params.set("to", toISODate(range.to));
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [range, pathname, router, searchParams.toString]);

	// ✅ Close on ESC only (outside click is handled by the backdrop)
	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};

		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open]);

	// Button label: show preset label unless custom, where we show actual dates
	const dateButtonLabel =
		range.label === "Custom range"
			? selection?.from && selection?.to
				? formatRangeLabel(selection)
				: "Custom range"
			: range.label;

	return (
		<>
			{/* ✅ Backdrop OUTSIDE the header so it can't interfere with popover clicks */}
			{open && (
				<div
					aria-hidden
					className="fixed inset-x-0 bottom-0 top-14 z-40 bg-white/10 backdrop-blur-md backdrop-saturate-150"
					onPointerDown={closeWithoutCommit}
				/>
			)}

			<header className="sb-topbar sticky top-0 z-50 w-full border-b border-white/40 bg-white/60 backdrop-blur">
				<div className="mx-auto flex h-[72px] w-full items-center gap-3 px-4">
					
					{/* Left: Company (clickable → dashboard) */}

					<div className="min-w-[180px]">
					<DashboardHomeLink
						companyId={searchParams.get("company")}
						companyName={companyName}
						from={searchParams.get("from")}
						to={searchParams.get("to")}
						/>
					</div>

					{/* Middle: Search */}
					<div className="flex flex-1 items-center">
						<div className="relative w-full max-w-md">
							<span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
								<SearchIcon />
							</span>
							<input
								type="search"
								placeholder={t.searchPlaceholder}
								className="h-10 w-full rounded-lg border border-white/50 px-10 text-sm outline-none shadow-[0_2px_4px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-black/10"
							/>
						</div>
					</div>

					{/* Right: Date + icons */}
					<div className="relative flex items-center gap-2" ref={popoverRef}>
						<button
							type="button"
							onClick={() => setOpen((v) => !v)}
							className="hidden h-10 items-center gap-2 rounded-lg border border-white/50 bg-white/70 px-3 text-sm text-zinc-500 shadow-[0_2px_4px_rgba(0,0,0,0.08)]
                hover:bg-white/90 transition-colors md:inline-flex"
						>
							<CalendarIcon />
							<span className="whitespace-nowrap">{dateButtonLabel}</span>
							<ChevronDownIcon
								className={cn(
									"transition-transform duration-200",
									open && "rotate-180",
								)}
							/>
						</button>

						{open && (
							<div
								data-date-popover
								onPointerDown={(e) => e.stopPropagation()}
								className="absolute right-0 top-12 z-[150] hidden md:block rounded-2xl border border-zinc-200/60
              bg-gradient-to-b from-white/95 via-white/90 to-white/95 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.2)] w-[760px] p-2"
							>
								<div className="flex justify-center">
									<button
										type="button"
										aria-label="Close"
										onClick={resetToToday}
										className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg
               border border-black/10 bg-white/70 text-zinc-700 shadow-sm hover:bg-white"
									>
										✕
									</button>

									<div className="flex-row items-start gap-4">
										{/* Presets (no bg) */}
										<div className="mt-2 mb-2 flex w-50 shrink-0">
											{presets.map((p) => (
												<button
													key={p.label}
													type="button"
													onClick={() => {
														applyRange(p);
														setOpen(false);
													}}
													className={cn(
														"w-full rounded-lg px-3 py-2 text-center text-md transition-colors",
														"hover:bg-black/5",
														range.label === p.label
															? "text-zinc-900"
															: "text-zinc-700",
													)}
												>
													{p.label}
												</button>
											))}

											<div className="my-1 h-px bg-black/10" />
											{/* custom range button, you can reintroduce the button later the logic is already there, 
                      <button
                        type="button"
                        onClick={() => {
                          setRange((r) => ({ ...r, label: "Custom range" }));
                          setSelection(undefined);
                        }}
                        className={cn(
                          "w-full rounded-lg px-3 py-2 text-left text-md transition-colors",
                          "hover:bg-black/5",
                          range.label === "Custom range" ? "text-zinc-900" : "text-zinc-700"
                        )}
                      >
                        Custom range…
                      </button>
                      */}

											{range.label === "Custom range" && (
												<div className="px-3 pb-2 pt-1 text-xs text-zinc-600">
													{formatRangeLabel(selection)}
												</div>
											)}
										</div>

										{/* Divider */}
										<div className="h-px w-full bg-zinc-200/80" />

										{/* Calendar */}
										<div className="rdp-glass">
											<DayPicker
												mode="range"
												numberOfMonths={2}
												selected={selection}
												defaultMonth={selection?.from ?? new Date()}
												weekStartsOn={1}
												fixedWeeks
												onSelect={(next) => {
													setSelection(next);

													// ✅ Only close once both dates exist
													if (next?.from && next?.to) {
														const from = new Date(next.from);
														const to = new Date(next.to);
														from.setHours(0, 0, 0, 0);
														to.setHours(0, 0, 0, 0);

														const matched =
															presets.find(
																(p) =>
																	toISODate(p.from) === toISODate(from) &&
																	toISODate(p.to) === toISODate(to),
															) ?? null;

														setRange({
															from,
															to,
															label: matched?.label ?? "Custom range",
														});
														setOpen(false);
													}
												}}
											/>
										</div>

										{/* done Button */}
										<div className="mt-2 flex items-center justify-end gap-2 px-1 pb-1">
											<button
												type="button"
												onClick={commitSelection}
												disabled={!selection?.from || !selection?.to}
												className={cn(
													"h-9 rounded-lg border border-black/10 px-3 text-sm",
													!selection?.from || !selection?.to
														? "bg-white/40 text-zinc-400 cursor-not-allowed"
														: "bg-white/70 text-zinc-700 hover:bg-white",
												)}
											>
												{t.done}
											</button>
										</div>
									</div>
								</div>
							</div>
						)}

						<IconButton
							label={t.messages}
							count={mailCount}
							showCheck
							onClick={() => setMailOpen(true)}
							className="no-print"
						>
							<MailIcon />
						</IconButton>

						<IconButton
						label={t.notifications}
						count={notifCount}
						showCheck
						onClick={() => {
						setNotificationsSeen(true);
						setNotifOpen(true);
							}}
						>
						<BellIcon />
						</IconButton>

						<IconButton
							label={t.printReport}
							onClick={() => window.print()}
							className="no-print"
						>
							<PrinterIcon />
						</IconButton>

						<Link
							href="/help"
  							aria-label={t.help}
  							className="relative inline-flex h-10 w-10 items-center justify-center leading-none text-zinc-500 rounded-lg border border-white/50 bg-white/70 shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-black/10"
							>
 						 	<span className="block h-5 w-5">
    						<HelpIcon />
  							</span>
						</Link>

						{/* Avatar */}
						<div className="mt-auto p-3">
							<LogoutButton
  							label={dictionary.navigation.logout}
  							loadingLabel={dictionary.navigation.loggingOut}
							/>
						</div>

						{rightSlot}
					</div>
				</div>
			</header>
			{mailOpen && (
	<MailModal
		onClose={() => setMailOpen(false)}
		messages={messages}
		closeLabel={t.close}
		connections={{
			slack: true,
			gmail: false,
			outlook: false,
			imap: false,
		}}
	/>
)}
			{notifOpen && (
			<NotificationModal
			onClose={() => setNotifOpen(false)}
			notifications={notifications}
			closeLabel={t.close}
	/>
)}
			
		</>
		
	);
}

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	label: string;
	children: React.ReactNode;
	count?: number;
	showCheck?: boolean;
};

function IconButton({
	label,
	children,
	className,
	count = 0,
	showCheck = false,
	...props
}: IconButtonProps) {
	const showBadge = count > 0;
	const showCaughtUp = !showBadge && showCheck;

	return (
		<button
			type="button"
			aria-label={label}
			className={cn(
				// ⬇️ key change: relative + leading-none
				"relative inline-flex h-10 w-10 items-center justify-center leading-none text-zinc-500 rounded-lg border border-white/50 bg-white/70 shadow-[0_2px_4px_rgba(0,0,0,0.08)] transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-black/10",
				className,
			)}
			{...props}
		>
			{/* Keep icon centred + avoid inline baseline weirdness */}
			<span className="block h-5 w-5">{children}</span>

			{/* Red count badge (absolute overlay, not in flow) */}
			{showBadge && (
				<span
					aria-hidden
					className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] leading-[18px] text-center border border-white/80 shadow-sm"
				>
					{count > 99 ? "99+" : count}
				</span>
			)}

			{/* Green caught-up check (absolute overlay, not in flow) */}
			{showCaughtUp && (
				<span
					aria-hidden
					className="absolute -top-1 -right-1 h-[18px] w-[18px] rounded-full bg-emerald-500 text-white border border-white/80 shadow-sm grid place-items-center"
				>
					<CheckIcon className="h-3.5 w-3.5 block" />
				</span>
			)}
		</button>
	);
}

/* Tiny inline icons */

function SearchIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
			<path
				d="M21 21l-4.3-4.3m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function CalendarIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
			<path
				d="M7 3v2M17 3v2M4 8h16M6 6h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

function ChevronDownIcon({ className }: { className?: string }) {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 24 24"
			fill="none"
			className={className}
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

function BellIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
			<path
				d="M6 8a6 6 0 1112 0c0 7 3 7 3 7H3s3 0 3-7"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M10 19a2 2 0 004 0"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}
type IconProps = React.SVGProps<SVGSVGElement>;

function CheckIcon(props: IconProps) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			className="block"
			{...props}
		>
			<path
				d="M20 6L9 17l-5-5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function PrinterIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M7 8V3h10v5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M6 17H4a2 2 0 01-2-2v-4a2 2 0 012-2h16a2 2 0 012 2v4a2 2 0 01-2 2h-2"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M7 14h10v7H7v-7z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function HelpIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
			<path
				d="M9.5 9a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<circle cx="12" cy="17" r="1" fill="currentColor" />
		</svg>
	);
}
function MailIcon() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M4 6h16v12H4V6z"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinejoin="round"
			/>
			<path
				d="M4 7l8 6 8-6"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	);
}

type Provider = "slack" | "gmail" | "outlook" | "imap";

type MailMessage = {
  id: string;
  provider: Provider;
  sender: string;
  preview: string;
  timeLabel: string;
  unread?: boolean;
  
};
type NotificationItem = {
	id: string;
	kind: "summary" | "analytics" | "alert" | "system" | "integration";
	title: string;
	description: string;
	timeLabel: string;
	unread?: boolean;
};


function MailModal({
	onClose,
	messages,
	connections,
	closeLabel,
}: {
	onClose: () => void;
	messages: MailMessage[];
	connections: Record<Provider, boolean>;
	closeLabel: string;
}) {
	const [selectedProvider, setSelectedProvider] = useState<Provider>("slack");

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);

		console.log("messages passed to MailModal", messages);

		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const providerOrder: Provider[] = ["slack", "gmail", "outlook", "imap"];

	const providerLabel = (provider: Provider) => {
		switch (provider) {
			case "slack":
				return "Slack";
			case "gmail":
				return "Gmail";
			case "outlook":
				return "Outlook";
			case "imap":
				return "IMAP";
		}
	};

	const messageCountByProvider = providerOrder.reduce(
		(acc, provider) => {
			acc[provider] = messages.filter(
				(message) => message.provider === provider,
			).length;
			return acc;
		},
		{} as Record<Provider, number>,
	);

	const visibleMessages = messages.filter(
		(message) => message.provider === selectedProvider,
	);

	const selectedConnected = connections[selectedProvider];
	const slackConnected = connections.slack;

	return (
		<BaseModal
			title="Messages"
			onClose={onClose}
			size="lg"
			footer={
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
				>
					Close
				</button>
			}
		>
			<div className="space-y-4">
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-sm font-medium text-slate-900">
								Message sources
							</div>
							<div className="mt-1 text-sm text-slate-600">
								Slack is connected. Add another provider to expand your inbox.
							</div>
						</div>

						{slackConnected && (
							<span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
								Slack connected
							</span>
						)}
					</div>

					<div className="mt-3 flex flex-wrap gap-2">
						{providerOrder.map((provider) => {
							const count = messageCountByProvider[provider];
							const active = selectedProvider === provider;
							const connected = connections[provider];

							return (
								<button
									key={provider}
									type="button"
									onClick={() => setSelectedProvider(provider)}
									className={cn(
										"inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
										active && connected
											? "border-emerald-200 bg-emerald-50 text-emerald-700"
											: active
												? "border-slate-300 bg-slate-100 text-slate-900"
												: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
									)}
								>
									<span>{providerLabel(provider)}</span>

									{count > 0 && (
										<span
											className={cn(
												"inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[11px] font-medium leading-5",
												active && connected
													? "bg-emerald-100 text-emerald-700"
													: "bg-slate-100 text-slate-700",
											)}
										>
											{count}
										</span>
									)}
								</button>
							);
						})}
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex items-center justify-between gap-3">
						<div className="text-sm font-medium text-slate-900">
							Recent messages
						</div>
						<div className="text-xs text-slate-500">
							{selectedConnected
								? `Showing ${providerLabel(selectedProvider)} activity`
								: "No provider connected"}
						</div>
					</div>

					{selectedConnected ? (
						visibleMessages.length > 0 ? (
							<ul className="mt-2 space-y-2 text-sm">
								{visibleMessages.map((message) => (
									<li
										key={message.id}
										className={cn(
											"rounded-lg border bg-white p-3",
											message.unread ? "border-blue-200" : "border-slate-200",
										)}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<div className="font-medium text-slate-900">
														{message.sender}
													</div>
													{message.unread && (
														<span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
													)}
												</div>
												<div className="mt-1 text-slate-600">
													{message.preview}
												</div>
											</div>

											<div className="shrink-0 text-xs text-slate-500">
												{message.timeLabel}
											</div>
										</div>
									</li>
								))}
							</ul>
						) : (
							<div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
								No messages yet for {providerLabel(selectedProvider)}.
							</div>
						)
					) : (
						<div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
							{providerLabel(selectedProvider)} is not connected yet.
						</div>
					)}
				</div>
			</div>
		</BaseModal>
	);
}
function NotificationModal({
	onClose,
	notifications,
	closeLabel,
}: {
	onClose: () => void;
	notifications: NotificationItem[];
	closeLabel: string;
}) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<BaseModal
			title="Notifications"
			subtitle="Recent alerts, summaries, and product insights from Ser3bellum."
			onClose={onClose}
			size="lg"
			footer={
				<button
					type="button"
					onClick={onClose}
					className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
				>
					{closeLabel}
				</button>
			}
		>
			<div className="space-y-4">
				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex items-center justify-between gap-3">
						<div>
							<div className="text-sm font-medium text-slate-900">
								Activity feed
							</div>
							<div className="mt-1 text-sm text-slate-600">
								Track alerts, analytics changes, and generated summaries in one place.
							</div>
						</div>

						<span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
							{notifications.filter((item) => item.unread).length} unread
						</span>
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex items-center justify-between gap-3">
						<div className="text-sm font-medium text-slate-900">
							Recent notifications
						</div>
						<div className="text-xs text-slate-500">
							Latest product activity
						</div>
					</div>

					{notifications.length > 0 ? (
						<ul className="mt-2 space-y-2 text-sm">
							{notifications.map((item) => (
								<li
									key={item.id}
									className={cn(
										"rounded-lg border bg-white p-3",
										item.unread ? "border-blue-200" : "border-slate-200",
									)}
								>
									<div className="flex items-start justify-between gap-3">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<span
													className={cn(
														"inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
														item.kind === "summary" &&
															"bg-violet-50 text-violet-700",
														item.kind === "analytics" &&
															"bg-sky-50 text-sky-700",
														item.kind === "alert" &&
															"bg-rose-50 text-rose-700",
														item.kind === "system" &&
															"bg-amber-50 text-amber-700",
														item.kind === "integration" &&
															"bg-emerald-50 text-emerald-700",
													)}
												>
													{item.kind}
												</span>

												<div className="font-medium text-slate-900">
													{item.title}
												</div>

												{item.unread && (
													<span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
												)}
											</div>

											<div className="mt-1 text-slate-600">
												{item.description}
											</div>
										</div>

										<div className="shrink-0 text-xs text-slate-500">
											{item.timeLabel}
										</div>
									</div>
								</li>
							))}
						</ul>
					) : (
						<div className="mt-2 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
							No notifications yet. Ser3bellum alerts and summaries will appear here.
						</div>
					)}
				</div>
			</div>
		</BaseModal>
	);
}
