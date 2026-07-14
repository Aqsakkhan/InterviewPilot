/**
 * rateLimitMiddleware.js
 * ─────────────────────────────────────────────────────────────────────────
 * Protects the Gemini-calling routes (interview creation/answers, resume
 * upload/analysis) from cost/abuse risk. Must run AFTER requireAuth so
 * req.userDoc is available - limits are keyed per user, not per IP, so
 * multiple legitimate users on the same network (e.g. a college lab)
 * don't share a limit bucket.
 */

const rateLimit = require("express-rate-limit");

function keyByUser(req) {
  return req.userDoc?._id?.toString() || req.ip;
}

function rateLimitedResponse(req, res) {
  res.status(429).json({
    success: false,
    message:
      "You're doing that a bit too often. Please wait a few minutes and try again.",
  });
}

/**
 * Interview creation, answer submission, and early completion all trigger
 * a Gemini call. A full interview is ~20 questions max, so this allows
 * comfortable headroom for one active interview plus retries.
 */
const interviewActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  handler: rateLimitedResponse,
});

/**
 * Resume upload/re-analysis each trigger a Gemini extraction call.
 * This isn't something a real user does frequently.
 */
const resumeAnalysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUser,
  handler: rateLimitedResponse,
});

module.exports = { interviewActionLimiter, resumeAnalysisLimiter };
