/**
 * interviewReportService.js
 * ─────────────────────────────────────────────────────────────────────────
 * Generates a downloadable PDF of a completed interview's performance
 * report using pdfkit. Streamed entirely in memory — no temp files.
 * Mirrors resumeReportService.js's layout helpers and color tokens so
 * both PDFs feel like the same product.
 */

const PDFDocument = require("pdfkit");

/* ── Design tokens (kept identical to resumeReportService.js) ── */
const C = {
  heading: "#0a0e1a",
  accent: "#3d6bff",
  text: "#1f2937",
  muted: "#6b7280",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
  divider: "#e5e7eb",
};

function scoreColor(score) {
  if (score >= 75) return C.success;
  if (score >= 50) return C.warning;
  return C.danger;
}

/* ── Layout helpers ── */

function addDivider(doc) {
  doc.moveDown(0.5);
  doc
    .strokeColor(C.divider)
    .lineWidth(0.5)
    .moveTo(50, doc.y)
    .lineTo(doc.page.width - 50, doc.y)
    .stroke();
  doc.moveDown(0.5);
}

function sectionTitle(doc, title) {
  doc.moveDown(0.8);
  doc
    .fontSize(12)
    .fillColor(C.accent)
    .text(title.toUpperCase(), { characterSpacing: 0.5 });
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor(C.text);
}

function bulletList(doc, items, fallback) {
  if (!items || !items.length) {
    doc.fillColor(C.muted).text(fallback || "None recorded.");
    return;
  }
  items.forEach((item) => {
    doc.fillColor(C.text).text(`• ${item}`, { indent: 10 });
  });
}

function chipLine(doc, items, fallback) {
  if (!items || !items.length) {
    doc.fillColor(C.muted).text(fallback || "None.");
    return;
  }
  doc.fillColor(C.text).text(items.join("  ·  "), { lineGap: 3 });
}

function scoreLine(doc, label, score) {
  if (score == null) return;
  doc
    .fontSize(10)
    .fillColor(scoreColor(score))
    .text(`${label.padEnd(20, " ")} ${Math.round(score)} / 100`);
}

/**
 * @param {object} interview - Mongoose Interview document (must be completed)
 * @param {object} user      - Mongoose User document
 * @returns {Promise<Buffer>}
 */
function generateInterviewReportPdf(interview, user) {
  return new Promise((resolve, reject) => {
    const evalData = interview.evaluation;

    if (!evalData || evalData.overallScore == null) {
      const err = new Error("This interview has not been evaluated yet.");
      err.statusCode = 404;
      return reject(err);
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
      autoFirstPage: true,
    });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    /* ── Cover / Header ── */
    doc.fontSize(22).fillColor(C.accent).text("InterviewPilot AI");
    doc.fontSize(11).fillColor(C.muted).text("Interview Performance Report");

    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .fillColor(C.muted)
      .text(`Candidate  : ${user?.name || "N/A"}`)
      .text(`Company    : ${interview.company}`)
      .text(`Role       : ${interview.jobRole}`)
      .text(`Round type : ${interview.type.replace("_", " ")}`)
      .text(`Difficulty : ${interview.difficulty}`)
      .text(`Completed  : ${new Date(interview.completedAt).toLocaleString()}`);

    addDivider(doc);

    /* ── Scores ── */
    sectionTitle(doc, "Scores");
    doc
      .fontSize(14)
      .fillColor(scoreColor(evalData.overallScore))
      .text(`Overall Score        ${Math.round(evalData.overallScore)} / 100`);
    doc.moveDown(0.3);
    scoreLine(doc, "Technical Knowledge", evalData.technicalScore);
    scoreLine(doc, "Communication", evalData.communicationScore);
    scoreLine(doc, "Confidence", evalData.confidenceScore);
    scoreLine(doc, "Problem Solving", evalData.problemSolvingScore);
    scoreLine(doc, "HR", evalData.hrScore);
    scoreLine(doc, "Vocabulary", evalData.vocabularyScore);
    scoreLine(doc, "Fluency", evalData.fluencyScore);
    scoreLine(doc, "Answer Quality", evalData.answerQualityScore);

    addDivider(doc);

    /* ── Readiness ── */
    sectionTitle(doc, "Readiness");
    if (evalData.companyReadiness?.score != null) {
      doc
        .fontSize(10)
        .fillColor(scoreColor(evalData.companyReadiness.score))
        .text(
          `${interview.company} readiness: ${Math.round(evalData.companyReadiness.score)} / 100`,
        );
      doc.fillColor(C.text).text(evalData.companyReadiness.verdict || "");
      doc.moveDown(0.3);
    }
    if (evalData.roleReadiness?.score != null) {
      doc
        .fontSize(10)
        .fillColor(scoreColor(evalData.roleReadiness.score))
        .text(
          `${interview.jobRole} readiness: ${Math.round(evalData.roleReadiness.score)} / 100`,
        );
      doc.fillColor(C.text).text(evalData.roleReadiness.verdict || "");
    }

    addDivider(doc);

    /* ── Recruiter feedback & summary ── */
    if (evalData.recruiterFeedback) {
      sectionTitle(doc, "Recruiter Feedback");
      doc.fillColor(C.text).text(evalData.recruiterFeedback, { lineGap: 3 });
      addDivider(doc);
    }

    if (evalData.summary) {
      sectionTitle(doc, "Interview Summary");
      doc.fillColor(C.text).text(evalData.summary, { lineGap: 3 });
      addDivider(doc);
    }

    /* ── Strong / weak areas ── */
    sectionTitle(doc, "Strong Areas");
    chipLine(doc, evalData.strongAreas, "None recorded.");
    doc.moveDown(0.4);
    doc
      .fontSize(12)
      .fillColor(C.accent)
      .text("WEAK AREAS", { characterSpacing: 0.5 });
    doc.moveDown(0.2).fontSize(10);
    chipLine(doc, evalData.weakAreas, "None recorded.");

    addDivider(doc);

    /* ── Strengths / Improvements ── */
    sectionTitle(doc, "Strengths");
    bulletList(doc, evalData.strengths);
    doc.moveDown(0.4);
    doc
      .fontSize(12)
      .fillColor(C.accent)
      .text("IMPROVEMENTS", { characterSpacing: 0.5 });
    doc.moveDown(0.2).fontSize(10);
    bulletList(doc, evalData.improvements);

    /* ── Learning recommendations ── */
    const rec = evalData.recommendations;
    if (rec && (rec.topicsToLearn?.length || rec.roadmap?.length)) {
      addDivider(doc);
      sectionTitle(doc, "Learning Recommendations");

      if (rec.topicsToLearn?.length) {
        doc.fillColor(C.accent).fontSize(10).text("Topics to learn:");
        chipLine(doc, rec.topicsToLearn);
        doc.moveDown(0.3);
      }
      if (rec.resources?.length) {
        doc.fillColor(C.accent).fontSize(10).text("Resources:");
        bulletList(doc, rec.resources);
        doc.moveDown(0.3);
      }
      if (rec.practiceQuestions?.length) {
        doc.fillColor(C.accent).fontSize(10).text("Practice questions:");
        bulletList(doc, rec.practiceQuestions);
        doc.moveDown(0.3);
      }
      if (rec.nextDifficulty) {
        doc
          .fillColor(C.accent)
          .fontSize(10)
          .text(`Recommended next difficulty: ${rec.nextDifficulty}`);
        doc.fillColor(C.text).text(rec.nextDifficultyReason || "");
        doc.moveDown(0.3);
      }
      if (rec.roadmap?.length) {
        doc.fillColor(C.accent).fontSize(10).text("Roadmap:");
        rec.roadmap.forEach((step) => {
          doc
            .fillColor(C.text)
            .text(`${step.step}. ${step.title} - ${step.description}`, {
              indent: 10,
            });
        });
      }
    }

    /* ── Full transcript ── */
    addDivider(doc);
    sectionTitle(doc, "Full Transcript");
    interview.qa.forEach((qa, i) => {
      doc
        .fontSize(10)
        .fillColor(C.accent)
        .text(
          `Q${i + 1} [${qa.category}${qa.isFollowUp ? " - follow-up" : ""}]`,
        );
      doc.fillColor(C.text).text(qa.question, { lineGap: 2 });
      doc
        .fillColor(C.muted)
        .text(qa.answer || "(no answer recorded)", { indent: 10, lineGap: 2 });
      doc.moveDown(0.4);
    });

    /* ── Footer ── */
    addDivider(doc);
    doc
      .fontSize(8)
      .fillColor(C.muted)
      .text(
        "Generated by InterviewPilot AI. Scores are AI-based estimates and do not guarantee real interview outcomes.",
        { align: "center" },
      );

    doc.end();
  });
}

module.exports = { generateInterviewReportPdf };
