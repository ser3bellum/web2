import { NextResponse } from "next/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    endUserId: string;
    providerConfigKeys: string[];
  };

  if (!body?.endUserId || !Array.isArray(body.providerConfigKeys)) {
    return NextResponse.json(
      { error: "endUserId and providerConfigKeys required" },
      { status: 400 }
    );
  }

  const endUserId = String(body.endUserId);

  const results = await Promise.all(
    body.providerConfigKeys.map(async (providerConfigKey) => {
      try {
        const connectionId = await findNangoConnectionId({
          providerConfigKey,
          endUserId,
        });
        return { providerConfigKey, connected: true, connectionId };
      } catch {
        return { providerConfigKey, connected: false };
      }
    })
  );

  return NextResponse.json({ endUserId, results });
}