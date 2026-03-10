import { NextResponse } from "next/server";
import { Nango } from "@nangohq/node";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export const dynamic = "force-dynamic";

const nango = new Nango({
	secretKey: process.env.NANGO_SECRET_KEY || "",
	...(process.env.NANGO_HOST ? { host: process.env.NANGO_HOST } : {}),
});

const providerConfigKey =
	process.env.NANGO_SLACK_PROVIDER_CONFIG_KEY || "slack";

type SlackConversation = {
	id: string;
	name?: string;
	user?: string;
	is_im?: boolean;
	is_mpim?: boolean;
	is_private?: boolean;
	is_member?: boolean;
};

type SlackListResponse = {
	ok: boolean;
	channels?: SlackConversation[];
	error?: string;
};

type SlackHistoryMessage = {
	ts: string;
	text?: string;
	user?: string;
	subtype?: string;
};

type SlackHistoryResponse = {
	ok: boolean;
	messages?: SlackHistoryMessage[];
	error?: string;
};

type Provider = "slack" | "gmail" | "outlook" | "imap";

type MailMessage = {
	id: string;
	provider: Provider;
	title: string;
	preview: string;
	timeLabel: string;
	unread?: boolean;
};

function toRelativeTimeLabel(ts?: string) {
	if (!ts) return "now";

	const value = Number(ts.split(".")[0]);
	if (!Number.isFinite(value)) return "now";

	const diffMs = Date.now() - value * 1000;
	const diffMin = Math.max(0, Math.floor(diffMs / 60000));

	if (diffMin < 1) return "now";
	if (diffMin < 60) return `${diffMin} min ago`;

	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `${diffHours}h ago`;

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays === 1) return "yesterday";
	return `${diffDays}d ago`;
}

function conversationLabel(channel: SlackConversation) {
	if (channel.name) return `#${channel.name}`;
	if (channel.is_im) return "Direct message";
	if (channel.is_mpim) return "Group DM";
	if (channel.is_private) return "Private channel";
	return "Slack";
}

function cleanPreview(text?: string) {
	if (!text) return "";
	return text.replace(/<[^>]+>/g, "").trim();
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as { endUserId?: string };

		if (!body?.endUserId) {
			return NextResponse.json(
				{ error: "endUserId required", messages: [] },
				{ status: 400 },
			);
		}

		const endUserId = String(body.endUserId);

		const connectionId = await findNangoConnectionId({
			providerConfigKey,
			endUserId,
		});

		const channelsRes = await nango.proxy({
			method: "GET",
			baseUrlOverride: "https://slack.com/api",
			endpoint:
				"/conversations.list?types=public_channel,private_channel,im,mpim&exclude_archived=true&limit=10",
			providerConfigKey,
			connectionId,
			retries: 2,
		});

		const channelsData = channelsRes.data as SlackListResponse;
		console.log("SLACK_CHANNELS_DATA", JSON.stringify(channelsData, null, 2));

		if (!channelsData.ok) {
			return NextResponse.json(
				{
					error: channelsData.error || "Failed to fetch Slack conversations",
					messages: [],
				},
				{ status: 200 },
			);
		}

		const channels = Array.isArray(channelsData.channels)
	? channelsData.channels
	: [];

console.log("SLACK_CHANNELS_COUNT", channels.length);
console.log(
	"SLACK_CHANNELS_SAMPLE",
	channels.slice(0, 5).map((channel) => ({
		id: channel.id,
		name: channel.name,
		is_im: channel.is_im,
		is_mpim: channel.is_mpim,
		is_private: channel.is_private,
		is_member: channel.is_member,
	})),
);

const readableChannels = channels.filter(
	(channel) => Boolean(channel.is_im || channel.is_mpim || channel.is_member),
);

console.log(
	"SLACK_READABLE_CHANNELS",
	readableChannels.map((channel) => ({
		id: channel.id,
		name: channel.name,
		is_im: channel.is_im,
		is_mpim: channel.is_mpim,
		is_member: channel.is_member,
	})),
);

const historyResults = await Promise.all(
	readableChannels.slice(0, 10).map(async (channel) => {
		try {
			const historyRes = await nango.proxy({
				method: "GET",
				baseUrlOverride: "https://slack.com/api",
				endpoint: `/conversations.history?channel=${encodeURIComponent(
					channel.id,
				)}&limit=5`,
				providerConfigKey,
				connectionId,
				retries: 2,
			});

			return {
				channel,
				data: historyRes.data as SlackHistoryResponse,
			};
		} catch (error) {
			console.error("SLACK_HISTORY_FETCH_FAILED", channel.id, error);
			return {
				channel,
				data: {
					ok: false,
					messages: [],
					error: "history_fetch_failed",
				} as SlackHistoryResponse,
			};
		}
	}),
);

		console.log(
			"SLACK_HISTORY_RESULTS",
			historyResults.map(({ channel, data }) => ({
				channelId: channel.id,
				channelName: channel.name,
				ok: data.ok,
				error: data.error,
				messageCount: Array.isArray(data.messages) ? data.messages.length : 0,
				sample: Array.isArray(data.messages) ? data.messages.slice(0, 2) : [],
			})),
		);

		const messages: MailMessage[] = historyResults
			.flatMap(({ channel, data }) => {
				const channelLabel = conversationLabel(channel);
				const items = Array.isArray(data.messages) ? data.messages : [];

				return items
					.filter((item) => item.text && item.subtype !== "channel_join")
					.map((item) => ({
						id: `${channel.id}:${item.ts}`,
						provider: "slack" as const,
						title: channelLabel,
						preview: cleanPreview(item.text),
						timeLabel: toRelativeTimeLabel(item.ts),
						unread: false,
					}));
			})
			.filter((item) => item.preview.length > 0)
			.sort((a, b) => {
				const aTs = Number(a.id.split(":").pop()?.split(".")[0] || 0);
				const bTs = Number(b.id.split(":").pop()?.split(".")[0] || 0);
				return bTs - aTs;
			})
			.slice(0, 20);

		console.log("SLACK_MESSAGES_RESULT_COUNT", messages.length);
		console.log("SLACK_MESSAGES_RESULT", JSON.stringify(messages, null, 2));

		return NextResponse.json({ messages });
	} catch (error) {
		console.error("SLACK_MESSAGES_ROUTE_ERROR", error);
		return NextResponse.json(
			{ messages: [], error: "Failed to fetch Slack messages" },
			{ status: 500 },
		);
	}
}