import { NextResponse } from "next/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { upsertNangoConnection } from "@/lib/firestore/nangoConnections";

export const dynamic = "force-dynamic";

type ConnectionStatusRequest = {
  endUserId: string;
  providerConfigKeys: string[];
};

function getDefaultPrimaryValue(providerConfigKey: string): string | null {
  switch (providerConfigKey) {
    case "slack":
      return "Connected workspace";
    case "google-analytics":
      return "Connected property";
    case "github-app":
      return "Connected organization";
    case "stripe":
      return "Connected account";
    case "shopify":
      return "Connected store";
    case "notion":
      return "Connected workspace";
    default:
      return "Connected";
  }
}

export async function POST(req: Request) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { endUserId, providerConfigKeys } = body as ConnectionStatusRequest;

  if (
    typeof endUserId !== "string" ||
    endUserId.trim().length === 0 ||
    !Array.isArray(providerConfigKeys)
  ) {
    return NextResponse.json(
      { error: "endUserId and providerConfigKeys required" },
      { status: 400 }
    );
  }

  const normalizedEndUserId = endUserId.trim();

  const results = await Promise.all(
    providerConfigKeys.map(async (providerConfigKey) => {
      if (
        typeof providerConfigKey !== "string" ||
        providerConfigKey.trim().length === 0
      ) {
        return {
          providerConfigKey: String(providerConfigKey),
          connected: false,
          connectionId: null,
          primaryValue: null,
          secondaryValue: null,
          lastUpdate: null,
          createdOn: null,
        };
      }

      const normalizedProviderConfigKey = providerConfigKey.trim();

      try {
        const connectionId = await findNangoConnectionId({
          providerConfigKey: normalizedProviderConfigKey,
          endUserId: normalizedEndUserId,
        });

        await upsertNangoConnection({
          userId: normalizedEndUserId,
          providerConfigKey: normalizedProviderConfigKey,
          connectionId,
          provider: normalizedProviderConfigKey,
        });

        return {
          providerConfigKey: normalizedProviderConfigKey,
          connected: true,
          connectionId,
          primaryValue: getDefaultPrimaryValue(normalizedProviderConfigKey),
          secondaryValue: connectionId,
          lastUpdate: null,
          createdOn: null,
        };
      } catch {
        return {
          providerConfigKey: normalizedProviderConfigKey,
          connected: false,
          connectionId: null,
          primaryValue: null,
          secondaryValue: null,
          lastUpdate: null,
          createdOn: null,
        };
      }
    })
  );

  return NextResponse.json({
    endUserId: normalizedEndUserId,
    results,
  });
}