const express = require("express");
const { requireAuth, requireProfile } = require("../middleware/authMiddleware");
const {
  createInterview,
  submitAnswer,
  completeInterview,
  listInterviews,
  getInterview,
  getStats,
} = require("../controllers/interviewController");

const router = express.Router();

router.use(requireAuth, requireProfile);

router.get("/stats/summary", getStats);
router.post("/", createInterview);
router.get("/", listInterviews);
router.get("/:id", getInterview);
router.post("/:id/answer", submitAnswer);
router.post("/:id/complete", completeInterview);

module.exports = router;
