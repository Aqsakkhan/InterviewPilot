const { admin, initFirebaseAdmin } = require("../config/firebaseAdmin");
const User = require("../models/User");

/**
 * Verifies the Firebase ID token in the Authorization header.
 * On success attaches:
 *   req.firebaseUser  -> { uid, email, name, picture }  (decoded token)
 *   req.userDoc       -> the matching Mongo User document, if one already exists
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Missing Authorization bearer token." });
    }

    const fbAdmin = initFirebaseAdmin();
    if (!fbAdmin) {
      return res.status(500).json({
        message:
          "Firebase Admin is not configured on the server. Fill in backend/.env (see .env.example).",
      });
    }

    const decoded = await fbAdmin.auth().verifyIdToken(token);

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || "",
      picture: decoded.picture || "",
    };

    req.userDoc = await User.findOne({ firebaseUid: decoded.uid });

    next();
  } catch (err) {
    console.error("Auth verification failed:", err.message);
    return res.status(401).json({ message: "Invalid or expired session. Please sign in again." });
  }
}

/**
 * Use after requireAuth on routes that need a completed profile
 * (resume upload, interviews, dashboard, etc).
 */
function requireProfile(req, res, next) {
  if (!req.userDoc) {
    return res.status(404).json({
      message: "No profile found for this account yet. Please complete profile setup first.",
    });
  }
  next();
}

module.exports = { requireAuth, requireProfile };
