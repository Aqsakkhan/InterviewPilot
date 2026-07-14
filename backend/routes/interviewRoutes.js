const express = require("express");
const { requireAuth, requireProfile } = require("../middleware/authMiddleware");
const {
  createInterview,
  submitAnswer,
  completeInterview,
  listInterviews,
  getInterview,
  downloadInterviewReportPdf,
} = require("../controllers/interviewController");
const {
  getStats,
  getProgress,
} = require("../controllers/interviewStatsController");
const { interviewActionLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

router.use(requireAuth, requireProfile);

router.get("/stats/summary", getStats);
router.get("/stats/progress", getProgress);
router.post("/", interviewActionLimiter, createInterview);
router.get("/", listInterviews);
router.get("/:id", getInterview);
router.get("/:id/report/pdf", downloadInterviewReportPdf);
router.post("/:id/answer", interviewActionLimiter, submitAnswer);
router.post("/:id/complete", interviewActionLimiter, completeInterview);

module.exports = router;
