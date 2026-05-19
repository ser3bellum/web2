export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { ok: false, error: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  const rawBody = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (err: any) {
    console.error("STRIPE_SIGNATURE_ERROR:", err.message);

    return NextResponse.json(
      { ok: false, error: "Invalid Stripe signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const customerEmail =
          session.customer_details?.email ??
          session.customer_email ??
          null;

        if (!customerEmail) {
          console.warn("NO_CUSTOMER_EMAIL");
          break;
        }

        const userSnap = await adminDb
          .collection("users")
          .where("email", "==", customerEmail)
          .limit(1)
          .get();

        if (userSnap.empty) {
          console.warn("NO_USER_FOUND_FOR_EMAIL:", customerEmail);
          break;
        }

        const userDoc = userSnap.docs[0];
        const userData = userDoc.data();

        await userDoc.ref.set(
          {
            billingStatus: "active",

            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : null,

            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : null,

            billingActivatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        if (userData.companyId) {
          await adminDb
            .collection("companies")
            .doc(userData.companyId)
            .set(
              {
                billingStatus: "active",

                stripeCustomerId:
                  typeof session.customer === "string"
                    ? session.customer
                    : null,

                stripeSubscriptionId:
                  typeof session.subscription === "string"
                    ? session.subscription
                    : null,

                billingActivatedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
        }

        console.log(
          "STRIPE_CHECKOUT_COMPLETED:",
          customerEmail,
        );

        break;
      }

      default:
        console.log("Unhandled Stripe event:", event.type);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("STRIPE_WEBHOOK_HANDLER_ERROR:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Webhook processing failed",
      },
      { status: 500 },
    );
  }
}