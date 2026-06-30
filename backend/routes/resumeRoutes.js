const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middleware/authMiddleware");
const resumeController = require("../controllers/resumeController");

const router = express.Router();

function getRouteHandler(source, name) {
  const handler = source[name];

  if (typeof handler !== "function") {
    throw new TypeError(`Resume route handler '${name}' must be a function.`);
  }

  return handler;
}

const requireAuth = getRouteHandler(authMiddleware, "requireAuth");

const requireProfile = getRouteHandler(authMiddleware, "requireProfile");

const uploadResume = getRouteHandler(resumeController, "uploadResume");

const getMyResume = getRouteHandler(resumeController, "getMyResume");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF resumes are supported."));
    }

    cb(null, true);
  },
});

router.post(
  "/upload",
  requireAuth,
  requireProfile,
  upload.single("resume"),
  uploadResume,
);

router.get("/me", requireAuth, requireProfile, getMyResume);

module.exports = router;
