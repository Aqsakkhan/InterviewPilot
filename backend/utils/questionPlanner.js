const ROLE_TOPICS = {
  "Software Engineer": [
    "OOP",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
    "System Design",
  ],

  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Browser Performance",
  ],

  "Backend Developer": ["Node.js", "Express", "REST APIs", "MongoDB", "SQL"],

  "Full Stack Developer": [
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "System Design",
  ],

  "Java Developer": [
    "Java",
    "OOP",
    "Spring Boot",
    "Collections",
    "Multithreading",
  ],

  "Python Developer": ["Python", "Flask", "Django", "REST APIs", "SQL"],

  "Data Analyst": ["SQL", "Python", "Pandas", "Excel", "Power BI"],

  "Data Scientist": [
    "Machine Learning",
    "Python",
    "Statistics",
    "Deep Learning",
    "SQL",
  ],

  "ML Engineer": [
    "Machine Learning",
    "Deep Learning",
    "MLOps",
    "Python",
    "Deployment",
  ],

  "DevOps Engineer": ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS"],
};

module.exports = {
  ROLE_TOPICS,
};

function buildInterviewPlan({
  type,
  company,
  jobRole,
  experienceLevel,
  resume,
}) {
  const topics = ROLE_TOPICS[jobRole] || ROLE_TOPICS["Software Engineer"];

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
            "Start with one of the candidate's strongest resume projects.",
        },
        {
          step: 2,
          topic: topics[0],
          instruction: `Ask a question focused on ${topics[0]}.`,
        },
        {
          step: 3,
          topic: topics[1],
          instruction: `Ask a practical question related to ${topics[1]}.`,
        },
        {
          step: 4,
          topic: topics[2],
          instruction: `Ask a deeper follow-up about ${topics[2]}.`,
        },
        {
          step: 5,
          topic: "behavioral",
          instruction: "Ask one behavioral question.",
        },
      ];
  }
}

module.exports = {
  buildInterviewPlan,
};
