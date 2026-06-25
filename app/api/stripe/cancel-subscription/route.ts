import { NextResponse } from "next/server";
import Stripe from "stripe";
import { cookies } from "next/headers";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
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

    const userRef = db.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data();

    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No Stripe customer found" },
        
        { status: 404 },
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 10,
    });

    const subscription = subscriptions.data.find((sub) =>
      ["trialing", "active", "past_due"].includes(sub.status),
    );

    if (!subscription) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 },
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        cancel_at_period_end: true,
      },
    );
const subscriptionWithPeriod = updatedSubscription as Stripe.Subscription & {
  current_period_end?: number | null;
  cancel_at_period_end?: boolean | null;
};

const currentPeriodEnd = subscriptionWithPeriod.current_period_end;
const cancelAtPeriodEnd = subscriptionWithPeriod.cancel_at_period_end;

const accessUntil = currentPeriodEnd
  ? new Date(currentPeriodEnd * 1000)
  : null;

await userRef.update({
  billingStatus: "cancelled_pending_end",
  subscriptionStatus: updatedSubscription.status,
  stripeSubscriptionId: updatedSubscription.id,
  cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
  currentPeriodEnd: accessUntil,
  accessUntil,
  updatedAt: FieldValue.serverTimestamp(),
});

return NextResponse.json({
  ok: true,
  billingStatus: "cancelled_pending_end",
  subscriptionStatus: updatedSubscription.status,
  subscriptionId: updatedSubscription.id,
  cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
  accessUntil,
});
return NextResponse.json({
  ok: true,
  billingStatus: "cancelled_pending_end",
  subscriptionStatus: updatedSubscription.status,
  subscriptionId: updatedSubscription.id,
  cancelAtPeriodEnd: Boolean(cancelAtPeriodEnd),
  accessUntil,
});
  } catch (error) {
    console.error("[stripe/cancel-subscription]", error);

    return NextResponse.json(
      { error: "Unable to cancel subscription" },
      { status: 500 },
    );
  }
}