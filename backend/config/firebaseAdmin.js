const admin = require("firebase-admin");

let initialized = false;

function buildServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) {
    throw new Error(
      "Missing FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY in backend/.env.",
    );
  }

  // .env stores the key with literal \n sequences (wrapped in quotes) —
  // convert them back into real newlines for the PEM to parse correctly.
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

function initFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  try {
    const serviceAccount = buildServiceAccountFromEnv();

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    console.log("Firebase Admin initialized successfully");

    return admin;
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err.message);
    return null;
  }
}

module.exports = { admin, initFirebaseAdmin };
