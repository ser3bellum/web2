import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/admin";

type NangoConnectionRecord = {
  userId: string;
  providerConfigKey: string;
  connectionId: string;
  provider: string;
  status: "connected";
};

function getDocumentId(userId: string, providerConfigKey: string) {
  return `${userId}__${providerConfigKey}`;
}

export async function upsertNangoConnection(params: {
  userId: string;
  providerConfigKey: string;
  connectionId: string;
  provider?: string;
}) {
  const { userId, providerConfigKey, connectionId, provider } = params;
  const docId = getDocumentId(userId, providerConfigKey);

  await db.collection("nango_connections").doc(docId).set(
    {
      userId,
      providerConfigKey,
      connectionId,
      provider: provider ?? providerConfigKey,
      status: "connected",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

export async function getNangoConnection(params: {
  userId: string;
  providerConfigKey: string;
}): Promise<NangoConnectionRecord | null> {
  const { userId, providerConfigKey } = params;
  const docId = getDocumentId(userId, providerConfigKey);

  const snapshot = await db
    .collection("nango_connections")
    .doc(docId)
    .get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (
    data?.userId !== userId ||
    data?.providerConfigKey !== providerConfigKey ||
    typeof data?.connectionId !== "string" ||
    data.connectionId.trim().length === 0
  ) {
    return null;
  }

  return {
    userId: data.userId,
    providerConfigKey: data.providerConfigKey,
    connectionId: data.connectionId,
    provider:
      typeof data.provider === "string"
        ? data.provider
        : providerConfigKey,
    status: "connected",
  };
}

export async function deleteNangoConnection(params: {
  userId: string;
  providerConfigKey: string;
  expectedConnectionId: string;
}) {
  const { userId, providerConfigKey, expectedConnectionId } = params;
  const docId = getDocumentId(userId, providerConfigKey);
  const reference = db.collection("nango_connections").doc(docId);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);

    if (!snapshot.exists) {
      return;
    }

    const data = snapshot.data();

    if (
      data?.userId !== userId ||
      data?.providerConfigKey !== providerConfigKey ||
      data?.connectionId !== expectedConnectionId
    ) {
      throw new Error("Nango connection changed during disconnect");
    }

    transaction.delete(reference);
  });
}