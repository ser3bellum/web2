type NangoConnection = {
  connection_id: string;
  provider_config_key: string;
  provider: string;
  created: string;
  tags?: Record<string, string>;
  errors?: any[];
};

export async function findNangoConnectionId(params: {
  providerConfigKey: string;
  endUserId: string;
}): Promise<string> {
  const { providerConfigKey, endUserId } = params;

  const secret = process.env.NANGO_SECRET_KEY;
  if (!secret) throw new Error("Missing NANGO_SECRET_KEY");

  const url = new URL("https://api.nango.dev/connections");
  url.searchParams.set("limit", "100");
  // tags[end_user_id]=... is the recommended way (endUserId query param is deprecated)
  url.searchParams.set("tags[end_user_id]", endUserId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${secret}` },
    // prevent Next caching this call
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nango list connections failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { connections: NangoConnection[] };
  const match = data.connections.find((c) => c.provider_config_key === providerConfigKey);

  if (!match) {
    throw new Error(
      `No Nango connection found for providerConfigKey="${providerConfigKey}" and endUserId="${endUserId}". ` +
        `Make sure you completed the OAuth flow and check Nango → Connections.`
    );
  }

  return match.connection_id;
}