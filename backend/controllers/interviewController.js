const Interview = require("../models/Interview");
const Resume = require("../models/Resume");
const {
  generateNextQuestion,
  evaluateInterview,
} = require("../services/geminiService");
const { buildInterviewPlan } = require("../utils/questionPlanner");
const {
  generateInterviewReportPdf,
} = require("../services/interviewReportService");

function calcTargetQuestionCount(durationMinutes) {
  // Roughly one question (with its follow-up exchange) every ~2.5 minutes.
  return Math.min(20, Math.max(4, Math.round(durationMinutes / 2.5)));
}

async function loadResumeContext(userId) {
  const resume = await Resume.findOne({ user: userId });
  if (!resume) {
    const err = new Error("Upload your resume before starting an interview.");
    err.statusCode = 400;
    throw err;
  }
  return resume;
}

/**
 * POST /api/interviews
 * Body: { type, difficulty, durationMinutes }
 */
async function createInterview(req, res, next) {
  try {
    const {
      type,
      difficulty = "intermediate",
      durationMinutes = 20,
      company = "Google",
      jobRole = "Software Engineer",
      experienceLevel = "Fresher",
    } = req.body;

    if (!type) {
      return res.status(400).json({
        message:
          "type is required (hr, technical, dsa, project_viva, full_placement).",
      });
    }

    const resume = await loadResumeContext(req.userDoc._id);
    const targetQuestionCount = calcTargetQuestionCount(durationMinutes);
    const interviewPlan = buildInterviewPlan({
      type,
      company,
      jobRole,
      experienceLevel,
      resume,
      targetQuestionCount,
    });
    const currentPlan = interviewPlan[0];

    const first = await generateNextQuestion({
      profile: req.userDoc,
      resume,
      type,
      difficulty,
      company,
      jobRole,
      experienceLevel,
      plan: currentPlan,
      history: [],
    });

    const interview = await Interview.create({
      user: req.userDoc._id,
      type,
      difficulty,
      durationMinutes,
      company,
      jobRole,
      experienceLevel,
      targetQuestionCount,
      plan: interviewPlan,
      qa: [
        {
          question: first.question,
          category: first.category,
          isFollowUp: false, // always false - nothing to follow up on yet
          answer: "",
        },
      ],
      currentIndex: 0,
      status: "in_progress",
    });

    res.status(201).json({ interview, currentQuestion: interview.qa[0] });
  } catch (err) {
    next(err);
  }
}

async function finalizeInterview(interview, userDoc) {
  const answeredQa = interview.qa.filter(
    (qa) => qa.answer && qa.answer.trim().length > 0,
  );

  const evaluation = await evaluateInterview({
    profile: userDoc,
    type: interview.type,
    difficulty: interview.difficulty,
    company: interview.company,
    jobRole: interview.jobRole,
    qaList: answeredQa.length ? answeredQa : interview.qa,
  });

  interview.evaluation = evaluation;
  interview.status = "completed";
  interview.completedAt = new Date();
  await interview.save();
  return interview;
}

/**
 * POST /api/interviews/:id/answer
 * Body: { answer }
 */
async function submitAnswer(req, res, next) {
  try {
    const { answer } = req.body;
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.userDoc._id,
    });

    if (!interview)
      return res.status(404).json({ message: "Interview not found." });
    if (interview.status !== "in_progress") {
      return res
        .status(400)
        .json({ message: "This interview has already ended." });
    }

    const idx = interview.currentIndex;
    interview.qa[idx].answer = answer || "";
    interview.qa[idx].answeredAt = new Date();

    // Persist the answer immediately. If the next Gemini call below fails,
    // the candidate's answer is already safe on reload instead of being
    // silently lost.
    await interview.save();

    const reachedTarget = interview.qa.length >= interview.targetQuestionCount;

    if (reachedTarget) {
      const finished = await finalizeInterview(interview, req.userDoc);
      return res.json({ interview: finished, isComplete: true });
    }

    const resume = await Resume.findOne({ user: req.userDoc._id });
    const currentPlan =
      interview.plan[interview.currentIndex + 1] ||
      interview.plan[interview.plan.length - 1];
    const next_ = await generateNextQuestion({
      profile: req.userDoc,
      resume,
      type: interview.type,
      difficulty: interview.difficulty,
      company: interview.company,
      jobRole: interview.jobRole,
      experienceLevel: interview.experienceLevel,
      plan: currentPlan,
      history: interview.qa,
    });
    interview.qa.push({
      question: next_.question,
      category: next_.category,
      isFollowUp: !!next_.isFollowUp,
      answer: "",
    });
    interview.currentIndex = interview.qa.length - 1;
    await interview.save();

    res.json({
      interview,
      isComplete: false,
      currentQuestion: interview.qa[interview.currentIndex],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/interviews/:id/complete
 * Lets the user end the interview early and still get a graded report.
 */
async function completeInterview(req, res, next) {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.userDoc._id,
    });
    if (!interview)
      return res.status(404).json({ message: "Interview not found." });
    if (interview.status === "completed") return res.json(interview);

    const finished = await finalizeInterview(interview, req.userDoc);
    res.json(finished);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interviews
 */
async function listInterviews(req, res, next) {
  try {
    const interviews = await Interview.find({ user: req.userDoc._id })
      .sort({ createdAt: -1 })
      .select(
        "type difficulty durationMinutes company jobRole status evaluation.overallScore createdAt completedAt",
      );
    res.json(interviews);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interviews/:id
 */
async function getInterview(req, res, next) {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.userDoc._id,
    });
    if (!interview)
      return res.status(404).json({ message: "Interview not found." });
    res.json(interview);
  } catch (err) {
    next(err);
  }
}

const ALL_ROUND_TYPES = [
  "hr",
  "technical",
  "dsa",
  "project_viva",
  "full_placement",
];

/**
 * Picks the most frequently occurring item across all completed interviews'
 * evaluation.weakAreas / strongAreas arrays - a simple "mode" aggregation
 * so the dashboard can surface one representative weak/strong skill instead
 * of just whatever the resume parser found.
 */
function mostCommon(lists) {
  const counts = new Map();
  lists.flat().forEach((item) => {
    if (!item) return;
    counts.set(item, (counts.get(item) || 0) + 1);
  });
  let best = null;
  let bestCount = 0;
  counts.forEach((count, item) => {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  });
  return best;
}

/**
 * Suggests the next interview to take: prioritizes a round type the
 * candidate hasn't tried yet, otherwise recommends the round type with the
 * lowest average score so far (their weakest practiced area).
 */
function recommendNextInterview(completed) {
  const scoresByType = new Map();
  completed.forEach((i) => {
    const score = i.evaluation?.overallScore;
    if (typeof score !== "number") return;
    const arr = scoresByType.get(i.type) || [];
    arr.push(score);
    scoresByType.set(i.type, arr);
  });

  const untried = ALL_ROUND_TYPES.find((t) => !scoresByType.has(t));
  if (untried) {
    return { type: untried, reason: "You haven't tried this round type yet." };
  }

  let weakestType = ALL_ROUND_TYPES[0];
  let weakestAvg = Infinity;
  scoresByType.forEach((scores, type) => {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg < weakestAvg) {
      weakestAvg = avg;
      weakestType = type;
    }
  });

  return {
    type: weakestType,
    reason: `Your lowest average score (${Math.round(weakestAvg)}) is in this round - worth another attempt.`,
  };
}

/**
 * GET /api/interviews/stats/summary
 */
async function getStats(req, res, next) {
  try {
    const completed = await Interview.find({
      user: req.userDoc._id,
      status: "completed",
    })
      .sort({ completedAt: 1 })
      .select(
        "evaluation.overallScore evaluation.weakAreas evaluation.strongAreas completedAt type company jobRole",
      );

    const scores = completed
      .map((i) => i.evaluation?.overallScore)
      .filter((s) => typeof s === "number");
    const averageScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const interviewReadiness = scores.length
      ? Math.round(
          scores.slice(-3).reduce((a, b) => a + b, 0) / scores.slice(-3).length,
        )
      : 0;
    const lastScore = scores.length ? scores[scores.length - 1] : null;

    const recent = completed[completed.length - 1] || null;
    const recentInterview = recent
      ? {
          id: recent._id,
          type: recent.type,
          company: recent.company,
          jobRole: recent.jobRole,
          overallScore: recent.evaluation?.overallScore ?? null,
          completedAt: recent.completedAt,
        }
      : null;

    const weakSkill = mostCommon(
      completed.map((i) => i.evaluation?.weakAreas || []),
    );
    const strongSkill = mostCommon(
      completed.map((i) => i.evaluation?.strongAreas || []),
    );

    const nextRecommendedInterview = recommendNextInterview(completed);

    // Group by ISO week for a simple weekly progress chart.
    const weekMap = new Map();
    completed.forEach((i) => {
      const d = new Date(i.completedAt);
      const weekLabel = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, "0")}`;
      const arr = weekMap.get(weekLabel) || [];
      arr.push(i.evaluation.overallScore);
      weekMap.set(weekLabel, arr);
    });

    const weeklyProgress = Array.from(weekMap.entries()).map(
      ([week, vals]) => ({
        week,
        avgScore: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
      }),
    );

    res.json({
      interviewsCompleted: completed.length,
      averageScore,
      interviewReadiness,
      lastScore,
      recentInterview,
      weakSkill,
      strongSkill,
      nextRecommendedInterview,
      weeklyProgress,
    });
  } catch (err) {
    next(err);
  }
}

function getISOWeek(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

/**
 * GET /api/interviews/stats/progress
 * Richer time-series data for the dedicated Progress page (Feature 9):
 * interview score trend, per-skill trend, company/role readiness trend,
 * and resume ATS score history.
 */
async function getProgress(req, res, next) {
  try {
    const completed = await Interview.find({
      user: req.userDoc._id,
      status: "completed",
    })
      .sort({ completedAt: 1 })
      .select(
        "type company jobRole completedAt evaluation.overallScore evaluation.technicalScore " +
          "evaluation.communicationScore evaluation.confidenceScore evaluation.problemSolvingScore " +
          "evaluation.vocabularyScore evaluation.fluencyScore evaluation.answerQualityScore " +
          "evaluation.hrScore evaluation.companyReadiness evaluation.roleReadiness",
      );

    const interviewTrend = completed.map((i) => ({
      date: i.completedAt,
      type: i.type,
      score: i.evaluation?.overallScore ?? null,
    }));

    const skillProgress = completed.map((i) => ({
      date: i.completedAt,
      technical: i.evaluation?.technicalScore ?? null,
      communication: i.evaluation?.communicationScore ?? null,
      confidence: i.evaluation?.confidenceScore ?? null,
      problemSolving: i.evaluation?.problemSolvingScore ?? null,
      vocabulary: i.evaluation?.vocabularyScore ?? null,
      fluency: i.evaluation?.fluencyScore ?? null,
      answerQuality: i.evaluation?.answerQualityScore ?? null,
      hr: i.evaluation?.hrScore ?? null,
    }));

    const companyReadinessTrend = completed
      .filter((i) => i.evaluation?.companyReadiness?.score != null)
      .map((i) => ({
        date: i.completedAt,
        company: i.company,
        score: i.evaluation.companyReadiness.score,
      }));

    const roleReadinessTrend = completed
      .filter((i) => i.evaluation?.roleReadiness?.score != null)
      .map((i) => ({
        date: i.completedAt,
        jobRole: i.jobRole,
        score: i.evaluation.roleReadiness.score,
      }));

    const resume = await Resume.findOne({ user: req.userDoc._id }).select(
      "atsScoreHistory",
    );
    const atsProgress = (resume?.atsScoreHistory || []).map((h) => ({
      date: h.recordedAt,
      atsScore: h.atsScore,
      strengthScore: h.strengthScore,
    }));

    res.json({
      interviewTrend,
      skillProgress,
      companyReadinessTrend,
      roleReadinessTrend,
      atsProgress,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interviews/:id/report/pdf
 */
async function downloadInterviewReportPdf(req, res, next) {
  try {
    const interview = await Interview.findOne({
      _id: req.params.id,
      user: req.userDoc._id,
    });

    if (!interview) {
      return res.status(404).json({ message: "Interview not found." });
    }
    if (interview.status !== "completed") {
      return res.status(400).json({
        message: "Finish this interview before downloading its report.",
      });
    }

    const pdfBuffer = await generateInterviewReportPdf(interview, req.userDoc);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interview-report-${interview._id}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createInterview,
  submitAnswer,
  completeInterview,
  listInterviews,
  getInterview,
  getStats,
  getProgress,
  downloadInterviewReportPdf,
};
