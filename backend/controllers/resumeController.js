const Resume = require("../models/Resume");
const { extractResumeData } = require("../services/geminiService");
const {
  extractTextFromPdf,
  parseResumeText,
} = require("../services/resumeParserService");

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

function shouldFallbackToLocalParser(err) {
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

function logGeminiFallback(err, expectedFallback) {
  console.warn(
    "[resume] Gemini resume extraction failed; using local parser fallback",
    {
      status: getErrorStatus(err),
      code: err?.code || err?.cause?.code,
      expectedFallback,
      message: err?.message,
    },
  );
}

async function parseResumeWithFallback(rawText) {
  const localParsed = parseResumeText(rawText);

  try {
    const geminiParsed = await extractResumeData(rawText);

    return {
      source: "gemini",
      data: {
        ...localParsed,
        skills: pickArray(geminiParsed.skills, localParsed.skills),
        projects: pickArray(geminiParsed.projects, localParsed.projects),
        experience: pickArray(geminiParsed.internships, localParsed.experience),
        education: pickArray(geminiParsed.education, localParsed.education),
        certifications: pickArray(
          geminiParsed.certifications,
          localParsed.certifications,
        ),
        strongAreas: pickArray(geminiParsed.strongAreas, localParsed.skills),
        weakAreas: Array.isArray(geminiParsed.weakAreas)
          ? geminiParsed.weakAreas
          : [],
      },
    };
  } catch (err) {
    logGeminiFallback(err, shouldFallbackToLocalParser(err));

    return {
      source: "local",
      data: {
        ...localParsed,
        strongAreas: localParsed.skills,
        weakAreas: [],
      },
    };
  }
}

/**
 * POST /api/resume/upload
 * multipart/form-data, field name "resume"
 */
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Attach a PDF under field name 'resume'.",
      });
    }

    const rawText = await extractTextFromPdf(req.file.buffer);

    const parsed = await parseResumeWithFallback(rawText);

    const data = parsed.data;

    const resume = await Resume.findOneAndUpdate(
      { user: req.userDoc._id },
      {
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
        weakAreas: data.weakAreas || [],
      },
      {
        new: true,
        upsert: true,
      },
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
    const resume = await Resume.findOne({
      user: req.userDoc._id,
    });

    if (!resume) {
      return res.status(404).json({
        message: "No resume uploaded yet.",
      });
    }

    res.json(resume);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyResume,
  parseResumeWithFallback,
  shouldFallbackToLocalParser,
  uploadResume,
};
