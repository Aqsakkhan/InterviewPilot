const EXPERIENCE_BLUEPRINTS = {
  Fresher: {
    focus: [
      "Resume Projects",
      "Fundamental Concepts",
      "Problem Solving",
      "Internship Experience",
      "Communication",
    ],
    difficulty: "Keep questions beginner to intermediate.",
  },

  "0-1 Years": {
    focus: [
      "Projects",
      "Practical Development",
      "Debugging",
      "REST APIs",
      "Database Design",
    ],
    difficulty: "Ask practical implementation questions.",
  },

  "1-3 Years": {
    focus: [
      "Production Experience",
      "System Design Basics",
      "Optimization",
      "Architecture Decisions",
    ],
    difficulty: "Mix practical coding with design discussions.",
  },

  "3-5 Years": {
    focus: [
      "System Design",
      "Scalability",
      "Leadership",
      "Architecture",
      "Mentoring",
    ],
    difficulty: "Ask advanced architecture and leadership questions.",
  },
};

module.exports = {
  EXPERIENCE_BLUEPRINTS,
};
