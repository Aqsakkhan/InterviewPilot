const Resume = require("../models/Resume");
const { parseResumePdf } = require("../services/resumeParserService");

/**
 * POST /api/resume/upload  (multipart/form-data, field name "resume")
 */
async function uploadResume(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded. Attach a PDF under field name 'resume'.",
      });
    }

    const parsed = await parseResumePdf(req.file.buffer);

    const resume = await Resume.findOneAndUpdate(
      { user: req.userDoc._id },
      {
        user: req.userDoc._id,
        fileName: req.file.originalname,
        rawText: parsed.rawText,
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        skills: parsed.skills || [],
        projects: parsed.projects || [],
        internships: parsed.experience || [],
        experience: parsed.experience || [],
        education: parsed.education || [],
        certifications: parsed.certifications || [],
        strongAreas: parsed.skills || [],
        weakAreas: [],
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

module.exports = { uploadResume, getMyResume };
