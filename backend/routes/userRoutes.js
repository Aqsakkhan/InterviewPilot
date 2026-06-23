const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  syncUser,
  createProfile,
  getMe,
  updateMe,
} = require("../controllers/userController");

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.post("/profile", requireAuth, createProfile);

router.get("/me", requireAuth, getMe);
router.put("/me", requireAuth, updateMe);

module.exports = router;
