const { initFirebaseAdmin } = require("../config/firebaseAdmin");
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
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing Authorization bearer token.",
      });
    }

    const fbAdmin = initFirebaseAdmin();
    if (!fbAdmin) {
      return res.status(503).json({
        success: false,
        message: "Firebase Admin is not configured on the server.",
      });
    }

    const decoded = await fbAdmin.auth().verifyIdToken(token);

    if (!decoded?.uid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid Firebase token." });
    }

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      picture: decoded.picture || "",
    };

    req.userDoc = await User.findOne({ firebaseUid: decoded.uid });

    return next();
  } catch (err) {
    console.error("Auth verification failed:", err?.message || err);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please sign in again.",
    });
  }
}

/**
 * Use after requireAuth on routes that need a completed profile
 * (resume upload, interviews, dashboard, etc).
 */
function requireProfile(req, res, next) {
  if (!req.userDoc || !req.userDoc.profileComplete) {
    return res.status(404).json({
      success: false,
      message:
        "No profile found for this account yet. Please complete profile setup first.",
    });
  }
  return next();
}

module.exports = { requireAuth, requireProfile };
