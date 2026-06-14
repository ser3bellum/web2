import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { userId, workspaceId, subject, message } = body;

    if (!userId || !workspaceId || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const docRef = await adminDb.collection("support_requests").add({
      userId,
      workspaceId,
      subject,
      message,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      requestId: docRef.id,
    });
  } catch (error) {
    console.error("SUPPORT_REQUEST_CREATE_FAILED", error);

    return NextResponse.json(
      { error: "Failed to create support request" },
      { status: 500 },
    );
  }
}