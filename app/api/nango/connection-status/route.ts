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
    case "meta-marketing-api":
      return "Connected";
    case "slack":
      return "Connected workspace";
    case "google-analytics":
      return "Connected property";
    case "github-app":
      return "Connected organization";
    case "stripe-api-key":
      return "Connected account";
    case "shopify":
      return "Connected store";
    case "notion":
      return "Connected workspace";
    default:
      return "Connected";
  }
}

type ConnectorStatus = "active" | "awaiting-data" | "failed" | "disconnected";
function getConnectorStatus(providerConfigKey: string): ConnectorStatus {
	switch (providerConfigKey) {
		case "slack":
		case "meta-marketing-api":
			return "awaiting-data";

		case "google-analytics":
		case "shopify":
		case "stripe-api-key":
			return "active";

		default:
			return "active";
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
          status: "disconnected",
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

      const isMeta = normalizedProviderConfigKey === "meta-marketing-api";
      const isStripe = normalizedProviderConfigKey === "stripe-api-key";

      return {
	    providerConfigKey: normalizedProviderConfigKey,
	    connected: true,
	    status: getConnectorStatus(normalizedProviderConfigKey),
	    connectionId,
	    primaryValue: isMeta
		  ? "Basic OAuth connected"
		  : isStripe
			? "Payments connected"
			: getDefaultPrimaryValue(normalizedProviderConfigKey),
	    secondaryValue: isMeta
		  ? "Limited access"
		  : isStripe
			? "Feeds Sales + Accounting"
			: connectionId,
	    lastUpdate: null,
	    createdOn: null,
      };
      } catch {
        return {
          providerConfigKey: normalizedProviderConfigKey,
          connected: false,
          status: "disconnected",
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