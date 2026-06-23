const Resume = require("../models/Resume");
const { extractTextFromPdf } = require("../services/resumeParserService");
const { extractResumeData } = require("../services/geminiService");

/**
 * POST /api/resume/upload  (multipart/form-data, field name "resume")
 */
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded. Attach a PDF under field name 'resume'." });
    }

    const rawText = await extractTextFromPdf(req.file.buffer);
    const extracted = await extractResumeData(rawText);

    const resume = await Resume.findOneAndUpdate(
      { user: req.userDoc._id },
      {
        user: req.userDoc._id,
        fileName: req.file.originalname,
        rawText,
        skills: extracted.skills || [],
        projects: extracted.projects || [],
        internships: extracted.internships || [],
        education: extracted.education || [],
        certifications: extracted.certifications || [],
        strongAreas: extracted.strongAreas || [],
        weakAreas: extracted.weakAreas || [],
      },
      { new: true, upsert: true }
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

module.exports = { uploadResume, getMyResume };
