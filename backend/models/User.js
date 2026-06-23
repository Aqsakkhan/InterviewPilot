const mongoose = require("mongoose");

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
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
