const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    techStack: [String],
  },
  { _id: false },
);

const experienceSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    description: String,
    date: String,
  },
  { _id: false },
);

const educationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    year: String,
  },
  { _id: false },
);

const skillCategoriesSchema = new mongoose.Schema(
  {
    languages: [String],
    frameworks: [String],
    databases: [String],
    cloudDevops: [String],
    tools: [String],
    other: [String],
  },
  { _id: false },
);

const analysisSchema = new mongoose.Schema(
  {
    atsScore: { type: Number, min: 0, max: 100 },
    strengthScore: { type: Number, min: 0, max: 100 },
    experienceLevel: String,
    skillCategories: skillCategoriesSchema,
    softSkillsDetected: [String],
    matchedKeywords: [String],
    missingSkills: [String],
    suggestions: [String],
    improvementTips: [String],
    targetRole: String,
    targetCompany: String,

    roleMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    companyMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },

    matchedRoleSkills: [String],

    matchedCompanySkills: [String],
    analyzedAt: Date,
  },
  { _id: false },
);

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    fileName: String,
    rawText: String,

    name: String,
    email: String,
    phone: String,

    skills: [String],
    projects: [projectSchema],
    internships: [experienceSchema],
    experience: [experienceSchema],
    education: [educationSchema],
    certifications: [String],

    strongAreas: [String],
    weakAreas: [String],

    analysis: analysisSchema,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resume", resumeSchema);
