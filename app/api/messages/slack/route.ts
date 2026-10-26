import { NextResponse } from "next/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { getNango } from "@/lib/nango/server";

export const dynamic = "force-dynamic";

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

type SlackAuthResponse = {
	ok: boolean;
	user?: string;
	user_id?: string;
	bot_id?: string;
	error?: string;
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

type MailMessage = {
	id: string;
	provider: "slack";
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
	if (channel.is_im) return "Direct message";
	if (channel.is_mpim) return "Group DM";
	if (channel.name) return `#${channel.name}`;
	if (channel.is_private) return "Private channel";

	return "Slack";
}

function cleanPreview(text?: string) {
	if (!text) return "";
	return text.replace(/<[^>]+>/g, "").trim();
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as {
			endUserId?: string;
		};

		if (
			typeof body.endUserId !== "string" ||
			!body.endUserId.trim()
		) {
			return NextResponse.json(
				{ error: "endUserId required", messages: [] },
				{ status: 400 },
			);
		}

		const nango = getNango();
		const endUserId = body.endUserId.trim();

		const connectionId = await findNangoConnectionId({
			providerConfigKey,
			endUserId,
		});

		const connection = await nango.getConnection(
			providerConfigKey,
			connectionId,
		);

		const credentials = connection.credentials as {
			raw?: {
				authed_user?: {
					access_token?: string;
				};
			};
		};

		const userToken =
			credentials.raw?.authed_user?.access_token;

		console.log("SLACK_USER_TOKEN_CHECK", {
			hasUserToken: Boolean(userToken),
		});

		if (!userToken) {
			return NextResponse.json(
				{
					messages: [],
					error: "Slack connection has no user token",
				},
				{ status: 409 },
			);
		}

		const userHeaders = {
			authorization: `Bearer ${userToken}`,
		};

		const authRes = await nango.proxy({
			method: "GET",
			baseUrlOverride: "https://slack.com/api",
			endpoint: "/auth.test",
			providerConfigKey,
			connectionId,
			headers: userHeaders,
		});

		const authData = authRes.data as SlackAuthResponse;

		console.log("SLACK_AUTH_TEST", {
			ok: authData.ok,
			user: authData.user,
			userId: authData.user_id,
			botId: authData.bot_id,
			error: authData.error,
		});

		if (!authData.ok || authData.bot_id) {
			return NextResponse.json(
				{
					messages: [],
					error:
						authData.error ||
						"Slack request is still using a bot identity",
				},
				{ status: 502 },
			);
		}

		const channelsRes = await nango.proxy({
			method: "GET",
			baseUrlOverride: "https://slack.com/api",
			endpoint:
				"/conversations.list?types=public_channel,private_channel,im,mpim&exclude_archived=true&limit=100",
			providerConfigKey,
			connectionId,
			headers: userHeaders,
			retries: 2,
		});

		const channelsData =
			channelsRes.data as SlackListResponse;

		if (!channelsData.ok) {
			console.error("SLACK_CONVERSATIONS_ERROR", {
				error: channelsData.error,
			});

			return NextResponse.json(
				{
					error:
						channelsData.error ||
						"Failed to fetch Slack conversations",
					messages: [],
				},
				{ status: 502 },
			);
		}

		const channels = Array.isArray(channelsData.channels)
			? channelsData.channels
			: [];

		console.log("SLACK_CONVERSATIONS_DEBUG", {
			total: channels.length,
			directMessages: channels.filter((c) => c.is_im).length,
			groupMessages: channels.filter((c) => c.is_mpim).length,
			memberChannels: channels.filter((c) => c.is_member).length,
		});

		const readableChannels = channels.filter(
			(channel) =>
				Boolean(
					channel.is_im ||
						channel.is_mpim ||
						channel.is_member,
				),
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
						headers: userHeaders,
						retries: 2,
					});

					return {
						channel,
						data: historyRes.data as SlackHistoryResponse,
					};
				} catch {
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
			"SLACK_HISTORY_DEBUG",
			historyResults.map(({ channel, data }) => ({
				conversationType: channel.is_im
					? "dm"
					: channel.is_mpim
						? "group_dm"
						: "channel",
				ok: data.ok,
				error: data.error,
				messageCount: data.messages?.length ?? 0,
			})),
		);

		const messages: MailMessage[] = historyResults
			.flatMap(({ channel, data }) => {
				if (!data.ok) return [];

				const items = Array.isArray(data.messages)
					? data.messages
					: [];

				return items
					.filter((item) => {
						const text = cleanPreview(item.text);

						if (!text) return false;
						if (item.subtype === "channel_join") return false;

						if (
							text
								.toLowerCase()
								.includes("added an integration to this channel")
						) {
							return false;
						}

						return true;
					})
					.map((item) => ({
						id: `${channel.id}:${item.ts}`,
						provider: "slack" as const,
						title: conversationLabel(channel),
						preview: cleanPreview(item.text),
						timeLabel: toRelativeTimeLabel(item.ts),
						unread: false,
					}));
			})
			.sort((a, b) => {
				const aTs = Number(a.id.split(":").pop() || 0);
				const bTs = Number(b.id.split(":").pop() || 0);

				return bTs - aTs;
			})
			.slice(0, 20);

		return NextResponse.json({ messages });
	} catch (error: unknown) {
		console.error(
			"SLACK_MESSAGES_ROUTE_ERROR",
			error instanceof Error
				? error.message
				: "Unknown Slack request error",
		);

		return NextResponse.json(
			{
				messages: [],
				error: "Failed to fetch Slack messages",
			},
			{ status: 500 },
		);
	}
}