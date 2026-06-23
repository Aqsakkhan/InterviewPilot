const User = require("../models/User");

/**
 * POST /api/users/sync
 * Called right after a successful Firebase login on the frontend.
 * Creates the Mongo user record on first login, otherwise just returns it.
 */
async function syncUser(req, res, next) {
  try {
    const { uid, email, name, picture } = req.firebaseUser;

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || "",
        photoURL: picture || "",
      });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/me
 */
async function getMe(req, res, next) {
  try {
    if (!req.userDoc) {
      return res.status(404).json({ message: "Profile not found. Call /api/users/sync first." });
    }
    res.json(req.userDoc);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/me
 * Body: { name, college, branch, graduationYear, targetRole }
 */
async function updateMe(req, res, next) {
  try {
    const { name, college, branch, graduationYear, targetRole } = req.body;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      {
        ...(name !== undefined && { name }),
        ...(college !== undefined && { college }),
        ...(branch !== undefined && { branch }),
        ...(graduationYear !== undefined && { graduationYear }),
        ...(targetRole !== undefined && { targetRole }),
        profileComplete: true,
      },
      { new: true, upsert: true }
    );

    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { syncUser, getMe, updateMe };
