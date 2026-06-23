const admin = require("firebase-admin");

let initialized = false;

function initFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin credentials are incomplete. Auth-protected routes will return JSON 503 responses.",
    );
    return null;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    initialized = true;
    return admin;
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err?.message || err);
    return null;
  }
}

module.exports = { admin, initFirebaseAdmin };
