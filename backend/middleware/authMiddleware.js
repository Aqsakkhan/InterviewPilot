const { initFirebaseAdmin } = require("../config/firebaseAdmin");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "AUTH_TOKEN_MISSING",
        message: "Missing Authorization bearer token.",
      });
    }

    const fbAdmin = initFirebaseAdmin();

    if (!fbAdmin) {
      return res.status(503).json({
        success: false,
        code: "FIREBASE_ADMIN_NOT_CONFIGURED",
        message: "Firebase Admin is not configured on the server.",
      });
    }

    const decoded = await fbAdmin.auth().verifyIdToken(token, true);

    if (!decoded?.uid) {
      return res.status(401).json({
        success: false,
        code: "AUTH_TOKEN_INVALID",
        message: "Firebase token is invalid.",
      });
    }

    req.firebaseUser = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || "",
      picture: decoded.picture || "",
    };

    req.userDoc = await User.findOne({
      firebaseUid: decoded.uid,
    });

    return next();
  } catch (err) {
    const code = err?.code || "AUTH_TOKEN_VERIFICATION_FAILED";

    console.error("Auth verification failed:", code, err?.message || err);

    return res.status(401).json({
      success: false,
      code,
      message:
        "We could not verify your Firebase session. Please refresh or sign in again.",
    });
  }
}

function requireProfile(req, res, next) {
  if (!req.userDoc || !req.userDoc.profileComplete) {
    return res.status(403).json({
      success: false,
      code: "PROFILE_REQUIRED",
      message: "Please complete profile setup before accessing this resource.",
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireProfile,
};
