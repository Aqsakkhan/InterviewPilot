const User = require("../models/User");

function serializeUser(user) {
  return user ? user.toObject?.() || user : null;
}

/**
 * POST /api/users/sync
 * Called after a successful Firebase login. It verifies the Mongo profile status
 * without creating an incomplete profile; first-time users complete setup first.
 */
async function syncUser(req, res, next) {
  try {
    const user = await User.findOne({ firebaseUid: req.firebaseUser.uid });
    return res.json({ success: true, user: serializeUser(user) });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/users/me
 */
async function getMe(req, res, next) {
  try {
    if (!req.userDoc) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please complete profile setup.",
      });
    }
    return res.json({ success: true, user: serializeUser(req.userDoc) });
  } catch (err) {
    next(err);
    return next(err);
  }
}

/**
 * PUT /api/users/me
 * Body: { name }
 */
async function updateMe(req, res, next) {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Full name is required." });
    }

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      {
        $set: {
          firebaseUid: req.firebaseUser.uid,
          email: req.firebaseUser.email,
          name,
          photoURL: req.firebaseUser.picture || "",
          profileComplete: true,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    return res.json({ success: true, user: serializeUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .json({
          success: false,
          message: "A profile already exists for this account.",
        });
    }
    return next(err);
  }
}

module.exports = { syncUser, getMe, updateMe };
