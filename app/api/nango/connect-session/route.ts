import { NextResponse } from "next/server";
import { getNango } from "@/lib/nango/server";

type Body = {
  allowedIntegrations: string[];
  endUserId: string;
  endUserEmail?: string;
  organizationId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (
      !Array.isArray(body.allowedIntegrations) ||
      body.allowedIntegrations.length === 0
    ) {
      return NextResponse.json(
        { error: "allowedIntegrations required (string[])" },
        { status: 400 },
      );
    }

    if (
      typeof body.endUserId !== "string" ||
      !body.endUserId.trim()
    ) {
      return NextResponse.json(
        { error: "endUserId required (string)" },
        { status: 400 },
      );
    }

    const nango = getNango();

    const slackIntegrationId =
      process.env.NANGO_SLACK_PROVIDER_CONFIG_KEY || "slack";

    const { data } = await nango.createConnectSession({
      allowed_integrations: body.allowedIntegrations,
      tags: {
        end_user_id: body.endUserId,
        end_user_email: body.endUserEmail ?? body.endUserId,
        ...(body.organizationId
          ? { organization_id: body.organizationId }
          : {}),
      },
      ...(body.allowedIntegrations.includes(slackIntegrationId)
        ? {
            integrations_config_defaults: {
              [slackIntegrationId]: {
                user_scopes: [
                  "channels:read",
                  "channels:history",
                  "groups:read",
                  "groups:history",
                  "im:read",
                  "im:history",
                  "mpim:read",
                  "mpim:history",
                  "users:read",
                  "users.profile:read",
                ].join(","),
              },
            },
          }
        : {}),
    });

    return NextResponse.json({
      sessionToken: data.token,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not create connection session";

    console.error("connect-session error:", message);

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}