const { Type } = require("@google/genai");
const { COMPANY_GUIDES } = require("./interviewBlueprints");
const { ROLE_BLUEPRINTS } = require("./roleBlueprints");
const { EXPERIENCE_BLUEPRINTS } = require("./experienceBlueprints");
/* ----------------------------------------------------------------------- */
/* Resume extraction                                                        */
/* ----------------------------------------------------------------------- */

function resumeExtractionPrompt(rawText) {
  return `You are an ATS resume parser for an engineering placement-prep tool.
Read the resume text below and extract structured information. Only use
information that is actually present in the text - never invent companies,
projects, or skills that aren't there.

"Strong areas" are skills/topics the candidate clearly has solid, repeated
evidence for (multiple projects, internship experience, certifications).
"Weak areas" are common placement topics (e.g. DBMS, OS, System Design, CN,
DSA fundamentals) that are NOT well represented in the resume and the
candidate should be asked about carefully / brushed up on.

RESUME TEXT:
"""
${rawText.slice(0, 12000)}
"""`;
}

const resumeExtractionSchema = {
  type: Type.OBJECT,
  properties: {
    skills: { type: Type.ARRAY, items: { type: Type.STRING } },
    projects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["name", "description"],
      },
    },
    internships: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING },
          role: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["company", "role"],
      },
    },
    education: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          degree: { type: Type.STRING },
          institution: { type: Type.STRING },
          year: { type: Type.STRING },
        },
      },
    },
    certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
    strongAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
    weakAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["skills", "projects", "strongAreas", "weakAreas"],
};

/* ----------------------------------------------------------------------- */
/* Question generation                                                      */
/* ----------------------------------------------------------------------- */

const TYPE_BRIEF = {
  hr: "an HR round focused on background, motivation, strengths/weaknesses, teamwork and leadership stories",
  technical:
    "a technical theory round covering OOP, DBMS, OS, Computer Networks and the candidate's listed tech stack",
  dsa: "a verbal Data Structures & Algorithms round where the candidate must explain approach, complexity and trade-offs out loud (no code editor, just verbal reasoning)",
  project_viva:
    "a project viva focused entirely on the candidate's own resume projects - architecture, decisions, challenges and ownership",
  full_placement:
    "a full placement-style interview that blends HR, technical theory, DSA reasoning and project viva questions, the way a real campus placement panel would",
};

function questionGenerationPrompt({
  profile,
  resume,
  type,
  difficulty,
  company,
  jobRole,
  experienceLevel,
  history,
}) {
  const companyGuide =
    COMPANY_GUIDES[company] ||
    "Conduct a balanced software engineering interview.";
  const roleGuide =
    ROLE_BLUEPRINTS[jobRole]?.focus.join(", ") ||
    "General software engineering concepts";
  const experienceGuide = EXPERIENCE_BLUEPRINTS[experienceLevel] || {
    focus: ["General software engineering"],
    difficulty: "Keep the interview balanced.",
  };
  const historyText = history.length
    ? history
        .map(
          (h, i) =>
            `Q${i + 1} [${h.category}]: ${h.question}\nCandidate's answer: ${h.answer || "(no answer recorded)"}`,
        )
        .join("\n\n")
    : "(This is the first question - there is no history yet.)";

  return `You are an experienced, professional AI placement interviewer
running ${TYPE_BRIEF[type] || TYPE_BRIEF.full_placement}.
Difficulty level: ${difficulty}.
Target Company: ${company}
Target Job Role: ${jobRole}
Role Focus: ${roleGuide}
Experience Focus: ${experienceGuide.focus.join(", ")}
Interview Depth: ${experienceGuide.difficulty}
Candidate Experience Level: ${experienceLevel}

==============================
COMPANY INTERVIEW GUIDE
==============================

${companyGuide}

==============================
END OF COMPANY GUIDE
==============================

CANDIDATE PROFILE
Target role: ${profile.targetRole}
Branch: ${profile.branch || "Not specified"}

CANDIDATE RESUME SUMMARY
Skills: ${(resume.skills || []).join(", ") || "Not specified"}
Projects: ${(resume.projects || []).map((p) => p.name).join(", ") || "Not specified"}
Internships: ${(resume.internships || []).map((i) => `${i.role} at ${i.company}`).join(", ") || "None"}
Strong areas: ${(resume.strongAreas || []).join(", ") || "Unknown"}
Weak areas: ${(resume.weakAreas || []).join(", ") || "Unknown"}

INTERVIEW SO FAR
${historyText}

YOUR TASK

You are interviewing this candidate exactly as an interviewer from
${company} hiring a ${jobRole} would.

Adjust the interview style based on:

• Company
• Job Role
• Candidate Experience Level
• Resume
• Previous answers

Examples:

- Google → deep problem solving, scalability, reasoning
- Amazon → Leadership Principles + ownership + system thinking
- Microsoft → practical engineering + collaboration
- JP Morgan → Java, Spring Boot, SQL, backend, finance scenarios
- Goldman Sachs → DSA + CS fundamentals + optimization
- Deloitte / Accenture → practical coding, OOP, SQL, communication
- TCS / Infosys / Wipro / Capgemini → CS fundamentals + aptitude-style technical questions
- Product companies → deeper technical discussions
- Service companies → implementation and fundamentals

Question selection priority:

1. Resume Projects
2. Internship Experience
3. Target Job Role
4. Company Expectations
5. Strong Areas
6. Weak Areas

If the previous answer was weak,
ask a follow-up instead of changing the topic.

Only ask ONE natural interview question.

Do not mention that you are AI.

Do not number the question.

Return only valid JSON.`;
}

const questionGenerationSchema = {
  type: Type.OBJECT,
  properties: {
    question: { type: Type.STRING },
    category: {
      type: Type.STRING,
      enum: ["dsa", "hr", "project", "theory", "general"],
    },
  },
  required: ["question", "category"],
};

/* ----------------------------------------------------------------------- */
/* Evaluation                                                               */
/* ----------------------------------------------------------------------- */

function evaluationPrompt({ profile, type, difficulty, qaList }) {
  const transcript = qaList
    .map(
      (qa, i) =>
        `Q${i + 1} [${qa.category}]: ${qa.question}\nA${i + 1}: ${qa.answer || "(skipped / no answer)"}`,
    )
    .join("\n\n");

  return `You are grading a placement-prep mock interview transcript.
Round type: ${type} | Difficulty: ${difficulty} | Target role: ${profile.targetRole}.

TRANSCRIPT
${transcript}

Score the candidate from 0-100 on each axis below (be honest and specific,
do not default to a flat 70 for everything - reward real depth, penalize
vague or generic answers). If an axis genuinely does not apply to this round
type, still give your best estimate rather than leaving it out.

- technicalScore: depth and correctness of technical/domain content
- communicationScore: clarity, structure, articulation
- confidenceScore: how assured and decisive the answers sounded
- dsaScore: problem-solving / algorithmic reasoning quality (estimate even outside DSA rounds if any reasoning was tested)
- hrScore: behavioral/HR quality - self-awareness, motivation, teamwork signal
- overallScore: your holistic 0-100 readiness score for this round

Then give:
- strengths: 2-4 short, specific, evidence-based bullet points
- improvements: 2-4 short, specific, actionable bullet points
- summary: 2-3 sentence overall summary in a constructive, encouraging but honest tone`;
}

const evaluationSchema = {
  type: Type.OBJECT,
  properties: {
    technicalScore: { type: Type.NUMBER },
    communicationScore: { type: Type.NUMBER },
    confidenceScore: { type: Type.NUMBER },
    dsaScore: { type: Type.NUMBER },
    hrScore: { type: Type.NUMBER },
    overallScore: { type: Type.NUMBER },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
  },
  required: [
    "technicalScore",
    "communicationScore",
    "confidenceScore",
    "dsaScore",
    "hrScore",
    "overallScore",
    "strengths",
    "improvements",
    "summary",
  ],
};

module.exports = {
  resumeExtractionPrompt,
  resumeExtractionSchema,
  questionGenerationPrompt,
  questionGenerationSchema,
  evaluationPrompt,
  evaluationSchema,
};
