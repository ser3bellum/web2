import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { Resend } from "resend";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

    const user = await adminAuth.getUser(userId);

    const userEmail = user.email ?? null;

    const userName =
    user.displayName ??
    user.email ??
    "Unknown user";

    const docRef = await adminDb.collection("support_requests").add({
      userId,
      userEmail,
      userName,
      workspaceId,
      subject,
      message,
      status: "open",
      createdAt: FieldValue.serverTimestamp(),
      emailNotificationStatus: "pending",
    });

    try {
      await resend.emails.send({
        from:
          process.env.SUPPORT_FROM_EMAIL ??
          "Ser3bellum Support <info@ser3bellum.com>",
        to: [process.env.SUPPORT_EMAIL ?? "info@ser3bellum.com"],
        subject: `[Support] ${subject}`,
        html: `
          <h2>New Ser3bellum Support Request</h2>

          <p><strong>From:</strong> ${escapeHtml(userName ?? "Unknown user")}</p>
          <p><strong>Email:</strong> ${escapeHtml(userEmail ?? "Unknown email")}</p>
          <p><strong>User ID:</strong> ${escapeHtml(userId)}</p>
          <p><strong>Workspace ID:</strong> ${escapeHtml(workspaceId)}</p>
          <p><strong>Request ID:</strong> ${escapeHtml(docRef.id)}</p>

          <hr />

          <p><strong>Subject:</strong></p>
          <p>${escapeHtml(subject)}</p>

          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replaceAll("\n", "<br />")}</p>
        `,
      });

      await docRef.update({
        emailNotificationStatus: "sent",
        emailNotificationSentAt: FieldValue.serverTimestamp(),
      });
    } catch (emailError) {
      console.error("SUPPORT_EMAIL_SEND_FAILED", emailError);

      await docRef.update({
        emailNotificationStatus: "failed",
      });
    }

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