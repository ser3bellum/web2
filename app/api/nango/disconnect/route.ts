export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import {
  deleteNangoConnection,
  getNangoConnection,
} from "@/lib/firestore/nangoConnections";

type DisconnectRequest = {
  providerConfigKey?: unknown;
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("__Host-sb_auth")?.value;

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let userId: string;

  try {
    await adminAuth.verifySessionCookie(session, true);

    const { user } = await getUserCompanyContext(session);

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    userId = user.id;
  } catch (error) {
    console.error("NANGO_DISCONNECT_AUTH_REJECTED:", error);

    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: DisconnectRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (
    typeof body.providerConfigKey !== "string" ||
    body.providerConfigKey.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "Missing providerConfigKey" },
      { status: 400 }
    );
  }

  const providerConfigKey = body.providerConfigKey.trim();

  try {
    const connection = await getNangoConnection({
      userId,
      providerConfigKey,
    });

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Development Nango environment — disabled until needed.
    // const nangoSecretKey = process.env.NANGO_SECRET_KEY_DEV;

    // Free-plan environment currently used by the application.
    const nangoSecretKey = process.env.NANGO_SECRET_KEY_PROD;

    if (!nangoSecretKey) {
      console.error("NANGO_SECRET_KEY_PROD is not configured");

      return NextResponse.json(
        { error: "Nango is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.nango.dev/connections/${encodeURIComponent(
        connection.connectionId
      )}?provider_config_key=${encodeURIComponent(providerConfigKey)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${nangoSecretKey}`,
        },
        cache: "no-store",
      }
    );

    // A 404 means Nango has already removed the connection.
    if (!response.ok && response.status !== 404) {
      const responseBody = await response.text();

      console.error("NANGO_DISCONNECT_FAILED:", {
        status: response.status,
        body: responseBody,
        providerConfigKey,
        userId,
      });

      return NextResponse.json(
        { error: "Could not disconnect integration" },
        { status: 502 }
      );
    }

    await deleteNangoConnection({
      userId,
      providerConfigKey,
      expectedConnectionId: connection.connectionId,
    });

    return NextResponse.json({
      success: true,
      providerConfigKey,
    });
  } catch (error) {
    console.error("NANGO_DISCONNECT_UNEXPECTED_ERROR:", error);

    return NextResponse.json(
      { error: "Unexpected disconnect error" },
      { status: 500 }
    );
  }
}