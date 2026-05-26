import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import admin from "@/lib/firebase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__Host-sb_auth")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const app = admin.app();

    const auth = getAuth(app);
    const db = getFirestore(app, "ser3bellum");

    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    const userSnap = await db.collection("users").doc(decoded.uid).get();
    const stripeCustomerId = userSnap.data()?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        { status: 404 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/user-settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[stripe/customer-portal]", error);
    return NextResponse.json(
      { error: "Unable to open billing portal" },
      { status: 500 },
    );
  }
}