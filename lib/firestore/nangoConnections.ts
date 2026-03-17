import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

export async function upsertNangoConnection(params: {
  userId: string;
  providerConfigKey: string;
  connectionId: string;
  provider?: string;
}) {
  const { userId, providerConfigKey, connectionId, provider } = params;

  const docId = `${userId}__${providerConfigKey}`;

  await db.collection("nango_connections").doc(docId).set(
    {
      userId,
      providerConfigKey,
      connectionId,
      provider: provider ?? providerConfigKey,
      status: "connected",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}