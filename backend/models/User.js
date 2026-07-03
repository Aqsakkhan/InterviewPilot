const mongoose = require("mongoose");

const preferencesSchema = new mongoose.Schema(
  {
    voice: {
      autoRead: { type: Boolean, default: true },
      rate: { type: Number, default: 1, min: 0.5, max: 2 },
      pitch: { type: Number, default: 1, min: 0, max: 2 },
    },
    interview: {
      defaultDifficulty: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      defaultDurationMinutes: { type: Number, default: 20 },
      defaultCompany: { type: String, default: "" },
    },
    reduceMotion: { type: Boolean, default: false },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    name: { type: String, default: "" },
    photoURL: { type: String, default: "" },

    college: { type: String, default: "" },
    branch: { type: String, default: "" },
    graduationYear: { type: Number, default: null },
    targetRole: {
      type: String,
      enum: [
        "Frontend Developer",
        "Backend Developer",
        "Full Stack Developer",
        "SDE",
        "Data Analyst",
        "Other",
      ],
      default: "Full Stack Developer",
    },

    profileComplete: { type: Boolean, default: false },

    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
