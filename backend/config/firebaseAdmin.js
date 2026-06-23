const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

let initialized = false;

function initFirebaseAdmin() {
  if (initialized || admin.apps.length) {
    initialized = true;
    return admin;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    console.log("Firebase Admin initialized successfully");

    return admin;
  } catch (err) {
    console.error("Firebase Admin initialization failed:", err);
    return null;
  }
}

module.exports = { admin, initFirebaseAdmin };
