"use client";

import Nango from "@nangohq/frontend";
import { ConnectIntegrationModal } from "app/(app)/components/ConnectIntegrationModal";
import PageShell from "app/(app)/components/PageShell";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n/getDictionary";

type IntegrationKey =
  | "notion"
  | "shopify"
  | "stripe"
  | "google"
  | "slack"
  | "github"
  | "meta"
  | "googleAds";

  type HydratedSource = {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
};
const NANGO_INTEGRATION_ID: Record<IntegrationKey, string> = {
  github: "github-app",
  google: "google-analytics",
  googleAds: "google-ads",
  notion: "notion",
  shopify: "shopify",
  slack: "slack",
  stripe: "stripe-api-key",
  meta: "meta-marketing-api",
};

type Integration = {
  key: IntegrationKey;
  name: string;
  subtitle: string;
  primaryLabel: string;
  primaryValue: string | null;
  secondaryLabel?: string;
  secondaryValue?: string | null;
  lastUpdate: string | null;
  createdOn: string | null;
  connected: boolean;
  connectionId: string | null;
};

type Props = {
  dictionary: Dictionary;
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
  connectedLabel,
  disconnectedLabel,
}: {
  checked: boolean;
  connectedLabel: string;
  disconnectedLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-right leading-tight">
        <div className="text-[11px] font-medium text-zinc-600">
          {checked ? connectedLabel : disconnectedLabel}
        </div>
      </div>

      <div className="pointer-events-none">
        <button
          type="button"
          aria-pressed={checked}
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
  t,
}: {
  integration: Integration;
  onToggle: (key: IntegrationKey, next: boolean) => void;
  onEdit: (key: IntegrationKey) => void;
  t: Dictionary["integrations"];
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
          connectedLabel={t.connected}
          disconnectedLabel={t.disconnected}
          />
          <div className="text-[11px] text-zinc-500">
            {t.lastUpdate} {integration.lastUpdate ?? "—"}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xl font-semibold text-indigo-700">
          {integration.primaryLabel}
        </div>
        <div className="mt-1 text-sm text-zinc-600">
          {integration.primaryValue ?? "—"}
        </div>

        {integration.secondaryLabel ? (
          <div className="mt-4">
            <div className="text-sm font-medium text-zinc-500">
              {integration.secondaryLabel}
            </div>
            <div className="mt-1 text-sm text-zinc-600">
              {integration.secondaryValue ?? "—"}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onEdit(integration.key)}
          className="rounded-2xl bg-gradient-to-r from-sky-200 to-indigo-200 px-6 py-2.5 text-sm font-medium text-white shadow hover:brightness-95 active:brightness-90"
        >
          {t.edit}
        </button>

        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <span>{t.createdOn}</span>
          <span className="inline-block h-3.5 w-3.5 rounded border border-zinc-200 bg-white" />
          <span className="text-zinc-300">{integration.createdOn ?? "—"}</span>
        </div>
      </div>
    </div>
  );
}
function IntegrationManagementModal({
  integration,
  onClose,
  onDisconnected,
  }: {
  integration: Integration;
  onClose: () => void;
  onDisconnected: () => Promise<void>;
  }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">
              Manage {integration.name}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Control how this integration is connected to Ser3bellum.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-medium text-zinc-800">
            Connection status
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            {integration.connected ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={!integration.connected}
             onClick={async () => {
        try {
          const res = await fetch("/api/nango/disconnect", {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          },
          body: JSON.stringify({
          connectionId: integration.connectionId,
          providerConfigKey:
            NANGO_INTEGRATION_ID[integration.key],
         }),
        });

        if (!res.ok) {
        alert("Failed to disconnect integration");
        return;
      }

      await onDisconnected();
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to disconnect integration");
    }
  }}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Disconnect integration
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
export default function IntegrationsClient({ dictionary }: Props) {
  const t = dictionary.integrations;

  const nango = useMemo(
    () => new Nango({ publicKey: process.env.NEXT_PUBLIC_NANGO_PUBLIC_KEY! }),
    []
  );

  const [authUser, setAuthUser] = useState<{
    endUserId: string;
    email: string | null;
  } | null>(null);

  const initial = useMemo<Integration[]>(
    () => [
      {
        key: "notion",
        name: "Notion",
        subtitle: t.autoTrackOn,
        primaryLabel: t.workspace,
        primaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
         connectionId: null,
      },
      {
        key: "shopify",
        name: "Shopify",
        subtitle: t.autoTrackOn,
        primaryLabel: t.store,
        primaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
        connectionId: null,
      },
      {
        key: "stripe",
        name: "Stripe",
        subtitle: t.autoTrackOn,
        primaryLabel: "Payments account",
        primaryValue: null,
        secondaryLabel: "Revenue source",
        secondaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
        connectionId: null,
      },
      {
        key: "google",
        name: "Google Analytics",
        subtitle: t.autoTrackOn,
        primaryLabel: t.property,
        primaryValue: null,
        secondaryLabel: t.propertyId,
        secondaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
        connectionId: null,
      },
      {
        key: "googleAds",
        name: "Google Ads",
        subtitle: t.autoTrackOn,
        primaryLabel: "Campaigns",
        primaryValue: null,
        secondaryLabel: "Customer ID",
        secondaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
        connectionId: null,
      },
      {
        key: "slack",
        name: "Slack",
        subtitle: t.autoTrackOn,
        primaryLabel: t.workspace,
        primaryValue: null,
        secondaryLabel: t.teamId,
        secondaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
        connectionId: null,
      },
      {
        key: "github",
        name: "GitHub",
        subtitle: t.autoTrackOn,
        primaryLabel: t.organization,
        primaryValue: null,
        secondaryLabel: t.orgId,
        secondaryValue: null,
        lastUpdate: null,
        createdOn: null,
        connected: false,
        connectionId: null,
      },

      {
      key: "meta",
      name: "Meta Ads",
      subtitle: t.autoTrackOn,
      primaryLabel: t.account,
      primaryValue: null,
      secondaryLabel: "Ad Account ID",
      secondaryValue: null,
      lastUpdate: null,
      createdOn: null,
      connected: false,
      connectionId: null,
    },
    ],
    [t]
  );

  const [integrations, setIntegrations] = useState<Integration[]>(initial);

  const [manageOpen, setManageOpen] = useState<Integration | null>(null);

  type ConnectTarget = IntegrationKey | "picker" | null;
  const [connectOpen, setConnectOpen] = useState<ConnectTarget>(null);

  useEffect(() => {
    setIntegrations(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });

        if (!res.ok) {
          console.error("Failed to load authenticated user");
          return;
        }

        const data = await res.json();

        if (!cancelled) {
          setAuthUser({
            endUserId: data.endUserId,
            email: data.email ?? null,
          });
        }
      } catch (error) {
        console.error("Failed to load authenticated user", error);
      }
    }

    loadMe();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadStatus = async () => {
    if (!authUser?.endUserId) return;

    const providerConfigKeys = Object.values(NANGO_INTEGRATION_ID);

    const res = await fetch("/api/nango/connection-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endUserId: authUser.endUserId,
        providerConfigKeys,
      }),
    });

    if (!res.ok) {
      console.error("Failed to load connection status");
      return;
    }

    const data = await res.json();

    const statusMap = new Map<
      string,
      {
        connected: boolean;
        connectionId: string | null;
        primaryValue: string | null;
        secondaryValue: string | null;
        lastUpdate: string | null;
        createdOn: string | null;
      }
    >(data.results.map((r: any) => [r.providerConfigKey, r]));

    setIntegrations((prev) =>
      prev.map((i) => {
        const providerConfigKey = NANGO_INTEGRATION_ID[i.key];
        const status = statusMap.get(providerConfigKey);

        if (!status) {
          return {
            ...i,
            connected: false,
            connectionId: null,
            primaryValue: null,
            secondaryValue: null,
            lastUpdate: null,
            createdOn: null,
          };
        }

        return {
          ...i,
          connected: status.connected,
          connectionId: status.connectionId,
          primaryValue: status.primaryValue,
          secondaryValue: status.secondaryValue,
          lastUpdate: status.lastUpdate,
          createdOn: status.createdOn,
        };
      })
    );
  };

  useEffect(() => {
    if (!authUser?.endUserId) return;
    loadStatus();
  }, [authUser?.endUserId]);

  async function connect(key: IntegrationKey) {
    if (!authUser?.endUserId) {
      alert(t.noAuthenticatedUser);
      return;
    }

    const integrationId = NANGO_INTEGRATION_ID[key];

    const res = await fetch("/api/nango/connect-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allowedIntegrations: [integrationId],
        endUserId: authUser.endUserId,
        endUserEmail: authUser.email ?? undefined,
      }),
    });

    const payload: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("connect-session failed", payload);
      alert(t.couldNotStartConnection);
      return;
    }

    if (payload?.alreadyConnected) {
      await loadStatus();
      return;
    }

    const sessionToken = payload?.sessionToken;

    if (typeof sessionToken !== "string" || sessionToken.length === 0) {
      console.error("Missing/invalid sessionToken", payload);
      alert(t.missingSessionToken);
      return;
    }

    nango.openConnectUI({
      sessionToken,
      onEvent: async (event: any) => {
        console.log("Nango event", event);

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
              {t.title}
            </h1>
            <p className="mt-2 max-w-3xl text-zinc-600">
              {t.subtitle}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
      
              <BadgePill>
              <button type="button" onClick={() => connect("meta")}>
               Meta Ads
              </button>
              </BadgePill>
              <BadgePill>
                <button type="button" onClick={() => connect("google")}>
                  Google
                </button>
              </BadgePill>
              <BadgePill>
              <button type="button" onClick={() => connect("googleAds")}>
                Google Ads
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
              <BadgePill>
                <button type="button" onClick={() => connect("stripe")}>
                  Stripe
                </button>
              </BadgePill>
              <BadgePill>{t.moreComingSoon}</BadgePill>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setConnectOpen("picker")}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-white/40 bg-white/40 p-6 backdrop-blur transition hover:bg-white/60"
            aria-label={t.connectIntegration}
          >
            <div className="grid h-16 w-16 place-items-center rounded-full border border-white/50 bg-white/70 text-3xl text-indigo-600 shadow">
              +
            </div>
            <span className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900">
              {t.connect}
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
              t={t}
              onToggle={async (key, next) => {
              const integration = integrations.find((i) => i.key === key);

              if (!integration) return;

              // Already connected → do nothing for now
              if (integration.connected) {
              console.log("Integration already connected:", key);
              return;
              }

              // Only start OAuth when not connected yet
              if (next) {
              await connect(key);
              }
              }}
             onEdit={(key) => {
            const selected = integrations.find((i) => i.key === key);
            if (selected) setManageOpen(selected);
            }}
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

{manageOpen && (
  <IntegrationManagementModal
  integration={manageOpen}
  onClose={() => setManageOpen(null)}
  onDisconnected={loadStatus}
/>
      )}
    </PageShell>
  );
}
