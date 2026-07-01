/**
 * resumeAnalysisService.js
 * ─────────────────────────────────────────────────────────────────────────
 * Pure, deterministic resume scoring engine.
 * No AI calls — runs instantly, costs nothing, always consistent.
 *
 * Two separate scores:
 *   ATS Score      — how well the resume survives an ATS screener
 *   Strength Score — how rich and diverse the resume's actual content is
 *
 * Also produces:
 *   • Skill categorization  (languages / frameworks / databases / cloud / tools)
 *   • Soft-skill detection
 *   • Role-keyword matching + gap list
 *   • Experience-level label
 *   • Improvement suggestions + top-3 tips
 */

/* ── Role keyword maps ── */
const ROLE_KEYWORDS = {
  "Frontend Developer": [
    "javascript",
    "typescript",
    "react",
    "vue",
    "angular",
    "html",
    "css",
    "tailwind",
    "redux",
    "next.js",
    "webpack",
    "responsive design",
    "rest api",
    "accessibility",
    "figma",
  ],
  "Backend Developer": [
    "node.js",
    "express",
    "java",
    "spring",
    "python",
    "django",
    "flask",
    "rest api",
    "graphql",
    "sql",
    "postgresql",
    "mongodb",
    "redis",
    "docker",
    "microservices",
    "authentication",
  ],
  "Full Stack Developer": [
    "javascript",
    "react",
    "node.js",
    "express",
    "html",
    "css",
    "sql",
    "mongodb",
    "rest api",
    "git",
    "authentication",
    "docker",
    "responsive design",
    "redux",
    "typescript",
  ],
  SDE: [
    "data structures",
    "algorithms",
    "system design",
    "object oriented programming",
    "git",
    "testing",
    "ci/cd",
    "cloud",
    "aws",
    "docker",
    "kubernetes",
    "sql",
    "problem solving",
  ],
  "Data Analyst": [
    "sql",
    "excel",
    "python",
    "power bi",
    "tableau",
    "data visualization",
    "statistics",
    "pandas",
    "numpy",
    "etl",
    "data cleaning",
    "a/b testing",
    "dashboards",
  ],
  Other: [
    "communication",
    "problem solving",
    "teamwork",
    "git",
    "sql",
    "microsoft office",
    "leadership",
  ],
};

/* ── Skill category keyword lists ── */
const SKILL_CATEGORY_KEYWORDS = {
  languages: [
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "golang",
    "ruby",
    "php",
    "kotlin",
    "swift",
    "scala",
    "dart",
    "rust",
    "r",
    "bash",
    "sql",
  ],
  frameworks: [
    "react",
    "angular",
    "vue",
    "node.js",
    "express",
    "django",
    "flask",
    "spring",
    "next.js",
    "nestjs",
    "tailwind",
    "bootstrap",
    ".net",
    "laravel",
    "fastapi",
    "redux",
    "svelte",
    "nuxt",
  ],
  databases: [
    "mongodb",
    "mysql",
    "postgresql",
    "sqlite",
    "redis",
    "firebase",
    "oracle",
    "dynamodb",
    "cassandra",
    "supabase",
    "mariadb",
  ],
  cloudDevops: [
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "jenkins",
    "git",
    "github actions",
    "ci/cd",
    "terraform",
    "linux",
    "nginx",
    "ansible",
  ],
  tools: [
    "figma",
    "postman",
    "jira",
    "vs code",
    "webpack",
    "vite",
    "npm",
    "yarn",
    "excel",
    "power bi",
    "tableau",
    "notion",
    "slack",
    "trello",
  ],
};

/* ── Soft skills to detect in raw text ── */
const SOFT_SKILLS = [
  "leadership",
  "teamwork",
  "communication",
  "collaboration",
  "problem solving",
  "problem-solving",
  "time management",
  "adaptability",
  "ownership",
  "mentoring",
  "public speaking",
  "critical thinking",
  "creativity",
  "conflict resolution",
  "decision making",
  "initiative",
];

/* ── Helpers ── */

function lower(v) {
  return String(v || "").toLowerCase();
}
function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function round1(v) {
  return Math.round(v * 10) / 10;
}

/** Single large lowercase haystack to search across all resume text. */
function buildHaystack({ skills, projects, experience, rawText }) {
  return lower(
    [
      ...(skills || []),
      ...(projects || []).flatMap((p) => [
        p.name,
        p.description,
        ...(p.techStack || []),
      ]),
      ...(experience || []).flatMap((e) => [e.role, e.company, e.description]),
      rawText || "",
    ]
      .filter(Boolean)
      .join(" \n "),
  );
}

/**
 * Word-boundary regex match.
 * Prevents short keywords ("go","r","c") from false-positiving inside
 * longer words ("mongodb","express","react").
 */
function escapeRegex(v) {
  return v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function kwMatch(haystack, keyword) {
  return new RegExp(`\\b${escapeRegex(keyword.trim())}\\b`, "i").test(haystack);
}

/* ── Scoring sub-functions ── */

function categorizeSkills(skills = []) {
  const cats = {
    languages: [],
    frameworks: [],
    databases: [],
    cloudDevops: [],
    tools: [],
    other: [],
  };
  for (const skill of skills) {
    const needle = lower(skill).trim();
    if (!needle) continue;
    const matched = Object.entries(SKILL_CATEGORY_KEYWORDS).find(([, kws]) =>
      kws.some((kw) => needle === kw || kwMatch(needle, kw)),
    )?.[0];
    cats[matched || "other"].push(skill);
  }
  return cats;
}

function detectSoftSkills(haystack) {
  return SOFT_SKILLS.filter((s) => haystack.includes(s));
}

function matchRoleKeywords(haystack, targetRole) {
  const keywords = ROLE_KEYWORDS[targetRole] || ROLE_KEYWORDS.Other;
  const matched = [],
    missing = [];
  for (const kw of keywords) {
    (haystack.includes(kw) ? matched : missing).push(kw);
  }
  return { matched, missing, total: keywords.length };
}

function countQuantifiable({ projects = [], experience = [] }) {
  return [...projects, ...experience]
    .map((e) => e.description)
    .filter((d) => d && /\d/.test(d)).length;
}

function avgDescWords({ projects = [], experience = [] }) {
  const descs = [...projects, ...experience]
    .map((e) => e.description)
    .filter(Boolean);
  if (!descs.length) return 0;
  return (
    descs.reduce((s, d) => s + d.trim().split(/\s+/).length, 0) / descs.length
  );
}

/**
 * ATS Score (0-100)
 * Weights: contact(10) + skills(20) + projects(20) + experience(15)
 *          + education(10) + certs(5) + quantifiable(10) + keywords(10)
 */
function computeAtsScore({ resume, matched, total, quantifiable }) {
  const {
    email,
    phone,
    skills = [],
    projects = [],
    experience = [],
    education = [],
    certifications = [],
  } = resume;
  const s =
    (email ? 5 : 0) +
    (phone ? 5 : 0) +
    (clamp(skills.length, 0, 10) / 10) * 20 +
    (clamp(projects.length, 0, 3) / 3) * 10 +
    (projects.some((p) => (p.description || "").length > 60) ? 10 : 0) +
    (clamp(experience.length, 0, 2) / 2) * 15 +
    (education.length > 0 ? 10 : 0) +
    (clamp(certifications.length, 0, 2) / 2) * 5 +
    (clamp(quantifiable, 0, 4) / 4) * 10 +
    (total ? (matched.length / total) * 10 : 0);
  return clamp(round1(s), 0, 100);
}

/**
 * Strength Score (0-100)
 * Weights: skill-category breadth(25) + tech diversity(25)
 *          + experience depth(25) + description quality(25)
 */
function computeStrengthScore({ resume, skillCategories, avgWords }) {
  const { projects = [], experience = [] } = resume;
  const coveredCats = Object.entries(skillCategories).filter(
    ([k, v]) => k !== "other" && v.length > 0,
  ).length;
  const uniqueTech = new Set(
    projects.flatMap((p) => (p.techStack || []).map(lower)),
  ).size;
  const s =
    (coveredCats / 5) * 25 +
    (clamp(uniqueTech, 0, 8) / 8) * 25 +
    (clamp(experience.length, 0, 3) / 3) * 25 +
    (clamp(avgWords, 0, 40) / 40) * 25;
  return clamp(round1(s), 0, 100);
}

function detectExperienceLevel({ experience = [], projects = [] }) {
  if (experience.length >= 2)
    return "Experienced (Multiple Internships / Roles)";
  if (experience.length === 1)
    return "Some Practical Experience (1 Internship / Role)";
  if (projects.length >= 3) return "Fresher with Strong Project Work";
  return "Fresher — Limited Practical Evidence";
}

function buildSuggestions({
  resume,
  atsScore,
  missing,
  quantifiable,
  softSkills,
  targetRole,
}) {
  const {
    email,
    phone,
    skills = [],
    projects = [],
    certifications = [],
  } = resume;
  const tips = [];
  if (atsScore < 60)
    tips.push(
      "Your resume may struggle with ATS — work through the items below.",
    );
  if (!email) tips.push("Add a professional email address near the top.");
  if (!phone)
    tips.push("Add a phone number so recruiters can reach you directly.");
  if (skills.length < 5)
    tips.push("List at least 5–8 relevant technical skills.");
  if (projects.length < 2)
    tips.push(
      "Add at least 2 projects with clear outcomes and your specific role.",
    );
  if (quantifiable === 0)
    tips.push(
      'Add measurable results to bullet points (e.g. "reduced load time by 30%").',
    );
  if (certifications.length === 0)
    tips.push("Consider adding at least one relevant certification or course.");
  if (missing.length > 0)
    tips.push(
      `Consider learning or adding: ${missing.slice(0, 5).join(", ")} — commonly expected for ${targetRole} roles.`,
    );
  if (softSkills.length === 0)
    tips.push(
      "Mention soft skills (teamwork, communication, leadership) in your descriptions.",
    );
  return tips;
}

/* ── Public API ── */

/**
 * @param {object} resume  - Resume document fields
 * @param {string} targetRole - User.targetRole enum value
 * @returns {object} analysis block ready to store on Resume.analysis
 */
function computeResumeAnalysis(resume, targetRole = "Other") {
  const safe = {
    email: resume.email || "",
    phone: resume.phone || "",
    skills: resume.skills || [],
    projects: resume.projects || [],
    experience: resume.experience || resume.internships || [],
    education: resume.education || [],
    certifications: resume.certifications || [],
    rawText: resume.rawText || "",
  };

  const haystack = buildHaystack(safe);
  const skillCats = categorizeSkills(safe.skills);
  const softSkills = detectSoftSkills(haystack);
  const { matched, missing, total } = matchRoleKeywords(haystack, targetRole);
  const quantifiable = countQuantifiable(safe);
  const avgWords = avgDescWords(safe);

  const atsScore = computeAtsScore({
    resume: safe,
    matched,
    total,
    quantifiable,
  });
  const strengthScore = computeStrengthScore({
    resume: safe,
    skillCategories: skillCats,
    avgWords,
  });
  const expLevel = detectExperienceLevel(safe);
  const suggestions = buildSuggestions({
    resume: safe,
    atsScore,
    missing,
    quantifiable,
    softSkills,
    targetRole,
  });

  return {
    atsScore,
    strengthScore,
    experienceLevel: expLevel,
    skillCategories: skillCats,
    softSkillsDetected: softSkills,
    matchedKeywords: matched,
    missingSkills: missing,
    suggestions,
    improvementTips: suggestions.slice(0, 3),
    targetRole,
    analyzedAt: new Date(),
  };
}

module.exports = { computeResumeAnalysis, ROLE_KEYWORDS, SOFT_SKILLS };
