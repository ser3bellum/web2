import admin from "firebase-admin";
import fs from "fs";
import path from "path";

function loadServiceAccount() {
  const p = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!p) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is not set");
  }

  const absPath = path.isAbsolute(p)
    ? p
    : path.join(process.cwd(), p);

  const raw = fs.readFileSync(absPath, "utf8");
  const parsed = JSON.parse(raw);

  // Ensure private key newlines are correct
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  return parsed;
}

if (!admin.apps.length) {
  const serviceAccount = loadServiceAccount();

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}


export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export default admin;
