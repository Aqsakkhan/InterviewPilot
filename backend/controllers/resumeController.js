/**
 * resumeController.js
 * ─────────────────────────────────────────────────────────────────────────
 * Handles all resume-related HTTP requests.
 *
 * Routes (see resumeRoutes.js):
 *   POST   /api/resume/upload          — upload + parse + analyze
 *   GET    /api/resume/me              — fetch current resume
 *   POST   /api/resume/analyze         — re-run analysis (optional role in body)
 *   GET    /api/resume/analysis/pdf    — download PDF report
 */

const Resume = require("../models/Resume");
const { extractResumeData } = require("../services/geminiService");
const {
  extractTextFromPdf,
  parseResumeText,
} = require("../services/resumeParserService");
const {
  computeResumeAnalysis,
  ROLE_KEYWORDS,
} = require("../services/resumeAnalysisService");
const {
  generateResumeAnalysisPdf,
} = require("../services/resumeReportService");

/* ── Valid roles (sourced from the single source of truth) ── */
const VALID_ROLES = Object.keys(ROLE_KEYWORDS);

/* ── Fallback helpers (Phase 2) ── */

const GEMINI_FALLBACK_STATUSES = new Set([429, 500, 502, 503, 504]);
const NETWORK_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ENETDOWN",
  "ENETRESET",
  "ENETUNREACH",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

function getErrorStatus(err) {
  return (
    err?.statusCode ||
    err?.status ||
    err?.response?.status ||
    err?.cause?.statusCode ||
    err?.cause?.status
  );
}

function shouldFallback(err) {
  const status = getErrorStatus(err);
  const code = err?.code || err?.cause?.code || "";
  const message = err?.message || "";
  return (
    GEMINI_FALLBACK_STATUSES.has(Number(status)) ||
    NETWORK_ERROR_CODES.has(code) ||
    code.startsWith("GEMINI_") ||
    /timeout|timed out|network|fetch failed|socket|connection/i.test(message)
  );
}

function pickArray(primary, fallback = []) {
  return Array.isArray(primary) && primary.length > 0 ? primary : fallback;
}

async function parseResumeWithFallback(rawText) {
  const local = parseResumeText(rawText);

  try {
    const gemini = await extractResumeData(rawText);
    return {
      source: "gemini",
      data: {
        ...local,
        skills: pickArray(gemini.skills, local.skills),
        projects: pickArray(gemini.projects, local.projects),
        experience: pickArray(gemini.internships, local.experience),
        education: pickArray(gemini.education, local.education),
        certifications: pickArray(gemini.certifications, local.certifications),
        strongAreas: pickArray(gemini.strongAreas, local.skills),
        weakAreas: Array.isArray(gemini.weakAreas) ? gemini.weakAreas : [],
      },
    };
  } catch (err) {
    console.warn("[resume] Gemini extraction failed — using local parser", {
      status: getErrorStatus(err),
      code: err?.code || err?.cause?.code,
      willFallback: shouldFallback(err),
      message: err?.message,
    });
    return {
      source: "local",
      data: { ...local, strongAreas: local.skills, weakAreas: [] },
    };
  }
}

/* ── Controllers ── */

/**
 * POST /api/resume/upload
 */
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Attach a PDF under field name 'resume'.",
      });
    }

    const rawText = await extractTextFromPdf(req.file.buffer);
    const { data } = await parseResumeWithFallback(rawText);
    const analysis = computeResumeAnalysis(data, req.userDoc.targetRole);

    const resume = await Resume.findOneAndUpdate(
      { user: req.userDoc._id },
      {
        $set: {
          user: req.userDoc._id,
          fileName: req.file.originalname,
          rawText,
          name: data.name,
          email: data.email,
          phone: data.phone,
          skills: data.skills || [],
          projects: data.projects || [],
          internships: data.experience || [],
          experience: data.experience || [],
          education: data.education || [],
          certifications: data.certifications || [],
          strongAreas: data.strongAreas || [],
          weakAreas: analysis.missingSkills || [],
          analysis,
        },
        $push: {
          atsScoreHistory: {
            atsScore: analysis.atsScore,
            strengthScore: analysis.strengthScore,
            recordedAt: new Date(),
          },
        },
      },
      { new: true, upsert: true },
    );

    res.json(resume);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/resume/me
 */
async function getMyResume(req, res, next) {
  try {
    const resume = await Resume.findOne({ user: req.userDoc._id });
    if (!resume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }
    res.json(resume);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/resume/analyze
 *
 * Accepts an optional { role } in the request body.
 *   - If role is provided and valid  → analyze for that role.
 *   - If role is missing or invalid  → fall back to the user's saved targetRole.
 *
 * The user's profile targetRole is NEVER modified here.
 */
async function reanalyzeResume(req, res, next) {
  try {
    const resume = await Resume.findOne({ user: req.userDoc._id });
    if (!resume) {
      return res.status(404).json({
        message: "No resume uploaded yet. Upload a resume first.",
      });
    }

    // Use the role from the request body if it is a known role,
    // otherwise fall back to the user's saved profile role.
    const requestedRole = req.body?.role?.trim();
    const roleToUse =
      requestedRole && VALID_ROLES.includes(requestedRole)
        ? requestedRole
        : req.userDoc.targetRole;

    const analysis = computeResumeAnalysis(
      {
        email: resume.email,
        phone: resume.phone,
        skills: resume.skills,
        projects: resume.projects,
        experience: resume.experience,
        education: resume.education,
        certifications: resume.certifications,
        rawText: resume.rawText,
      },
      roleToUse,
    );

    // Save the updated analysis back to the resume document.
    // weakAreas is also updated to reflect the new role's missing skills.
    resume.analysis = analysis;
    resume.weakAreas = analysis.missingSkills || [];
    resume.atsScoreHistory.push({
      atsScore: analysis.atsScore,
      strengthScore: analysis.strengthScore,
      recordedAt: new Date(),
    });
    await resume.save();

    res.json(resume);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/resume/analysis/pdf
 */
async function downloadResumeAnalysisPdf(req, res, next) {
  try {
    const resume = await Resume.findOne({ user: req.userDoc._id });

    if (!resume) {
      return res.status(404).json({ message: "No resume uploaded yet." });
    }
    if (!resume.analysis) {
      return res.status(404).json({
        message:
          "Resume has not been analyzed yet. Re-upload or call POST /api/resume/analyze.",
      });
    }

    const pdfBuffer = await generateResumeAnalysisPdf(resume, req.userDoc);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="resume-analysis-${req.userDoc._id}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  downloadResumeAnalysisPdf,
  getMyResume,
  parseResumeWithFallback,
  reanalyzeResume,
  shouldFallback,
  uploadResume,
  VALID_ROLES,
};
