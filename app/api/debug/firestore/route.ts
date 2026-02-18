export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  try {
    const ref = db.collection("_admin_smoke_test").doc("ping");

    await ref.set({
      ok: true,
      at: FieldValue.serverTimestamp(),
    });

    const snap = await ref.get();

    return NextResponse.json({
      ok: true,
      data: snap.data(),
    });
  } catch (err: any) {
    console.error("FIRESTORE_SMOKE_TEST_ERROR:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message,
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
