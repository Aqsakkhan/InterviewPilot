const mongoose = require("mongoose");

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    category: { type: String, default: "general" }, // e.g. dsa, hr, project, theory
    answer: { type: String, default: "" },
    askedAt: { type: Date, default: Date.now },
    answeredAt: { type: Date },
  },
  { _id: false }
);

const evaluationSchema = new mongoose.Schema(
  {
    technicalScore: { type: Number, default: null },
    communicationScore: { type: Number, default: null },
    confidenceScore: { type: Number, default: null },
    dsaScore: { type: Number, default: null },
    hrScore: { type: Number, default: null },
    overallScore: { type: Number, default: null },
    strengths: [String],
    improvements: [String],
    summary: { type: String, default: "" },
  },
  { _id: false }
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

    qa: [qaSchema],
    currentIndex: { type: Number, default: 0 },

    status: { type: String, enum: ["in_progress", "completed"], default: "in_progress" },
    evaluation: { type: evaluationSchema, default: () => ({}) },

    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", interviewSchema);
