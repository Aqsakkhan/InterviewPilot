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

const COMPANY_TOPICS = {
  Google: ["System Design", "Scalability", "Algorithms"],
  Microsoft: ["OOP", "System Design", "Problem Solving"],
  Amazon: ["Leadership Principles", "Scalability", "REST APIs"],
  Meta: ["Algorithms", "Distributed Systems", "Performance"],
  Apple: ["Architecture", "Performance", "Debugging"],
  Netflix: ["Distributed Systems", "Caching", "Performance"],
  Adobe: ["OOP", "Design Patterns", "Projects"],
  Oracle: ["SQL", "Database Design", "Transactions"],
  Salesforce: ["Cloud", "APIs", "Database"],
  "JP Morgan Chase": ["Java", "Spring Boot", "SQL"],
  "Goldman Sachs": ["DSA", "Java", "Optimization"],
  Deloitte: ["OOP", "DBMS", "Communication"],
  Accenture: ["Projects", "SQL", "OOP"],
  Infosys: ["OS", "DBMS", "CN"],
  TCS: ["OOP", "DBMS", "Aptitude"],
};

/**
 * Extends a short base plan out to `targetLength` steps by cycling through
 * a pool of topics (role topics, company topics, resume weak areas) instead
 * of letting the interview controller repeat the final base step forever.
 * Alternates between introducing a new topic and asking a deeper follow-up
 * on it, so longer interviews still feel progressive rather than repetitive.
 */
function extendPlan(baseSteps, targetLength, topicPool) {
  if (baseSteps.length >= targetLength) return baseSteps;

  const usedTopics = new Set(baseSteps.map((s) => s.topic));
  const pool = topicPool.filter(Boolean);
  const uniquePool = [...new Set(pool)];
  // Prefer topics not already covered by the base plan; if we run out,
  // cycle back through the full pool so we still vary the wording.
  const rotation = uniquePool.filter((t) => !usedTopics.has(t));
  const fallbackRotation = uniquePool.length ? uniquePool : ["general"];

  const steps = [...baseSteps];
  let cursor = 0;

  while (steps.length < targetLength) {
    const source = rotation.length ? rotation : fallbackRotation;
    const topic = source[cursor % source.length];
    const isFollowUp = steps.length % 2 === 1;
    cursor += 1;

    steps.push({
      step: steps.length + 1,
      topic,
      instruction: isFollowUp
        ? `Ask a deeper follow-up question that builds on the candidate's previous answer, staying related to ${topic}.`
        : `Move on to a new question focused on ${topic}.`,
    });
  }

  return steps;
}

function buildInterviewPlan({
  type,
  company,
  jobRole,
  experienceLevel,
  resume,
  targetQuestionCount,
}) {
  const topics = ROLE_TOPICS[jobRole] || ROLE_TOPICS["Software Engineer"];
  const companyTopics = COMPANY_TOPICS[company] || [];
  const weakAreas = resume?.weakAreas || [];
  const topicPool = [...topics, ...companyTopics, ...weakAreas];

  const basePlan = buildBasePlan({
    type,
    company,
    jobRole,
    topics,
    companyTopics,
  });

  if (!targetQuestionCount) return basePlan;

  return extendPlan(basePlan, targetQuestionCount, topicPool);
}

function buildBasePlan({ type, topics, companyTopics }) {
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
          topic: companyTopics[0] || topics[1],
          instruction: `Ask a practical question related to ${
            companyTopics[0] || topics[1]
          }.`,
        },
        {
          step: 4,
          topic: companyTopics[1] || topics[2],
          instruction: `Ask a deeper follow-up about ${
            companyTopics[1] || topics[2]
          }.`,
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
