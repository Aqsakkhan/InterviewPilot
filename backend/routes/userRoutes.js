const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  syncUser,
  createProfile,
  getMe,
  updateMe,
  updatePreferences,
  deleteAccount,
} = require("../controllers/userController");

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.post("/profile", requireAuth, createProfile);

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);
router.delete("/me", requireAuth, deleteAccount);
router.put("/preferences", requireAuth, updatePreferences);

module.exports = router;
