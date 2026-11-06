"use client";

import { useEffect, useState } from "react";
import { BaseModal } from "./ui/Modal";
import { cn } from "../lib/cn";

type Provider = "slack" | "gmail" | "outlook" | "imap";

export type MailMessage = {
	id: string;
	provider: Provider;
	sender?: string;
	title?: string;
	preview: string;
	timeLabel: string;
	unread?: boolean;
};

type MailModalProps = {
	onClose: () => void;
	messages: MailMessage[];
	connections: Record<Provider, boolean>;
	closeLabel: string;
	loading?: boolean;
};

const providers: Provider[] = ["slack", "gmail", "outlook", "imap"];

const providerLabels: Record<Provider, string> = {
	slack: "Slack",
	gmail: "Gmail",
	outlook: "Outlook",
	imap: "IMAP",
};

export function MailModal({
	onClose,
	messages,
	connections,
	closeLabel,
	loading = false,
}: MailModalProps) {
	const [selectedProvider, setSelectedProvider] =
		useState<Provider>("slack");

	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	const visibleMessages = messages.filter(
		(message) => message.provider === selectedProvider,
	);

	const selectedConnected = connections[selectedProvider];

	return (
		<BaseModal
			title="Messages"
			onClose={onClose}
			size="lg"
			bodyClassName="flex flex-col overflow-hidden"
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
			<div className="flex min-h-0 flex-col gap-4">
				<div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<div className="text-sm font-medium text-slate-900">
								Message sources
							</div>
							<div className="mt-1 text-sm text-slate-600">
								{connections.slack
									? "Slack is connected. Add another provider to expand your inbox."
									: "Connect a provider to see your messages."}
							</div>
						</div>

						{connections.slack && (
							<span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
								Slack connected
							</span>
						)}
					</div>

					<div className="mt-3 flex flex-wrap gap-2">
						{providers.map((provider) => {
							const count = messages.filter(
								(message) => message.provider === provider,
							).length;
							const active = selectedProvider === provider;
							const connected = connections[provider];

							return (
								<button
									key={provider}
									type="button"
									onClick={() => setSelectedProvider(provider)}
									aria-pressed={active}
									className={cn(
										"inline-flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
										active && connected
											? "border-emerald-200 bg-emerald-50 text-emerald-700"
											: active
												? "border-slate-300 bg-slate-100 text-slate-900"
												: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
									)}
								>
									<span>{providerLabels[provider]}</span>

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

				<section className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-4">
					<div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
						<h3 className="text-sm font-medium text-slate-900">
							Recent messages
						</h3>
						<div className="text-xs text-slate-500">
							{selectedConnected
								? `Showing ${providerLabels[selectedProvider]} activity`
								: "No provider connected"}
						</div>
					</div>

					<div
						key={selectedProvider}
						className="mt-2 min-h-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
						role="region"
						aria-label="Recent messages"
						aria-busy={selectedConnected && loading}
						tabIndex={0}
					>
						{!selectedConnected ? (
							<div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
								{providerLabels[selectedProvider]} is not connected yet.
							</div>
						) : loading ? (
							<div role="status" className="p-3 text-sm text-slate-600">
								Loading messages…
							</div>
						) : visibleMessages.length > 0 ? (
							<ul className="space-y-2 text-sm">
								{visibleMessages.map((message) => (
									<li
										key={message.id}
										className={cn(
											"rounded-lg border bg-white p-3",
											message.unread
												? "border-blue-200"
												: "border-slate-200",
										)}
									>
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<div className="flex items-center gap-2">
													<div className="break-words font-medium text-slate-900">
														{message.sender ?? message.title}
													</div>
													{message.unread && (
														<span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
													)}
												</div>

												<div className="mt-1 whitespace-pre-wrap break-words text-slate-600">
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
							<div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-600">
								No messages yet for {providerLabels[selectedProvider]}.
							</div>
						)}
					</div>
				</section>
			</div>
		</BaseModal>
	);
}