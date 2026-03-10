import { NextResponse } from 'next/server';
import { getNango } from '@/lib/nango/server';

type Body = {
  allowedIntegrations: string[]; // Nango integration IDs
  endUserId: string;            // your internal user id
  endUserEmail?: string;
  organizationId?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!Array.isArray(body.allowedIntegrations) || body.allowedIntegrations.length === 0) {
      return NextResponse.json(
        { error: 'allowedIntegrations required (string[])' },
        { status: 400 }
      );
    }

    if (typeof body.endUserId !== 'string' || !body.endUserId.trim()) {
      return NextResponse.json(
        { error: 'endUserId required (string)' },
        { status: 400 }
      );
    }

    const nango = getNango();

    // ✅ Create short-lived Connect session (NO deprecated end_user field)
    const { data } = await nango.createConnectSession({
      allowed_integrations: body.allowedIntegrations,
      tags: {
        end_user_id: body.endUserId,
        end_user_email: body.endUserEmail ?? body.endUserId,
        ...(body.organizationId ? { organization_id: body.organizationId } : {})
      }
    });

    return NextResponse.json({
      sessionToken: data.token
    });
  } catch (err: any) {
  const raw = err?.response?.data || err;
  console.error("connect-session error (full):", JSON.stringify(raw, null, 2));

  return NextResponse.json(
    { error: err?.message ?? "Unknown error", raw },
    { status: 500 }
  );
}
  
}