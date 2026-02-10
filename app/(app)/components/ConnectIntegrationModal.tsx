"use client";

import React from "react";
import { cn } from "app/(app)/lib/cn";
import { BaseModal } from "./ui/Modal";

type IntegrationKey =
  | "notion"
  | "shopify"
  | "stripe"
  | "google"
  | "slack"
  | "github";

const INTEGRATIONS: Record<IntegrationKey, { name: string }> = {
  notion: { name: "Notion" },
  shopify: { name: "Shopify" },
  stripe: { name: "Stripe" },
  google: { name: "Google" },
  slack: { name: "Slack" },
  github: { name: "GitHub" },
};

export function ConnectIntegrationModal({
  integration,
  onClose,
}: {
  integration?: IntegrationKey;
  onClose: () => void;
}) {
  const selected = integration ? INTEGRATIONS[integration] : null;

  return (
    <BaseModal
      title={selected ? `Connect ${selected.name}` : "Add integration"}
      subtitle="Paste your API key to let Ser3bellum start monitoring."
      onClose={onClose}
      size="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium text-white",
              "bg-gradient-to-r from-sky-400 to-indigo-500 hover:brightness-95"
            )}
          >
            Save
          </button>
        </>
      }
    >
      {/* Selector (only if opened via +) */}
      {!selected && (
        <div className="mt-2 grid grid-cols-3 gap-3">
          {(Object.keys(INTEGRATIONS) as IntegrationKey[]).map((key) => (
            <button
              type="button"
              key={key}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 hover:bg-slate-50"
            >
              {INTEGRATIONS[key].name}
            </button>
          ))}
        </div>
      )}

      {/* API Key input */}
      {selected && (
        <div className="mt-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              API key
            </label>
            <input
              type="text"
              placeholder="sk_live_••••••••"
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <details className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-700">
              Where do I find this?
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Instructions coming soon. We’ll guide you step by step.
            </p>
          </details>
        </div>
      )}
    </BaseModal>
  );
}
