import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getNango } from "@/lib/nango/server";
import { findNangoConnectionId } from "@/lib/nango/findConnectionId";
import { getUserCompanyContext } from "@/lib/data/getUserCompanyContext";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("__Host-sb_auth")?.value;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await adminAuth.verifySessionCookie(session, true);
    } catch (e) {
      console.error("GA_TEST_SESSION_REJECTED:", e);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user } = await getUserCompanyContext(session);

    if (!user?.id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 401 });
    }

    const nango = getNango();

    const providerConfigKey = "google-analytics";
    const endUserId = user.id;

    const connectionId = await findNangoConnectionId({
      providerConfigKey,
      endUserId,
    });

    const result = await nango.get({
      endpoint: "/v1beta/accounts",
      params: { pageSize: 10 },
      providerConfigKey,
      connectionId,
      baseUrlOverride: "https://analyticsadmin.googleapis.com",
    });

    return NextResponse.json(result.data);
  } catch (err: any) {
    console.error("GA test error", err?.response?.data || err);
    return NextResponse.json(
      {
        error: "Failed GA test",
        details: err?.message,
        raw: err?.response?.data,
      },
      { status: 500 }
    );
  }
}