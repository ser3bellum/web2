import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import admin from "@/lib/firebase/admin";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getDb() {
  const app = admin.app();
  return getFirestore(app, "ser3bellum");
}

function getBillingStatus(subscription: Stripe.Subscription) {
  if (subscription.cancel_at_period_end) {
    return "cancelled_pending_end";
  }

  if (subscription.status === "trialing") {
    return "trialing";
  }

  if (subscription.status === "active") {
    return "active";
  }

  if (["canceled", "unpaid", "incomplete_expired"].includes(subscription.status)) {
    return "expired";
  }

  return subscription.status;
}

function getDateFromStripeTimestamp(value?: number | null) {
  return value ? new Date(value * 1000) : null;
}

function getSubscriptionDates(subscription: Stripe.Subscription) {
  const subscriptionWithDates = subscription as Stripe.Subscription & {
    current_period_end?: number | null;
    trial_end?: number | null;
  };

  const currentPeriodEnd = getDateFromStripeTimestamp(
    subscriptionWithDates.current_period_end,
  );

  const trialEnd = getDateFromStripeTimestamp(subscriptionWithDates.trial_end);

  return {
    currentPeriodEnd,
    trialEnd,
    accessUntil: currentPeriodEnd ?? trialEnd,
  };
}

async function findUserRefFromStripeCustomer(
  db: FirebaseFirestore.Firestore,
  stripeCustomerId: string,
) {
  const usersSnap = await db
    .collection("users")
    .where("stripeCustomerId", "==", stripeCustomerId)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    return null;
  }

  return usersSnap.docs[0].ref;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("[stripe/webhook] Invalid signature", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const db = getDb();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("[stripe/webhook] checkout session", {
          id: session.id,
          metadata: session.metadata,
          clientReferenceId: session.client_reference_id,
          customer: session.customer,
          subscription: session.subscription,
        });

        const firebaseUid =
          session.metadata?.firebaseUid ??
          session.client_reference_id ??
          undefined;

        const stripeCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id;

        const stripeSubscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (!firebaseUid || !stripeCustomerId || !stripeSubscriptionId) {
          console.warn("[stripe/webhook] Missing checkout mapping data", {
            firebaseUid,
            stripeCustomerId,
            stripeSubscriptionId,
            metadata: session.metadata,
            clientReferenceId: session.client_reference_id,
          });
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const { currentPeriodEnd, trialEnd, accessUntil } =
          getSubscriptionDates(subscription);

        await db.collection("users").doc(firebaseUid).set(
          {
            stripeCustomerId,
            stripeSubscriptionId,
            subscriptionStatus: subscription.status,
            billingStatus: getBillingStatus(subscription),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd,
            trialEnd,
            accessUntil,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const stripeCustomerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userRef = await findUserRefFromStripeCustomer(
          db,
          stripeCustomerId,
        );

        if (!userRef) {
          console.warn("[stripe/webhook] No user found for customer", {
            stripeCustomerId,
            subscriptionId: subscription.id,
            eventType: event.type,
          });
          break;
        }

        const { currentPeriodEnd, trialEnd, accessUntil } =
          getSubscriptionDates(subscription);

        await userRef.update({
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          billingStatus: getBillingStatus(subscription),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd,
          trialEnd,
          accessUntil,
          updatedAt: FieldValue.serverTimestamp(),
        });

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const stripeCustomerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const userRef = await findUserRefFromStripeCustomer(
          db,
          stripeCustomerId,
        );

        if (!userRef) {
          console.warn("[stripe/webhook] No user found for deleted subscription", {
            stripeCustomerId,
            subscriptionId: subscription.id,
          });
          break;
        }

        await userRef.update({
          stripeSubscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
          billingStatus: "expired",
          cancelAtPeriodEnd: false,
          accessUntil: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        break;
      }

      default:
        console.log("[stripe/webhook] Unhandled event:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/webhook] Handler failed", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}