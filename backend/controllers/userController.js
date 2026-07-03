const User = require("../models/User");
const Resume = require("../models/Resume");
const Interview = require("../models/Interview");
const { initFirebaseAdmin } = require("../config/firebaseAdmin");

function serializeUser(user) {
  return user ? user.toObject?.() || user : null;
}

function getTrimmedName(body) {
  return typeof body.name === "string" ? body.name.trim() : "";
}

async function saveProfile(req, res, next) {
  try {
    const name = getTrimmedName(req.body);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Full name is required.",
      });
    }

    if (!req.firebaseUser.email) {
      return res.status(400).json({
        success: false,
        message: "Authenticated account is missing an email address.",
      });
    }

    const { college, branch, graduationYear, targetRole } = req.body;

    const setFields = {
      firebaseUid: req.firebaseUser.uid,
      email: req.firebaseUser.email,
      name,
      photoURL: req.firebaseUser.picture || "",
      profileComplete: true,
    };

    // These are optional and weren't collected during onboarding, so only
    // set them when explicitly provided (e.g. from the Profile edit form).
    if (typeof college === "string") setFields.college = college.trim();
    if (typeof branch === "string") setFields.branch = branch.trim();
    if (graduationYear !== undefined && graduationYear !== "") {
      setFields.graduationYear = Number(graduationYear);
    }
    if (typeof targetRole === "string") setFields.targetRole = targetRole;

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      { $set: setFields },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

    return res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A profile already exists for this account.",
      });
    }

    return next(err);
  }
}

/**
 * POST /api/users/sync
 * Called after a successful Firebase login.
 * It verifies the Mongo profile status without creating
 * an incomplete profile; first-time users complete setup first.
 */
async function syncUser(req, res, next) {
  try {
    const user = await User.findOne({
      firebaseUid: req.firebaseUser.uid,
    });

    return res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/users/profile
 * Creates or completes the Mongo profile after Firebase authentication.
 */
async function createProfile(req, res, next) {
  return saveProfile(req, res, next);
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

    return res.json({
      success: true,
      user: serializeUser(req.userDoc),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * PUT /api/users/me
 * Body: { name }
 */
async function updateMe(req, res, next) {
  return saveProfile(req, res, next);
}

/**
 * PUT /api/users/preferences
 * Body: { voice?, interview?, reduceMotion? } - partial updates allowed.
 * Kept separate from saveProfile since preferences don't require a name
 * and shouldn't touch profileComplete.
 */
async function updatePreferences(req, res, next) {
  try {
    if (!req.userDoc) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please complete profile setup.",
      });
    }

    const { voice, interview, reduceMotion } = req.body || {};

    const update = {};
    if (voice) {
      if (voice.autoRead !== undefined)
        update["preferences.voice.autoRead"] = Boolean(voice.autoRead);
      if (voice.rate !== undefined)
        update["preferences.voice.rate"] = Number(voice.rate);
      if (voice.pitch !== undefined)
        update["preferences.voice.pitch"] = Number(voice.pitch);
    }
    if (interview) {
      if (interview.defaultDifficulty !== undefined)
        update["preferences.interview.defaultDifficulty"] =
          interview.defaultDifficulty;
      if (interview.defaultDurationMinutes !== undefined)
        update["preferences.interview.defaultDurationMinutes"] = Number(
          interview.defaultDurationMinutes,
        );
      if (interview.defaultCompany !== undefined)
        update["preferences.interview.defaultCompany"] =
          interview.defaultCompany;
    }
    if (reduceMotion !== undefined)
      update["preferences.reduceMotion"] = Boolean(reduceMotion);

    const user = await User.findOneAndUpdate(
      { firebaseUid: req.firebaseUser.uid },
      { $set: update },
      { new: true, runValidators: true },
    );

    return res.json({
      success: true,
      user: serializeUser(user),
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/users/me
 * Permanently deletes the account: resume, all interviews, the Mongo
 * profile, and the underlying Firebase Auth user itself (so the person
 * can't just log back in and get a fresh profile auto-created).
 */
async function deleteAccount(req, res, next) {
  try {
    const userId = req.userDoc?._id;

    if (userId) {
      await Promise.all([
        Resume.deleteOne({ user: userId }),
        Interview.deleteMany({ user: userId }),
        User.deleteOne({ _id: userId }),
      ]);
    }

    try {
      const fbAdmin = initFirebaseAdmin();
      if (fbAdmin) await fbAdmin.auth().deleteUser(req.firebaseUser.uid);
    } catch (fbErr) {
      // Mongo data is already gone at this point - log but don't fail the
      // request just because the Firebase-side cleanup hit an issue.
      console.error("Failed to delete Firebase auth user:", fbErr.message);
    }

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  syncUser,
  createProfile,
  getMe,
  updateMe,
  updatePreferences,
  deleteAccount,
};
