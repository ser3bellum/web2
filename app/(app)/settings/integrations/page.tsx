"use client";

import Nango from "@nangohq/frontend";
import { ConnectIntegrationModal } from "app/(app)/components/ConnectIntegrationModal";
import PageShell from "app/(app)/components/PageShell";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

type IntegrationKey =
  | "notion"
  | "shopify"
  | "stripe"
  | "google"
  | "slack"
  | "github";

const NANGO_INTEGRATION_ID: Record<IntegrationKey, string> = {
  github: "github-app",
  google: "google-analytics",
  notion: "notion",
  shopify: "shopify",
  slack: "slack",
  stripe: "stripe",
};

type Integration = {
  key: IntegrationKey;
  name: string;
  subtitle: string;
  userIdLabel?: string;
  userIdValue?: string;
  lastUpdate: string;
  createdOn: string;
  connected: boolean;
};

function BadgePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/40 bg-white/40 px-3 py-1 text-xs font-medium text-zinc-700 backdrop-blur">
      {children}
    </span>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="text-[11px] font-medium text-zinc-600">
          {checked ? "Connected" : "Disconnected"}
        </div>
      </div>

      <button
        type="button"
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-7 w-14 items-center rounded-full border transition",
          checked
            ? "border-blue-700/30 bg-blue-700"
            : "border-zinc-300 bg-zinc-100",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-6 w-6 transform rounded-full bg-white shadow transition",
            checked ? "translate-x-7" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

function LogoMark({ name }: { name: string }) {
  const letter = name?.trim()?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="grid h-12 w-12 place-items-center rounded-xl border border-zinc-200 bg-white shadow-sm">
      <span className="text-base font-semibold text-zinc-800">{letter}</span>
    </div>
  );
}

function IntegrationCard({
  integration,
  onToggle,
  onEdit,
}: {
  integration: Integration;
  onToggle: (key: IntegrationKey, next: boolean) => void;
  onEdit: (key: IntegrationKey) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <LogoMark name={integration.name} />
          <div>
            <div className="text-lg font-semibold text-zinc-900">
              {integration.name}
            </div>
            <div className="text-sm text-zinc-500">{integration.subtitle}</div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Toggle
            checked={integration.connected}
            onChange={(next) => onToggle(integration.key, next)}
          />
          <div className="text-[11px] text-zinc-500">
            Last update {integration.lastUpdate}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xl font-semibold text-indigo-700">
          {integration.userIdLabel ?? "User ID"}
        </div>
        <div className="mt-1 text-sm text-zinc-600">
          {integration.userIdValue ?? "—"}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onEdit(integration.key)}
          className="rounded-2xl bg-gradient-to-r from-sky-200 to-indigo-200 px-6 py-2.5 text-sm font-medium text-white shadow hover:brightness-95 active:brightness-90"
        >
          Edit
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span>Created on</span>
          <span className="inline-block h-3.5 w-3.5 rounded border border-zinc-200 bg-white" />
          <span className="text-zinc-300">{integration.createdOn}</span>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  // ✅ Create the Nango client ONCE with public key
  const nango = useMemo(
    () => new Nango({ publicKey: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY! }),
    []
  );
  

  const initial = useMemo<Integration[]>(
    () => [
      {
        key: "notion",
        name: "Notion",
        subtitle: "Auto-track on",
        userIdLabel: "User ID",
        userIdValue: "562f36da-40b05897-p0012-9877",
        lastUpdate: "2 days ago",
        createdOn: "29/01/2026",
        connected: false,
      },
      {
        key: "shopify",
        name: "Shopify",
        subtitle: "Auto-track on",
        userIdLabel: "Store ID",
        userIdValue: "—",
        lastUpdate: "—",
        createdOn: "—",
        connected: false,
      },
      {
        key: "stripe",
        name: "Stripe",
        subtitle: "Auto-track on",
        userIdLabel: "Account",
        userIdValue: "—",
        lastUpdate: "—",
        createdOn: "—",
        connected: false,
      },
      {
        key: "google",
        name: "Google",
        subtitle: "Auto-track on",
        userIdLabel: "Project",
        userIdValue: "—",
        lastUpdate: "—",
        createdOn: "—",
        connected: false,
      },
      {
        key: "slack",
        name: "Slack",
        subtitle: "Auto-track on",
        userIdLabel: "Workspace",
        userIdValue: "—",
        lastUpdate: "—",
        createdOn: "—",
        connected: false,
      },
      {
        key: "github",
        name: "GitHub",
        subtitle: "Auto-track on",
        userIdLabel: "Org",
        userIdValue: "—",
        lastUpdate: "—",
        createdOn: "—",
        connected: false,
      },
    ],
    []
  );

  const [integrations, setIntegrations] = useState<Integration[]>(initial);

  type ConnectTarget = IntegrationKey | "picker" | null;
  const [connectOpen, setConnectOpen] = useState<ConnectTarget>(null);

  // ✅ Backend truth: load connection status for all integrations
  const loadStatus = async () => {
    const providerConfigKeys = Object.values(NANGO_INTEGRATION_ID);

    const res = await fetch("/api/nango/connection-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endUserId: "dev-user-1",
        providerConfigKeys,
      }),
    });

    if (!res.ok) {
      console.error("Failed to load connection status");
      return;
    }

    const data = await res.json();

    const connectedMap = new Map<string, boolean>(
      data.results.map((r: any) => [r.providerConfigKey, r.connected])
    );

    setIntegrations((prev) =>
      prev.map((i) => {
        const providerConfigKey = NANGO_INTEGRATION_ID[i.key];
        return { ...i, connected: connectedMap.get(providerConfigKey) ?? false };
      })
    );
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function connect(key: IntegrationKey) {
    const integrationId = NANGO_INTEGRATION_ID[key];

    const res = await fetch("/api/nango/connect-session", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    allowedIntegrations: [integrationId],
    endUserId: "dev-user-1",
    endUserEmail: "dev@ser3bellum.com",
  }),
});

const payload: any = await res.json().catch(() => ({}));

if (!res.ok) {
  console.error("connect-session failed", payload);
  alert("Could not start connection. Check logs.");
  return;
}

if (payload?.alreadyConnected) {
  await loadStatus();
  return;
}

const sessionToken = payload?.sessionToken;

if (typeof sessionToken !== "string" || sessionToken.length === 0) {
  console.error("Missing/invalid sessionToken", payload);
  alert("Missing session token. Check logs.");
  return;
}

nango.openConnectUI({
  sessionToken,
  onEvent: async (event: any) => {
    console.log("Nango event", event);

    // Different versions emit slightly different event shapes,
    // so we match a few common ones safely.
    const type = event?.type ?? event?.event ?? event?.name;

    if (
      type === "connect" ||
      type === "connected" ||
      type === "connection_created" ||
      type === "auth.success"
    ) {
      await loadStatus();
    }

    if (type === "error" || type === "auth.error") {
      console.error("Nango connect error event", event);
    }
  },
});
}
  return (
    <PageShell className="p-8" contained>
      <section className="rounded-3xl border border-white/60 bg-white/50 p-7 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold text-zinc-900">
              Integrations
            </h1>
            <p className="mt-2 max-w-3xl text-zinc-600">
              Connect third-party services to Ser3bellum to monitor uptime, data
              freshness, and operational signals — all from one dashboard.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <BadgePill>
                <button type="button" onClick={() => connect("stripe")}>
                  Stripe
                </button>
              </BadgePill>
              <BadgePill>
                <button type="button" onClick={() => connect("google")}>
                  Google
                </button>
              </BadgePill>
              <BadgePill>
                <button type="button" onClick={() => connect("shopify")}>
                  Shopify
                </button>
              </BadgePill>
              <BadgePill>
                <button type="button" onClick={() => connect("notion")}>
                  Notion
                </button>
              </BadgePill>
              <BadgePill>
                <button type="button" onClick={() => connect("slack")}>
                  Slack
                </button>
              </BadgePill>
              <BadgePill>
                <button type="button" onClick={() => connect("github")}>
                  GitHub
                </button>
              </BadgePill>
              <BadgePill>More coming soon</BadgePill>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConnectOpen("picker")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-white/40 bg-white/40 p-6 backdrop-blur transition hover:bg-white/60"
            aria-label="Connect integration"
          >
            <div className="grid h-16 w-16 place-items-center rounded-full border border-white/50 bg-white/70 text-3xl text-indigo-600 shadow">
              +
            </div>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
              Connect
            </span>
          </button>
        </div>
      </section>

      <section className="mt-7">
        <div className="grid gap-6 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.key}
              integration={integration}
              onToggle={(key, next) =>
                setIntegrations((prev) =>
                  prev.map((i) =>
                    i.key === key ? { ...i, connected: next } : i
                  )
                )
              }
              onEdit={(key) => console.log("Edit integration:", key)}
            />
          ))}
        </div>
      </section>

      {connectOpen && (
        <ConnectIntegrationModal
          integration={connectOpen === "picker" ? undefined : connectOpen}
          onClose={() => setConnectOpen(null)}
        />
      )}
    </PageShell>
  );
}