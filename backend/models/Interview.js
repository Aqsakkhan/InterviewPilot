const mongoose = require("mongoose");

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    category: { type: String, default: "general" }, // e.g. dsa, hr, project, theory
    answer: { type: String, default: "" },
    isFollowUp: { type: Boolean, default: false }, // true if this question probes deeper into the previous answer
    askedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date },
  },
  { _id: false },
);

const readinessSchema = new mongoose.Schema(
  {
    score: { type: Number, default: null },
    verdict: { type: String, default: "" },
  },
  { _id: false },
);

const evaluationSchema = new mongoose.Schema(
  {
    // Core scores
    overallScore: { type: Number, default: null },
    technicalScore: { type: Number, default: null }, // Technical Knowledge
    communicationScore: { type: Number, default: null },
    confidenceScore: { type: Number, default: null },
    problemSolvingScore: { type: Number, default: null }, // was dsaScore
    hrScore: { type: Number, default: null },

    // Speech/answer quality scores
    vocabularyScore: { type: Number, default: null },
    fluencyScore: { type: Number, default: null },
    answerQualityScore: { type: Number, default: null },

    // Coaching bullets (behavioral, actionable)
    strengths: [String],
    improvements: [String],

    // Topic-level areas (for learning recommendations / dashboard)
    strongAreas: [String],
    weakAreas: [String],
    learningPath: [String],

    // Narrative feedback
    summary: { type: String, default: "" },
    recruiterFeedback: { type: String, default: "" },

    // Readiness verdicts
    companyReadiness: { type: readinessSchema, default: () => ({}) },
    roleReadiness: { type: readinessSchema, default: () => ({}) },
  },
  { _id: false },
);

const interviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["hr", "technical", "dsa", "project_viva", "full_placement"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    durationMinutes: { type: Number, default: 20 },
    targetQuestionCount: { type: Number, default: 8 },

    plan: {
      type: [
        {
          step: Number,
          topic: String,
          instruction: String,
        },
      ],
      default: [],
    },

    company: {
      type: String,
      default: "Google",
    },

    jobRole: {
      type: String,
      default: "Software Engineer",
    },

    experienceLevel: {
      type: String,
      default: "Fresher",
    },

    qa: [qaSchema],
    currentIndex: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    evaluation: { type: evaluationSchema, default: () => ({}) },

    completedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Interview", interviewSchema);
