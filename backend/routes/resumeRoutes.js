const express = require("express");
const multer = require("multer");
const { requireAuth, requireProfile } = require("../middleware/authMiddleware");
const { uploadResume, getMyResume } = require("../controllers/resumeController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF resumes are supported."));
    }
    cb(null, true);
  },
});

router.post("/upload", requireAuth, requireProfile, upload.single("resume"), uploadResume);
router.get("/me", requireAuth, requireProfile, getMyResume);

module.exports = router;
