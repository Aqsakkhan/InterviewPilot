const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    techStack: [String],
  },
  { _id: false }
);

const internshipSchema = new mongoose.Schema(
  {
    company: String,
    role: String,
    description: String,
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    year: String,
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

    fileName: String,
    rawText: String,

    skills: [String],
    projects: [projectSchema],
    internships: [internshipSchema],
    education: [educationSchema],
    certifications: [String],

    strongAreas: [String],
    weakAreas: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
