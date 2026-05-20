
"use client";
import Script from "next/script";

export default function BillingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-5xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold">
            Activate your workspace
          </h1>

          <p className="mt-3 text-zinc-500">
            Choose the plan that fits your business.
          </p>
        </div>

        <Script
          async
          src="https://js.stripe.com/v3/pricing-table.js"
          strategy="lazyOnload"
        />

        <stripe-pricing-table
          pricing-table-id="prctbl_1TWwt9BSfxMyBNyWYmysLuyj"
          publishable-key="pk_live_51TTkxbBSfxMyBNyWkH4OEeNVLoaxeKSrMUk8gY6r9zEuVNJHBS8BMl2uX2Jmqw76IUPNVUi1p711wEvRTYdf6A5c00EejZG8lK"
        />
      </div>
    </main>
  );
}