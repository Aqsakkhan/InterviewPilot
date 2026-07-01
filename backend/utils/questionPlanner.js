function buildInterviewPlan(type) {
  switch (type) {
    case "project_viva":
      return [
        {
          topic: "project",
          instruction:
            "Begin with one of the candidate's strongest resume projects. Ask about the overall architecture and purpose.",
        },
        {
          topic: "project-followup",
          instruction:
            "Ask a deeper follow-up about technical decisions, challenges, or trade-offs.",
        },
        {
          topic: "project-implementation",
          instruction:
            "Discuss implementation details, APIs, databases, or technologies used.",
        },
      ];

    case "technical":
      return [
        {
          topic: "fundamentals",
          instruction:
            "Ask a question about CS fundamentals based on the selected role.",
        },
        {
          topic: "role-specific",
          instruction:
            "Ask a practical technical question related to the selected job role.",
        },
        {
          topic: "resume-tech",
          instruction:
            "Ask about a technology mentioned in the candidate's resume.",
        },
      ];

    case "dsa":
      return [
        {
          topic: "problem-solving",
          instruction:
            "Ask a medium-level DSA reasoning question without requiring code.",
        },
        {
          topic: "optimization",
          instruction:
            "Ask how the candidate would optimize the previous solution.",
        },
      ];

    case "hr":
      return [
        {
          topic: "introduction",
          instruction: "Ask the candidate to introduce themselves naturally.",
        },
        {
          topic: "behavior",
          instruction: "Ask about teamwork, leadership or conflict resolution.",
        },
        {
          topic: "career",
          instruction: "Ask about career goals and motivation.",
        },
      ];

    default:
      return [
        {
          topic: "project",
          instruction: "Begin with a resume project.",
        },
        {
          topic: "technical",
          instruction: "Move to technical fundamentals.",
        },
        {
          topic: "dsa",
          instruction: "Ask one DSA reasoning question.",
        },
        {
          topic: "behavioral",
          instruction: "Ask one behavioral question.",
        },
      ];
  }
}

module.exports = {
  buildInterviewPlan,
};
