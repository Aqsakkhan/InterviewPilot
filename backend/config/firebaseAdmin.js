const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

let initialized = false;

function loadServiceAccountFromFile() {
  const keyPath = path.join(__dirname, "serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) return null;
  return require(keyPath);
}

function loadServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  let rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawPrivateKey) return null;

  rawPrivateKey = rawPrivateKey.trim();

  // Common paste mistake: copying the whole `KEY="value"` line from a .env
  // file into a dashboard's raw text field (Render, Railway, etc.) carries
  // the surrounding quote characters along as literal text, since those
  // dashboards don't do shell-style unquoting like dotenv does locally.
  if (
    (rawPrivateKey.startsWith('"') && rawPrivateKey.endsWith('"')) ||
    (rawPrivateKey.startsWith("'") && rawPrivateKey.endsWith("'"))
  ) {
    rawPrivateKey = rawPrivateKey.slice(1, -1);
  }

  // .env stores the key with literal \n sequences - convert them back into
  // real newlines for the PEM to parse correctly. If real newlines are
  // already present (some dashboards support multiline paste), this is a
  // no-op.
  const privateKey = rawPrivateKey.replace(/\\n/g, "\n");

  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    throw new Error(
      "FIREBASE_PRIVATE_KEY doesn't look like a valid PEM key. Check for " +
        "extra surrounding quotes, missing \\n sequences, or a truncated paste.",
    );
  }

  return { projectId, clientEmail, privateKey };
}

function initFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  try {
    // Local dev: drop a serviceAccountKey.json in backend/config/ (gitignored).
    // Deployment: set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY instead,
    // since most hosts (Render/Vercel/Railway) don't let you upload files.
    const serviceAccount =
      loadServiceAccountFromFile() || loadServiceAccountFromEnv();

    if (!serviceAccount) {
      throw new Error(
        "No Firebase credentials found. Add backend/config/serviceAccountKey.json, " +
          "or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in backend/.env.",
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    console.log(
      "Firebase Admin initialized successfully (source: %s)",
      loadServiceAccountFromFile() ? "serviceAccountKey.json" : "env vars",
    );

    return admin;
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err.message);
    return null;
  }
}

module.exports = { admin, initFirebaseAdmin };
