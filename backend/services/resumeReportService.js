/**
 * resumeReportService.js
 * ─────────────────────────────────────────────────────────────────────────
 * Generates a downloadable PDF of the resume analysis using pdfkit.
 * Streamed entirely in memory — no temp files written to disk.
 * Kept separate from resumeAnalysisService so scoring logic stays
 * independently testable without pulling in the PDF dependency.
 */

const PDFDocument = require("pdfkit");

/* ── Design tokens ── */
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
    doc.fillColor(C.muted).text(fallback || "None detected.");
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

/**
 * @param {object} resume  - Mongoose Resume document (must have .analysis)
 * @param {object} user    - Mongoose User document
 * @returns {Promise<Buffer>}
 */
function generateResumeAnalysisPdf(resume, user) {
  return new Promise((resolve, reject) => {
    const analysis = resume.analysis;

    if (!analysis) {
      const err = new Error("Resume has not been analyzed yet.");
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
    doc
      .fontSize(22)
      .fillColor(C.accent)
      .text("InterviewPilot AI", { continued: false });
    doc.fontSize(11).fillColor(C.muted).text("Resume Analysis Report");

    doc.moveDown(0.4);
    doc
      .fontSize(9)
      .fillColor(C.muted)
      .text(`Candidate : ${user?.name || "N/A"}`)
      .text(`Email     : ${user?.email || "N/A"}`)
      .text(`Target role: ${analysis.targetRole || "N/A"}`)
      .text(`Generated  : ${new Date(analysis.analyzedAt).toLocaleString()}`);

    addDivider(doc);

    /* ── Scores ── */
    sectionTitle(doc, "Scores");
    doc
      .fontSize(13)
      .fillColor(scoreColor(analysis.atsScore))
      .text(`ATS Score           ${analysis.atsScore} / 100`);
    doc
      .fillColor(scoreColor(analysis.strengthScore))
      .text(`Resume Strength     ${analysis.strengthScore} / 100`);
    doc
      .fontSize(10)
      .fillColor(C.text)
      .moveDown(0.3)
      .text(`Experience Level: ${analysis.experienceLevel}`);

    addDivider(doc);

    /* ── Skill categories ── */
    sectionTitle(doc, "Skill Categories");
    const catLabels = {
      languages: "Languages",
      frameworks: "Frameworks",
      databases: "Databases",
      cloudDevops: "Cloud & DevOps",
      tools: "Tools",
      other: "Other",
    };
    const cats = analysis.skillCategories || {};
    Object.entries(catLabels).forEach(([key, label]) => {
      const items = cats[key] || [];
      if (!items.length) return;
      doc
        .fillColor(C.accent)
        .fontSize(10)
        .text(`${label}:`, { continued: true });
      doc.fillColor(C.text).text(`  ${items.join(", ")}`);
      doc.moveDown(0.15);
    });

    /* ── Soft skills ── */
    doc.moveDown(0.3);
    doc.fillColor(C.accent).fontSize(10).text("Soft Skills:");
    chipLine(doc, analysis.softSkillsDetected, "None detected.");

    addDivider(doc);

    /* ── Keyword match ── */
    sectionTitle(doc, `Keyword Match — ${analysis.targetRole}`);
    doc.fillColor(C.success).fontSize(10).text("Matched:");
    chipLine(doc, analysis.matchedKeywords, "None matched.");
    doc.moveDown(0.4);
    doc.fillColor(C.warning).text("Missing:");
    doc.fillColor(C.text);
    chipLine(doc, analysis.missingSkills, "Nothing missing — great coverage!");

    addDivider(doc);

    /* ── Improvement tips ── */
    sectionTitle(doc, "Top Improvement Tips");
    bulletList(
      doc,
      analysis.improvementTips,
      "No high-priority issues detected.",
    );

    /* ── All suggestions ── */
    if (
      analysis.suggestions &&
      analysis.suggestions.length > (analysis.improvementTips || []).length
    ) {
      doc.moveDown(0.5);
      sectionTitle(doc, "All Suggestions");
      bulletList(doc, analysis.suggestions);
    }

    addDivider(doc);

    /* ── Footer ── */
    doc
      .fontSize(8)
      .fillColor(C.muted)
      .text(
        "Generated by InterviewPilot AI. Scores are rule-based estimates and do not guarantee ATS or recruiter outcomes.",
        { align: "center" },
      );

    doc.end();
  });
}

module.exports = { generateResumeAnalysisPdf };
