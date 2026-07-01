function buildInterviewPlan(type) {
  switch (type) {
    case "project_viva":
      return [
        {
          step: 1,
          topic: "project",
          instruction:
            "Begin with one of the candidate's strongest resume projects. Ask about the overall architecture and purpose.",
        },
        {
          step: 2,
          topic: "project-followup",
          instruction:
            "Ask a deeper follow-up about technical decisions, challenges, or trade-offs.",
        },
        {
          step: 3,
          topic: "project-implementation",
          instruction:
            "Discuss implementation details, APIs, databases, or technologies used.",
        },
      ];

    case "technical":
      return [
        {
          step: 1,
          topic: "fundamentals",
          instruction:
            "Ask a question about CS fundamentals based on the selected role.",
        },
        {
          step: 2,
          topic: "role-specific",
          instruction:
            "Ask a practical technical question related to the selected job role.",
        },
        {
          step: 3,
          topic: "resume-tech",
          instruction:
            "Ask about a technology mentioned in the candidate's resume.",
        },
      ];

    case "dsa":
      return [
        {
          step: 1,
          topic: "problem-solving",
          instruction:
            "Ask a medium-level DSA reasoning question without requiring code.",
        },
        {
          step: 2,
          topic: "optimization",
          instruction:
            "Ask how the candidate would optimize the previous solution.",
        },
      ];

    case "hr":
      return [
        {
          step: 1,
          topic: "introduction",
          instruction: "Ask the candidate to introduce themselves naturally.",
        },
        {
          step: 2,
          topic: "behavior",
          instruction: "Ask about teamwork, leadership or conflict resolution.",
        },
        {
          step: 3,
          topic: "career",
          instruction: "Ask about career goals and motivation.",
        },
      ];

    default:
      return [
        {
          step: 1,
          topic: "project",
          instruction:
            "Begin with one of the candidate's strongest resume projects. Ask about the overall architecture and purpose.",
        },
        {
          step: 2,
          topic: "technical",
          instruction:
            "Ask a technical question related to the candidate's selected job role.",
        },
        {
          step: 3,
          topic: "dsa",
          instruction: "Ask one medium-level DSA reasoning question.",
        },
        {
          step: 4,
          topic: "behavioral",
          instruction:
            "Ask one behavioral question about teamwork, leadership or communication.",
        },
      ];
  }
}

module.exports = {
  buildInterviewPlan,
};
