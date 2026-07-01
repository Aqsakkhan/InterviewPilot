/**
 * Resume Match Engine
 *
 * Calculates:
 * - Overall ATS Score
 * - Company Match Score
 * - Role Match Score
 * - Missing Skills
 * - Missing Keywords
 * - Resume Suggestions
 */

const ROLE_SKILLS = {
  "Software Engineer": [
    "Java",
    "Python",
    "JavaScript",
    "DSA",
    "OOP",
    "DBMS",
    "Operating Systems",
    "Computer Networks",
  ],

  "Frontend Developer": [
    "HTML",
    "CSS",
    "JavaScript",
    "React",
    "Redux",
    "Tailwind CSS",
  ],

  "Backend Developer": [
    "Node.js",
    "Express.js",
    "MongoDB",
    "SQL",
    "REST API",
    "JWT",
    "Authentication",
  ],

  "Full Stack Developer": [
    "React",
    "Node.js",
    "Express.js",
    "MongoDB",
    "REST API",
    "JavaScript",
  ],

  "Java Developer": [
    "Java",
    "Spring Boot",
    "Hibernate",
    "Collections",
    "SQL",
    "OOP",
  ],

  "Python Developer": ["Python", "Django", "Flask", "REST API", "SQL"],

  "AI / ML Engineer": [
    "Python",
    "Machine Learning",
    "Deep Learning",
    "TensorFlow",
    "PyTorch",
    "LLMs",
  ],
};

const COMPANY_SKILLS = {
  Google: [
    "DSA",
    "Algorithms",
    "System Design",
    "Scalability",
    "Problem Solving",
  ],

  Amazon: [
    "Leadership",
    "REST API",
    "Scalability",
    "Microservices",
    "Ownership",
  ],

  Microsoft: ["OOP", "Problem Solving", "System Design", "Azure"],

  Meta: ["React", "Performance", "JavaScript", "Distributed Systems"],

  Apple: ["Swift", "Architecture", "Performance", "Debugging"],

  Netflix: ["Distributed Systems", "Caching", "Performance", "AWS"],

  Oracle: ["SQL", "Database", "Java", "PL/SQL"],

  Deloitte: ["Java", "SQL", "OOP", "Communication"],

  Accenture: ["SQL", "OOP", "Projects", "Communication"],

  Infosys: ["DBMS", "Operating Systems", "Computer Networks", "OOP"],

  TCS: ["DBMS", "OOP", "Computer Networks", "SQL"],

  "JP Morgan Chase": ["Java", "Spring Boot", "SQL", "REST API"],

  "Goldman Sachs": ["Java", "DSA", "SQL", "Problem Solving"],
};

function matchSkills(resumeSkills, requiredSkills) {
  if (!requiredSkills.length) {
    return {
      score: 0,
      matched: [],
      missing: [],
    };
  }

  const normalizedResumeSkills = resumeSkills.map((skill) =>
    skill.toLowerCase(),
  );

  const matched = [];
  const missing = [];

  requiredSkills.forEach((skill) => {
    if (normalizedResumeSkills.includes(skill.toLowerCase())) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  });

  const score = Math.round((matched.length / requiredSkills.length) * 100);

  return {
    score,
    matched,
    missing,
  };
}

function calculateRoleMatch(resume, jobRole) {
  const requiredSkills = ROLE_SKILLS[jobRole] || [];

  return matchSkills(resume.skills || [], requiredSkills);
}

function calculateCompanyMatch(resume, company) {
  const requiredSkills = COMPANY_SKILLS[company] || [];

  return matchSkills(resume.skills || [], requiredSkills);
}

function calculateOverallScore(resume, company, jobRole) {
  const roleMatch = calculateRoleMatch(resume, jobRole);
  const companyMatch = calculateCompanyMatch(resume, company);

  const score = Math.round(roleMatch.score * 0.6 + companyMatch.score * 0.4);

  return {
    score,
    roleMatch,
    companyMatch,
  };
}

function findMissingSkills(resume, company, jobRole) {
  const roleMatch = calculateRoleMatch(resume, jobRole);
  const companyMatch = calculateCompanyMatch(resume, company);

  return [...new Set([...roleMatch.missing, ...companyMatch.missing])];
}

function findMissingKeywords(resume, company, jobRole) {
  return findMissingSkills(resume, company, jobRole);
}

function generateSuggestions(resume, company, jobRole) {
  const missing = findMissingSkills(resume, company, jobRole);

  return missing.slice(0, 5).map((skill) => ({
    title: `Improve ${skill}`,
    description: `Add projects or experience related to ${skill} if you have worked with it.`,
  }));
}
module.exports = {
  calculateOverallScore,
  calculateCompanyMatch,
  calculateRoleMatch,
  findMissingSkills,
  findMissingKeywords,
  generateSuggestions,
};
