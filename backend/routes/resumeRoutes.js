/**
 * resumeRoutes.js
 * ─────────────────────────────────────────────────────────────────────────
 * All routes are auth-gated (requireAuth + requireProfile).
 *
 * POST   /api/resume/upload          upload PDF → parse → analyze → save
 * GET    /api/resume/me              fetch current resume + analysis
 * POST   /api/resume/analyze         re-run analysis without re-uploading
 * GET    /api/resume/analysis/pdf    download PDF analysis report
 */

const express = require("express");
const multer = require("multer");

const { requireAuth, requireProfile } = require("../middleware/authMiddleware");
const {
  downloadResumeAnalysisPdf,
  getMyResume,
  reanalyzeResume,
  uploadResume,
} = require("../controllers/resumeController");

const router = express.Router();

/* ── Multer: in-memory, PDF only, 8 MB cap ── */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(
        Object.assign(new Error("Only PDF resumes are supported."), {
          statusCode: 400,
        }),
      );
    }
    cb(null, true);
  },
});

/* ── Routes ── */
router.post(
  "/upload",
  requireAuth,
  requireProfile,
  upload.single("resume"),
  uploadResume,
);

router.get("/me", requireAuth, requireProfile, getMyResume);

router.post("/analyze", requireAuth, requireProfile, reanalyzeResume);

router.get(
  "/analysis/pdf",
  requireAuth,
  requireProfile,
  downloadResumeAnalysisPdf,
);

module.exports = router;
