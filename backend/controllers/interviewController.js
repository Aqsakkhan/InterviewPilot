const Interview = require("../models/Interview");
const Resume = require("../models/Resume");
const { generateNextQuestion, evaluateInterview } = require("../services/geminiService");

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
    const { type, difficulty = "intermediate", durationMinutes = 20 } = req.body;

    if (!type) {
      return res.status(400).json({ message: "type is required (hr, technical, dsa, project_viva, full_placement)." });
    }

    const resume = await loadResumeContext(req.userDoc._id);
    const targetQuestionCount = calcTargetQuestionCount(durationMinutes);

    const first = await generateNextQuestion({
      profile: req.userDoc,
      resume,
      type,
      difficulty,
      history: [],
    });

    const interview = await Interview.create({
      user: req.userDoc._id,
      type,
      difficulty,
      durationMinutes,
      targetQuestionCount,
      qa: [{ question: first.question, category: first.category, answer: "" }],
      currentIndex: 0,
      status: "in_progress",
    });

    res.status(201).json({ interview, currentQuestion: interview.qa[0] });
  } catch (err) {
    next(err);
  }
}

async function finalizeInterview(interview, userDoc) {
  const answeredQa = interview.qa.filter((qa) => qa.answer && qa.answer.trim().length > 0);

  const evaluation = await evaluateInterview({
    profile: userDoc,
    type: interview.type,
    difficulty: interview.difficulty,
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
    const interview = await Interview.findOne({ _id: req.params.id, user: req.userDoc._id });

    if (!interview) return res.status(404).json({ message: "Interview not found." });
    if (interview.status !== "in_progress") {
      return res.status(400).json({ message: "This interview has already ended." });
    }

    const idx = interview.currentIndex;
    interview.qa[idx].answer = answer || "";
    interview.qa[idx].answeredAt = new Date();

    const reachedTarget = interview.qa.length >= interview.targetQuestionCount;

    if (reachedTarget) {
      await interview.save();
      const finished = await finalizeInterview(interview, req.userDoc);
      return res.json({ interview: finished, isComplete: true });
    }

    const resume = await Resume.findOne({ user: req.userDoc._id });
    const next_ = await generateNextQuestion({
      profile: req.userDoc,
      resume,
      type: interview.type,
      difficulty: interview.difficulty,
      history: interview.qa,
    });

    interview.qa.push({ question: next_.question, category: next_.category, answer: "" });
    interview.currentIndex = interview.qa.length - 1;
    await interview.save();

    res.json({ interview, isComplete: false, currentQuestion: interview.qa[interview.currentIndex] });
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
    const interview = await Interview.findOne({ _id: req.params.id, user: req.userDoc._id });
    if (!interview) return res.status(404).json({ message: "Interview not found." });
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
      .select("type difficulty durationMinutes status evaluation.overallScore createdAt completedAt");
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
    const interview = await Interview.findOne({ _id: req.params.id, user: req.userDoc._id });
    if (!interview) return res.status(404).json({ message: "Interview not found." });
    res.json(interview);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/interviews/stats/summary
 */
async function getStats(req, res, next) {
  try {
    const completed = await Interview.find({ user: req.userDoc._id, status: "completed" })
      .sort({ completedAt: 1 })
      .select("evaluation.overallScore completedAt type");

    const scores = completed.map((i) => i.evaluation?.overallScore).filter((s) => typeof s === "number");
    const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const interviewReadiness = scores.length
      ? Math.round(scores.slice(-3).reduce((a, b) => a + b, 0) / scores.slice(-3).length)
      : 0;

    // Group by ISO week for a simple weekly progress chart.
    const weekMap = new Map();
    completed.forEach((i) => {
      const d = new Date(i.completedAt);
      const weekLabel = `${d.getFullYear()}-W${String(getISOWeek(d)).padStart(2, "0")}`;
      const arr = weekMap.get(weekLabel) || [];
      arr.push(i.evaluation.overallScore);
      weekMap.set(weekLabel, arr);
    });

    const weeklyProgress = Array.from(weekMap.entries()).map(([week, vals]) => ({
      week,
      avgScore: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }));

    res.json({
      interviewsCompleted: completed.length,
      averageScore,
      interviewReadiness,
      weeklyProgress,
    });
  } catch (err) {
    next(err);
  }
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

module.exports = {
  createInterview,
  submitAnswer,
  completeInterview,
  listInterviews,
  getInterview,
  getStats,
};
